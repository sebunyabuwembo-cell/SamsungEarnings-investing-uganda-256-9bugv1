import { supabase } from '@/lib/supabase';
import { User, Product, Recharge, Withdrawal, Wallet, Notification, RedeemCode } from '@/types';

// ─── Session helpers (localStorage) ───────────────────────────────────────────

export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

export const refreshCurrentUser = async (): Promise<User | null> => {
  const current = getCurrentUser();
  if (!current) return null;
  const fresh = await getUserById(current.id);
  if (fresh) setCurrentUser(fresh);
  return fresh;
};

export const getAdminSession = (): boolean => {
  return localStorage.getItem('adminSession') === 'true';
};

export const setAdminSession = (value: boolean): void => {
  if (value) {
    localStorage.setItem('adminSession', 'true');
  } else {
    localStorage.removeItem('adminSession');
  }
};

// ─── Users ────────────────────────────────────────────────────────────────────

const mapUser = (row: Record<string, unknown>): User => ({
  id: row.id as string,
  name: row.name as string,
  phone: row.phone as string,
  password: row.password as string,
  balance: Number(row.balance ?? 0),
  totalEarnings: Number(row.total_earnings ?? 0),
  dailyEarnings: Number(row.daily_earnings ?? 0),
  referralEarnings: Number(row.referral_earnings ?? 0),
  totalWithdrawal: Number(row.total_withdrawal ?? 0),
  referralCode: row.referral_code as string,
  referredBy: (row.referred_by as string) || null,
  frozen: Boolean(row.frozen),
  claimedMissions: (row.claimed_missions as string[]) || [],
  lastCheckIn: (row.last_check_in as string) || null,
  registrationBonus: Number(row.registration_bonus ?? 7000),
  createdAt: row.created_at as string,
});

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getUsers:', error); return []; }
  return (data || []).map(mapUser);
};

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('getUserById:', error); return null; }
  return data ? mapUser(data) : null;
};

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) { console.error('getUserByPhone:', error); return null; }
  return data ? mapUser(data) : null;
};

export const getUserByReferralCode = async (code: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('referral_code', code)
    .maybeSingle();
  if (error) { console.error('getUserByReferralCode:', error); return null; }
  return data ? mapUser(data) : null;
};

export const createUser = async (user: User): Promise<void> => {
  const { error } = await supabase.from('samsung_users').insert({
    id: user.id,
    name: user.name,
    phone: user.phone,
    password: user.password,
    balance: user.balance,
    total_earnings: user.totalEarnings,
    daily_earnings: user.dailyEarnings,
    referral_earnings: user.referralEarnings,
    total_withdrawal: user.totalWithdrawal,
    referral_code: user.referralCode,
    referred_by: user.referredBy,
    frozen: user.frozen,
    claimed_missions: user.claimedMissions,
    last_check_in: user.lastCheckIn,
    registration_bonus: user.registrationBonus,
  });
  if (error) console.error('createUser:', error);
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.password !== undefined) dbUpdates.password = updates.password;
  if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
  if (updates.totalEarnings !== undefined) dbUpdates.total_earnings = updates.totalEarnings;
  if (updates.dailyEarnings !== undefined) dbUpdates.daily_earnings = updates.dailyEarnings;
  if (updates.referralEarnings !== undefined) dbUpdates.referral_earnings = updates.referralEarnings;
  if (updates.totalWithdrawal !== undefined) dbUpdates.total_withdrawal = updates.totalWithdrawal;
  if (updates.referralCode !== undefined) dbUpdates.referral_code = updates.referralCode;
  if (updates.referredBy !== undefined) dbUpdates.referred_by = updates.referredBy;
  if (updates.frozen !== undefined) dbUpdates.frozen = updates.frozen;
  if (updates.claimedMissions !== undefined) dbUpdates.claimed_missions = updates.claimedMissions;
  if (updates.lastCheckIn !== undefined) dbUpdates.last_check_in = updates.lastCheckIn;
  if (updates.registrationBonus !== undefined) dbUpdates.registration_bonus = updates.registrationBonus;

  const { error } = await supabase.from('samsung_users').update(dbUpdates).eq('id', id);
  if (error) console.error('updateUser:', error);
};

