import { supabase } from '@/lib/supabase';
import { User, Product, Recharge, Withdrawal, Wallet, Notification, RedeemCode } from '@/types';

// Session helpers (in-memory)
let currentUser: User | null = null;
let adminSession: boolean = false;

export const getCurrentUser = (): User | null => currentUser;
export const setCurrentUser = (user: User | null) => { currentUser = user; };
export const refreshCurrentUser = async (): Promise<User | null> => {
  if (!currentUser) return null;
  const user = await getUserById(currentUser.id);
  if (user) currentUser = user;
  return user;
};
export const getAdminSession = (): boolean => adminSession;
export const setAdminSession = (val: boolean) => { adminSession = val; };

// ─── USERS ───────────────────────────────────────────────────────────────────

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('engle_users').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getUsers error:', error); return []; }
  return (data || []).map(mapUser);
};

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase.from('engle_users').select('*').eq('id', id).single();
  if (error) { console.error('getUserById error:', error); return null; }
  return data? mapUser(data) : null;
};

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const { data, error } = await supabase.from('engle_users').select('*').eq('phone', phone).maybeSingle();
  if (error) { console.error('getUserByPhone error:', error); return null; }
  return data? mapUser(data) : null;
};

export const getUserByReferralCode = async (code: string): Promise<User | null> => {
  const { data, error } = await supabase.from('engle_users').select('*').eq('referral_code', code).maybeSingle();
  if (error) { console.error('getUserByReferralCode error:', error); return null; }
  return data? mapUser(data) : null;
};

export const createUser = async (user: User): Promise<void> => {
  const { error } = await supabase.from('engle_users').insert([{
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
    created_at: user.createdAt,
  }]);
  if (error) console.error('createUser error:', error);
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name!== undefined) dbUpdates.name = updates.name;
  if (updates.phone!== undefined) dbUpdates.phone = updates.phone;
  if (updates.password!== undefined) dbUpdates.password = updates.password;
  if (updates.balance!== undefined) dbUpdates.balance = updates.balance;
  if (updates.totalEarnings!== undefined) dbUpdates.total_earnings = updates.totalEarnings;
  if (updates.dailyEarnings!== undefined) dbUpdates.daily_earnings = updates.dailyEarnings;
  if (updates.referralEarnings!== undefined) dbUpdates.referral_earnings = updates.referralEarnings;
  if (updates.totalWithdrawal!== undefined) dbUpdates.total_withdrawal = updates.totalWithdrawal;
  if (updates.referralCode!== undefined) dbUpdates.referral_code = updates.referralCode;
  if (updates.referredBy!== undefined) dbUpdates.referred_by = updates.referredBy;
  if (updates.frozen!== undefined) dbUpdates.frozen = updates.frozen;
  if (updates.claimedMissions!== undefined) dbUpdates.claimed_missions = updates.claimedMissions;
  if (updates.lastCheckIn!== undefined) dbUpdates.last_check_in = updates.lastCheckIn;
  if (updates.registrationBonus!== undefined) dbUpdates.registration_bonus = updates.registrationBonus;
  const { error } = await supabase.from('engle_users').update(dbUpdates).eq('id', id);
  if (error) console.error('updateUser error:', error);
};

export const deleteUserById = async (id: string): Promise<void> => {
  const { error } = await supabase.from('engle_users').delete().eq('id', id);
  if (error) console.error('deleteUserById error:', error);
};

const mapUser = (row: Record<string, unknown>): User => ({
  id: row.id as string,
  name: row.name as string,
  phone: row.phone as string,
  password: row.password as string,
  balance: Number(row.balance),
  totalEarnings: Number(row.total_earnings),
  dailyEarnings: Number(row.daily_earnings),
  referralEarnings: Number(row.referral_earnings),
  totalWithdrawal: Number(row.total_withdrawal),
  referralCode: row.referral_code as string,
  referredBy: (row.referred_by as string) || null,
  frozen: Boolean(row.frozen),
  claimedMissions: (row.claimed_missions as string[]) || [],
  lastCheckIn: (row.last_check_in as string) || null,
  registrationBonus: Number(row.registration_bonus),
  createdAt: row.created_at as string,
});

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('engle_products').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getProducts error:', error); return []; }
  return (data || []).map(mapProduct);
};