export const deleteUserById = async (id: string): Promise<void> => {
  const { error } = await supabase.from('samsung_users').delete().eq('id', id);
  if (error) console.error('deleteUserById:', error);
};

// ─── Products ─────────────────────────────────────────────────────────────────

const mapProduct = (row: Record<string, unknown>): Product => ({
  id: row.id as string,
  userId: row.user_id as string,
  packageId: row.package_id as string,
  packageName: row.package_name as string,
  packagePrice: Number(row.package_price ?? 0),
  dailyIncome: Number(row.daily_income ?? 0),
  duration: Number(row.duration ?? 0),
  status: row.status as string,
  buyDate: (row.buy_date as string) || null,
  expiryDate: (row.expiry_date as string) || null,
  lastIncomeDate: (row.last_income_date as string) || null,
  totalIncomeEarned: Number(row.total_income_earned ?? 0),
  createdAt: row.created_at as string,
  paymentProof: (row.payment_proof as string) || '',
});

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getProducts:', error); return []; }
  return (data || []).map(mapProduct);
};

export const getUserProducts = async (userId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserProducts:', error); return []; }
  return (data || []).map(mapProduct);
};

export const createProduct = async (product: Product): Promise<void> => {
  const { error } = await supabase.from('samsung_products').insert({
    id: product.id,
    user_id: product.userId,
    package_id: product.packageId,
    package_name: product.packageName,
    package_price: product.packagePrice,
    daily_income: product.dailyIncome,
    duration: product.duration,
    status: product.status,
    buy_date: product.buyDate,
    expiry_date: product.expiryDate,
    last_income_date: product.lastIncomeDate,
    total_income_earned: product.totalIncomeEarned,
    payment_proof: product.paymentProof || '',
  });
  if (error) console.error('createProduct:', error);
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.buyDate !== undefined) dbUpdates.buy_date = updates.buyDate;
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
  if (updates.lastIncomeDate !== undefined) dbUpdates.last_income_date = updates.lastIncomeDate;
  if (updates.totalIncomeEarned !== undefined) dbUpdates.total_income_earned = updates.totalIncomeEarned;
  if (updates.paymentProof !== undefined) dbUpdates.payment_proof = updates.paymentProof;

  const { error } = await supabase.from('samsung_products').update(dbUpdates).eq('id', id);
  if (error) console.error('updateProduct:', error);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('samsung_products').delete().eq('id', id);
  if (error) console.error('deleteProduct:', error);
};

// ─── Recharges ────────────────────────────────────────────────────────────────

const mapRecharge = (row: Record<string, unknown>): Recharge => ({
  id: row.id as string,
  userId: row.user_id as string,
  amount: Number(row.amount ?? 0),
  network: row.network as string,
  senderPhone: row.sender_phone as string,
  senderName: (row.sender_name as string) || '',
  proof: (row.proof as string) || '',
  status: row.status as string,
  createdAt: row.created_at as string,
  processedAt: (row.processed_at as string) || null,
  userName: (row.user_name as string) || '',
  userPhone: (row.user_phone as string) || '',
});

export const getRecharges = async (): Promise<Recharge[]> => {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRecharges:', error); return []; }
  return (data || []).map(mapRecharge);
};

export const getUserRecharges = async (userId: string): Promise<Recharge[]> => {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserRecharges:', error); return []; }
  return (data || []).map(mapRecharge);
};

export const createRecharge = async (recharge: Recharge): Promise<void> => {
  const { error } = await supabase.from('samsung_recharges').insert({
    id: recharge.id,
    user_id: recharge.userId,
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone,
    sender_name: recharge.senderName || '',
    proof: recharge.proof || '',
    status: recharge.status,
    user_name: recharge.userName || '',
    user_phone: recharge.userPhone || '',
  });
  if (error) console.error('createRecharge:', error);
};

export const updateRecharge = async (id: string, updates: Partial<Recharge>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.processedAt !== undefined) dbUpdates.processed_at = updates.processedAt;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;

  const { error } = await supabase.from('samsung_recharges').update(dbUpdates).eq('id', id);
  if (error) console.error('updateRecharge:', error);
};

// ─── Withdrawals ──────────────────────────────────────────────────────────────

const mapWithdrawal = (row: Record<string, unknown>): Withdrawal => ({
  id: row.id as string,
  userId: row.user_id as string,
  amount: Number(row.amount ?? 0),
  netAmount: Number(row.net_amount ?? 0),
  walletPhone: row.wallet_phone as string,
  walletName: row.wallet_name as string,
  walletType: row.wallet_type as string,
  status: row.status as string,
  createdAt: row.created_at as string,
  processedAt: (row.processed_at as string) || null,
  userName: (row.user_name as string) || '',
  userPhone: (row.user_phone as string) || '',
});

export const getWithdrawals = async (): Promise<Withdrawal[]> => {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWithdrawals:', error); return []; }
  return (data || []).map(mapWithdrawal);
};

export const getUserWithdrawals = async (userId: string): Promise<Withdrawal[]> => {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWithdrawals:', error); return []; }
  return (data || []).map(mapWithdrawal);
};

export const createWithdrawal = async (withdrawal: Withdrawal): Promise<void> => {
  const { error } = await supabase.from('samsung_withdrawals').insert({
    id: withdrawal.id,
    user_id: withdrawal.userId,
    amount: withdrawal.amount,
    net_amount: withdrawal.netAmount,
    wallet_phone: withdrawal.walletPhone,
    wallet_name: withdrawal.walletName,
    wallet_type: withdrawal.walletType,
    status: withdrawal.status,
    user_name: withdrawal.userName || '',
    user_phone: withdrawal.userPhone || '',
  });
  if (error) console.error('createWithdrawal:', error);
};

export const updateWithdrawal = async (id: string, updates: Partial<Withdrawal>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.processedAt !== undefined) dbUpdates.processed_at = updates.processedAt;

  const { error } = await supabase.from('samsung_withdrawals').update(dbUpdates).eq('id', id);
  if (error) console.error('updateWithdrawal:', error);
};

// ─── Wallets ──────────────────────────────────────────────────────────────────

const mapWallet = (row: Record<string, unknown>): Wallet => ({
  id: row.id as string,
  userId: row.user_id as string,
  type: row.type as string,
  phone: row.phone as string,
  name: row.name as string,
  createdAt: row.created_at as string,
});

export const getWallets = async (): Promise<Wallet[]> => {
  const { data, error } = await supabase.from('samsung_wallets').select('*');
  if (error) { console.error('getWallets:', error); return []; }
  return (data || []).map(mapWallet);
};

export const getUserWallets = async (userId: string): Promise<Wallet[]> => {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .eq('user_id', userId);
  if (error) { console.error('getUserWallets:', error); return []; }
  return (data || []).map(mapWallet);
};

export const saveWallet = async (wallet: Wallet): Promise<void> => {
  const { error } = await supabase.from('samsung_wallets').upsert({
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
  });
  if (error) console.error('saveWallet:', error);
};

export const deleteWalletsByUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('samsung_wallets').delete().eq('user_id', userId);
  if (error) console.error('deleteWalletsByUser:', error);
};

// ─── Notifications ────────────────────────────────────────────────────────────

const mapNotification = (row: Record<string, unknown>): Notification => ({
  id: row.id as string,
  userId: row.user_id as string,
  type: row.type as string,
  title: row.title as string,
  message: row.message as string,
  isRead: Boolean(row.is_read),
  createdAt: row.created_at as string,
});

export const getNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getNotifications:', error); return []; }
  return (data || []).map(mapNotification);
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserNotifications:', error); return []; }
  return (data || []).map(mapNotification);
};

export const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> => {
  const { error } = await supabase.from('samsung_notifications').insert({
    id: crypto.randomUUID(),
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    is_read: notification.isRead ?? false,
  });
  if (error) console.error('addNotification:', error);
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('samsung_notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) console.error('markNotificationRead:', error);
};

export const deleteNotificationsByUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('samsung_notifications').delete().eq('user_id', userId);
  if (error) console.error('deleteNotificationsByUser:', error);
};