export const getUserProducts = async (userId: string): Promise<Product[]> => {
  const { data, error } = await supabase.from('engle_products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('getUserProducts error:', error); return []; }
  return (data || []).map(mapProduct);
};

export const createProduct = async (product: Product): Promise<void> => {
  const { error } = await supabase.from('engle_products').insert([{
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
  }]);
  if (error) console.error('createProduct error:', error);
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status!== undefined) dbUpdates.status = updates.status;
  if (updates.buyDate!== undefined) dbUpdates.buy_date = updates.buyDate;
  if (updates.expiryDate!== undefined) dbUpdates.expiry_date = updates.expiryDate;
  if (updates.lastIncomeDate!== undefined) dbUpdates.last_income_date = updates.lastIncomeDate;
  if (updates.totalIncomeEarned!== undefined) dbUpdates.total_income_earned = updates.totalIncomeEarned;
  if (updates.paymentProof!== undefined) dbUpdates.payment_proof = updates.paymentProof;
  const { error } = await supabase.from('engle_products').update(dbUpdates).eq('id', id);
  if (error) console.error('updateProduct error:', error);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('engle_products').delete().eq('id', id);
  if (error) console.error('deleteProduct error:', error);
};

const mapProduct = (row: Record<string, unknown>): Product => ({
  id: row.id as string,
  userId: row.user_id as string,
  packageId: row.package_id as string,
  packageName: row.package_name as string,
  packagePrice: Number(row.package_price),
  dailyIncome: Number(row.daily_income),
  duration: Number(row.duration),
  status: row.status as Product['status'],
  buyDate: (row.buy_date as string) || null,
  expiryDate: (row.expiry_date as string) || null,
  lastIncomeDate: (row.last_income_date as string) || null,
  totalIncomeEarned: Number(row.total_income_earned),
  paymentProof: (row.payment_proof as string) || '',
  createdAt: row.created_at as string,
});

// ─── RECHARGES ───────────────────────────────────────────────────────────────

export const getRecharges = async (): Promise<Recharge[]> => {
  const { data, error } = await supabase.from('engle_recharges').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getRecharges error:', error); return []; }
  return (data || []).map(mapRecharge);
};

export const getUserRecharges = async (userId: string): Promise<Recharge[]> => {
  const { data, error } = await supabase.from('engle_recharges').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('getUserRecharges error:', error); return []; }
  return (data || []).map(mapRecharge);
};

export const createRecharge = async (recharge: Recharge): Promise<void> => {
  const { error } = await supabase.from('engle_recharges').insert([{
    id: recharge.id,
    user_id: recharge.userId,
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone,
    proof: recharge.proof || '',
    status: recharge.status,
    user_name: recharge.userName || '',
    user_phone: recharge.userPhone || '',
    sender_name: recharge.senderName || '',
  }]);
  if (error) console.error('createRecharge error:', error);
};

export const updateRecharge = async (id: string, updates: Partial<Recharge>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status!== undefined) dbUpdates.status = updates.status;
  if (updates.processedAt!== undefined) dbUpdates.processed_at = updates.processedAt;
  if (updates.proof!== undefined) dbUpdates.proof = updates.proof;
  const { error } = await supabase.from('engle_recharges').update(dbUpdates).eq('id', id);
  if (error) console.error('updateRecharge error:', error);
};

const mapRecharge = (row: Record<string, unknown>): Recharge => ({
  id: row.id as string,
  userId: row.user_id as string,
  amount: Number(row.amount),
  network: row.network as string,
  senderPhone: row.sender_phone as string,
  proof: (row.proof as string) || '',
  status: row.status as Recharge['status'],
  userName: (row.user_name as string) || '',
  userPhone: (row.user_phone as string) || '',
  senderName: (row.sender_name as string) || '',
  createdAt: row.created_at as string,
  processedAt: (row.processed_at as string) || null,
});

// ─── WITHDRAWALS ─────────────────────────────────────────────────────────────

export const getWithdrawals = async (): Promise<Withdrawal[]> => {
  const { data, error } = await supabase.from('engle_withdrawals').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getWithdrawals error:', error); return []; }
  return (data || []).map(mapWithdrawal);
};

export const getUserWithdrawals = async (userId: string): Promise<Withdrawal[]> => {
  const { data, error } = await supabase.from('engle_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('getUserWithdrawals error:', error); return []; }
  return (data || []).map(mapWithdrawal);
};

export const createWithdrawal = async (withdrawal: Withdrawal): Promise<void> => {
  const { error } = await supabase.from('engle_withdrawals').insert([{
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
  }]);
  if (error) console.error('createWithdrawal error:', error);
};

export const updateWithdrawal = async (id: string, updates: Partial<Withdrawal>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status!== undefined) dbUpdates.status = updates.status;
  if (updates.processedAt!== undefined) dbUpdates.processed_at = updates.processedAt;
  const { error } = await supabase.from('engle_withdrawals').update(dbUpdates).eq('id', id);
  if (error) console.error('updateWithdrawal error:', error);
};

const mapWithdrawal = (row: Record<string, unknown>): Withdrawal => ({
  id: row.id as string,
  userId: row.user_id as string,
  amount: Number(row.amount),
  netAmount: Number(row.net_amount),
  walletPhone: row.wallet_phone as string,
  walletName: row.wallet_name as string,
  walletType: row.wallet_type as string,
  status: row.status as Withdrawal['status'],
  userName: (row.user_name as string) || '',
  userPhone: (row.user_phone as string) || '',
  createdAt: row.created_at as string,
  processedAt: (row.processed_at as string) || null,
});

// ─── WALLETS ─────────────────────────────────────────────────────────────────

export const getWallets = async (): Promise<Wallet[]> => {
  const { data, error } = await supabase.from('engle_wallets').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getWallets error:', error); return []; }
  return (data || []).map(mapWallet);
};

export const getUserWallets = async (userId: string): Promise<Wallet[]> => {
  const { data, error } = await supabase.from('engle_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('getUserWallets error:', error); return []; }
  return (data || []).map(mapWallet);
};

export const saveWallet = async (wallet: Wallet): Promise<void> => {
  const { error } = await supabase.from('engle_wallets').upsert([{
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
  }]);
  if (error) console.error('saveWallet error:', error);
};

export const deleteWalletsByUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('engle_wallets').delete().eq('user_id', userId);
  if (error) console.error('deleteWalletsByUser error:', error);
};