// ─── Redeem Codes ─────────────────────────────────────────────────────────────

const mapRedeemCode = (row: Record<string, unknown>): RedeemCode => ({
  id: row.id as string,
  code: row.code as string,
  amount: Number(row.amount ?? 0),
  createdAt: row.created_at as string,
  expiresAt: row.expires_at as string,
  usedBy: (row.used_by as string[]) || [],
  isActive: Boolean(row.is_active),
});

export const getRedeemCodes = async (): Promise<RedeemCode[]> => {
  const { data, error } = await supabase
    .from('samsung_redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRedeemCodes:', error); return []; }
  return (data || []).map(mapRedeemCode);
};

export const createRedeemCode = async (code: RedeemCode): Promise<void> => {
  const { error } = await supabase.from('samsung_redeem_codes').insert({
    id: code.id,
    code: code.code,
    amount: code.amount,
    expires_at: code.expiresAt,
    used_by: code.usedBy || [],
    is_active: code.isActive,
  });
  if (error) console.error('createRedeemCode:', error);
};

export const updateRedeemCode = async (id: string, updates: Partial<RedeemCode>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.usedBy !== undefined) dbUpdates.used_by = updates.usedBy;

  const { error } = await supabase.from('samsung_redeem_codes').update(dbUpdates).eq('id', id);
  if (error) console.error('updateRedeemCode:', error);
};

export const deleteRedeemCodeById = async (id: string): Promise<void> => {
  const { error } = await supabase.from('samsung_redeem_codes').delete().eq('id', id);
  if (error) console.error('deleteRedeemCodeById:', error);
};

// ─── Daily Income ─────────────────────────────────────────────────────────────

export const processDailyIncome = async (): Promise<void> => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const products = await getProducts();
  const activeProducts = products.filter(p => p.status === 'active');

  for (const product of activeProducts) {
    if (product.lastIncomeDate === todayStr) continue;

    const expiry = product.expiryDate ? new Date(product.expiryDate) : null;
    if (expiry && now > expiry) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const user = await getUserById(product.userId);
    if (!user || user.frozen) continue;

    const newTotal = product.totalIncomeEarned + product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: todayStr,
      totalIncomeEarned: newTotal,
    });

    await updateUser(product.userId, {
      balance: user.balance + product.dailyIncome,
      totalEarnings: user.totalEarnings + product.dailyIncome,
      dailyEarnings: user.dailyEarnings + product.dailyIncome,
    });

    await addNotification({
      userId: product.userId,
      type: 'income',
      title: 'Daily Income Received',
      message: `You received UGX ${product.dailyIncome.toLocaleString()} daily income from ${product.packageName}.`,
      isRead: false,
    });
  }
};

export const runDailyIncomeWithStats = async (): Promise<{ processed: number; totalPaid: number }> => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const products = await getProducts();
  const activeProducts = products.filter(p => p.status === 'active');

  let processed = 0;
  let totalPaid = 0;

  for (const product of activeProducts) {
    if (product.lastIncomeDate === todayStr) continue;

    const expiry = product.expiryDate ? new Date(product.expiryDate) : null;
    if (expiry && now > expiry) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const user = await getUserById(product.userId);
    if (!user || user.frozen) continue;

    const newTotal = product.totalIncomeEarned + product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: todayStr,
      totalIncomeEarned: newTotal,
    });

    await updateUser(product.userId, {
      balance: user.balance + product.dailyIncome,
      totalEarnings: user.totalEarnings + product.dailyIncome,
      dailyEarnings: user.dailyEarnings + product.dailyIncome,
    });

    await addNotification({
      userId: product.userId,
      type: 'income',
      title: 'Daily Income Received',
      message: `You received UGX ${product.dailyIncome.toLocaleString()} daily income from ${product.packageName}.`,
      isRead: false,
    });

    processed++;
    totalPaid += product.dailyIncome;
  }

  return { processed, totalPaid };
};