const mapWallet = (row: Record<string, unknown>): Wallet => ({
  id: row.id as string,
  userId: row.user_id as string,
  type: row.type as string,
  phone: row.phone as string,
  name: row.name as string,
  createdAt: row.created_at as string,
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

export const getNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase.from('engle_notifications').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getNotifications error:', error); return []; }
  return (data || []).map(mapNotification);
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase.from('engle_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('getUserNotifications error:', error); return []; }
  return (data || []).map(mapNotification);
};

export const addNotification = async (notif: Omit<Notification, 'id' | 'createdAt'>): Promise<void> => {
  const { error } = await supabase.from('engle_notifications').insert([{
    id: crypto.randomUUID(),
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    is_read: notif.isRead,
  }]);
  if (error) console.error('addNotification error:', error);
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const { error } = await supabase.from('engle_notifications').update({ is_read: true }).eq('id', id);
  if (error) console.error('markNotificationRead error:', error);
};

export const deleteNotificationsByUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('engle_notifications').delete().eq('user_id', userId);
  if (error) console.error('deleteNotificationsByUser error:', error);
};

const mapNotification = (row: Record<string, unknown>): Notification => ({
  id: row.id as string,
  userId: row.user_id as string,
  type: row.type as string,
  title: row.title as string,
  message: row.message as string,
  isRead: Boolean(row.is_read),
  createdAt: row.created_at as string,
});

// ─── REDEEM CODES ─────────────────────────────────────────────────────────────

export const getRedeemCodes = async (): Promise<RedeemCode[]> => {
  const { data, error } = await supabase.from('engle_redeem_codes').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getRedeemCodes error:', error); return []; }
  return (data || []).map(mapRedeemCode);
};

export const createRedeemCode = async (code: RedeemCode): Promise<void> => {
  const { error } = await supabase.from('engle_redeem_codes').insert([{
    id: code.id,
    code: code.code,
    amount: code.amount,
    expires_at: code.expiresAt,
    used_by: code.usedBy,
    is_active: code.isActive,
  }]);
  if (error) console.error('createRedeemCode error:', error);
};

export const updateRedeemCode = async (id: string, updates: Partial<RedeemCode>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.isActive!== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.usedBy!== undefined) dbUpdates.used_by = updates.usedBy;
  const { error } = await supabase.from('engle_redeem_codes').update(dbUpdates).eq('id', id);
  if (error) console.error('updateRedeemCode error:', error);
};

export const deleteRedeemCodeById = async (id: string): Promise<void> => {
  const { error } = await supabase.from('engle_redeem_codes').delete().eq('id', id);
  if (error) console.error('deleteRedeemCodeById error:', error);
};

const mapRedeemCode = (row: Record<string, unknown>): RedeemCode => ({
  id: row.id as string,
  code: row.code as string,
  amount: Number(row.amount),
  expiresAt: row.expires_at as string,
  usedBy: (row.used_by as string[]) || [],
  isActive: Boolean(row.is_active),
  createdAt: row.created_at as string,
});

// ─── DAILY INCOME ─────────────────────────────────────────────────────────────

export const processDailyIncome = async (): Promise<void> => {
  const products = await getProducts();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  for (const product of products) {
    if (product.status!== 'active') continue;
    if (product.lastIncomeDate === todayStr) continue;
    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const user = await getUserById(product.userId);
    if (!user) continue;

    const income = product.dailyIncome;
    const newTotal = product.totalIncomeEarned + income;

    await updateProduct(product.id, {
      lastIncomeDate: todayStr,
      totalIncomeEarned: newTotal,
    });

    await updateUser(product.userId, {
      balance: user.balance + income,
      totalEarnings: user.totalEarnings + income,
      dailyEarnings: user.dailyEarnings + income,
    });

    await addNotification({
      userId: product.userId,
      type: 'income',
      title: 'Daily Income Received',
      message: `You received UGX ${income.toLocaleString()} daily income from ${product.packageName}.`,
      isRead: false,
    });
  }
};

export const runDailyIncomeWithStats = async (): Promise<{ processed: number; totalPaid: number }> => {
  const products = await getProducts();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let processed = 0;
  let totalPaid = 0;

  for (const product of products) {
    if (product.status!== 'active') continue;
    if (product.lastIncomeDate === todayStr) continue;
    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const user = await getUserById(product.userId);
    if (!user) continue;

    const income = product.dailyIncome;
    const newTotal = product.totalIncomeEarned + income;

    await updateProduct(product.id, {
      lastIncomeDate: todayStr,
      totalIncomeEarned: newTotal,
    });

    await updateUser(product.userId, {
      balance: user.balance + income,
      totalEarnings: user.totalEarnings + income,
      dailyEarnings: user.dailyEarnings + income,
    });

    await addNotification({
      userId: product.userId,
      type: 'income',
      title: 'Daily Income Received',
      message: `You received UGX ${income.toLocaleString()} daily income from ${product.packageName}.`,
      isRead: false,
    });

    processed++;
    totalPaid += income;
  }

  return { processed, totalPaid };
};
