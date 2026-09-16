import { supabase } from '@/lib/supabase';
import { User, Product, Recharge, Withdrawal, Wallet, Notification } from '@/types';

// ─── Session helpers (in-memory only) ────────────────────────────────────────
let _currentUser: User | null = null;
let _adminSession = false;

export const getCurrentUser = (): User | null => _currentUser;
export const setCurrentUser = (u: User | null) => { _currentUser = u; };
export const refreshCurrentUser = async (): Promise<User | null> => {
  if (!_currentUser) return null;
  const fresh = await getUserById(_currentUser.id);
  if (fresh) _currentUser = fresh;
  return fresh;
};
export const getAdminSession = (): boolean => _adminSession;
export const setAdminSession = (v: boolean) => { _adminSession = v; };

// ─── Mapper helpers ───────────────────────────────────────────────────────────
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
  referredBy: (row.referred_by as string) ?? null,
  frozen: Boolean(row.frozen),
  claimedMissions: (row.claimed_missions as string[]) ?? [],
  lastCheckIn: (row.last_check_in as string) ?? null,
  registrationBonus: Number(row.registration_bonus ?? 7000),
  createdAt: row.created_at as string,
});

const mapProduct = (row: Record<string, unknown>): Product => ({
  id: row.id as string,
  userId: row.user_id as string,
  packageId: row.package_id as string,
  packageName: row.package_name as string,
  packagePrice: Number(row.package_price ?? 0),
  dailyIncome: Number(row.daily_income ?? 0),
  duration: Number(row.duration ?? 0),
  status: row.status as string,
  buyDate: (row.buy_date as string) ?? null,
  expiryDate: (row.expiry_date as string) ?? null,
  lastIncomeDate: (row.last_income_date as string) ?? null,
  totalIncomeEarned: Number(row.total_income_earned ?? 0),
  paymentProof: (row.payment_proof as string) ?? '',
  createdAt: row.created_at as string,
});

const mapRecharge = (row: Record<string, unknown>): Recharge => ({
  id: row.id as string,
  userId: row.user_id as string,
  amount: Number(row.amount ?? 0),
  network: row.network as string,
  senderPhone: row.sender_phone as string,
  proof: row.proof as string,
  status: row.status as string,
  createdAt: row.created_at as string,
  processedAt: (row.processed_at as string) ?? null,
  userName: (row.user_name as string) ?? '',
  userPhone: (row.user_phone as string) ?? '',
  senderName: (row.sender_name as string) ?? '',
});

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
  processedAt: (row.processed_at as string) ?? null,
  userName: (row.user_name as string) ?? '',
  userPhone: (row.user_phone as string) ?? '',
});

const mapWallet = (row: Record<string, unknown>): Wallet => ({
  id: row.id as string,
  userId: row.user_id as string,
  type: row.type as string,
  phone: row.phone as string,
  name: row.name as string,
  createdAt: row.created_at as string,
});

const mapNotification = (row: Record<string, unknown>): Notification => ({
  id: row.id as string,
  userId: row.user_id as string,
  type: row.type as string,
  title: row.title as string,
  message: row.message as string,
  isRead: Boolean(row.is_read),
  createdAt: row.created_at as string,
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = async (): Promise<User[]> => {
  const { data } = await supabase.from('samsung_users').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapUser);
};

export const getUserById = async (id: string): Promise<User | null> => {
  const { data } = await supabase.from('samsung_users').select('*').eq('id', id).maybeSingle();
  return data ? mapUser(data) : null;
};

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const { data } = await supabase.from('samsung_users').select('*').eq('phone', phone).maybeSingle();
  return data ? mapUser(data) : null;
};

export const getUserByReferralCode = async (code: string): Promise<User | null> => {
  const { data } = await supabase.from('samsung_users').select('*').eq('referral_code', code).maybeSingle();
  return data ? mapUser(data) : null;
};

export const createUser = async (user: User): Promise<void> => {
  await supabase.from('samsung_users').insert({
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
  });
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
  if (updates.frozen !== undefined) dbUpdates.frozen = updates.frozen;
  if (updates.claimedMissions !== undefined) dbUpdates.claimed_missions = updates.claimedMissions;
  if (updates.lastCheckIn !== undefined) dbUpdates.last_check_in = updates.lastCheckIn;
  if (updates.registrationBonus !== undefined) dbUpdates.registration_bonus = updates.registrationBonus;
  await supabase.from('samsung_users').update(dbUpdates).eq('id', id);
  if (_currentUser?.id === id) {
    _currentUser = { ..._currentUser, ...updates };
  }
};

export const deleteUserById = async (id: string): Promise<void> => {
  await supabase.from('samsung_users').delete().eq('id', id);
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const getProducts = async (): Promise<Product[]> => {
  const { data } = await supabase.from('samsung_products').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapProduct);
};

export const getUserProducts = async (userId: string): Promise<Product[]> => {
  const { data } = await supabase.from('samsung_products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapProduct);
};

export const createProduct = async (product: Product): Promise<void> => {
  await supabase.from('samsung_products').insert({
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
    payment_proof: product.paymentProof,
    created_at: product.createdAt,
  });
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.buyDate !== undefined) dbUpdates.buy_date = updates.buyDate;
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
  if (updates.lastIncomeDate !== undefined) dbUpdates.last_income_date = updates.lastIncomeDate;
  if (updates.totalIncomeEarned !== undefined) dbUpdates.total_income_earned = updates.totalIncomeEarned;
  if (updates.paymentProof !== undefined) dbUpdates.payment_proof = updates.paymentProof;
  await supabase.from('samsung_products').update(dbUpdates).eq('id', id);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await supabase.from('samsung_products').delete().eq('id', id);
};

// ─── Recharges ────────────────────────────────────────────────────────────────
export const getRecharges = async (): Promise<Recharge[]> => {
  const { data } = await supabase.from('samsung_recharges').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapRecharge);
};

export const getUserRecharges = async (userId: string): Promise<Recharge[]> => {
  const { data } = await supabase.from('samsung_recharges').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapRecharge);
};

export const createRecharge = async (recharge: Recharge): Promise<void> => {
  await supabase.from('samsung_recharges').insert({
    id: recharge.id,
    user_id: recharge.userId,
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone,
    proof: recharge.proof,
    status: recharge.status,
    created_at: recharge.createdAt,
    user_name: recharge.userName,
    user_phone: recharge.userPhone,
    sender_name: recharge.senderName,
  });
};

export const updateRecharge = async (id: string, updates: Partial<Recharge>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.processedAt !== undefined) dbUpdates.processed_at = updates.processedAt;
  await supabase.from('samsung_recharges').update(dbUpdates).eq('id', id);
};

// ─── Withdrawals ──────────────────────────────────────────────────────────────
export const getWithdrawals = async (): Promise<Withdrawal[]> => {
  const { data } = await supabase.from('samsung_withdrawals').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapWithdrawal);
};

export const getUserWithdrawals = async (userId: string): Promise<Withdrawal[]> => {
  const { data } = await supabase.from('samsung_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapWithdrawal);
};

export const createWithdrawal = async (withdrawal: Withdrawal): Promise<void> => {
  await supabase.from('samsung_withdrawals').insert({
    id: withdrawal.id,
    user_id: withdrawal.userId,
    amount: withdrawal.amount,
    net_amount: withdrawal.netAmount,
    wallet_phone: withdrawal.walletPhone,
    wallet_name: withdrawal.walletName,
    wallet_type: withdrawal.walletType,
    status: withdrawal.status,
    created_at: withdrawal.createdAt,
    user_name: withdrawal.userName,
    user_phone: withdrawal.userPhone,
  });
};

export const updateWithdrawal = async (id: string, updates: Partial<Withdrawal>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.processedAt !== undefined) dbUpdates.processed_at = updates.processedAt;
  await supabase.from('samsung_withdrawals').update(dbUpdates).eq('id', id);
};

// ─── Wallets ──────────────────────────────────────────────────────────────────
export const getWallets = async (): Promise<Wallet[]> => {
  const { data } = await supabase.from('samsung_wallets').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapWallet);
};

export const getUserWallets = async (userId: string): Promise<Wallet[]> => {
  const { data } = await supabase.from('samsung_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapWallet);
};

export const saveWallet = async (wallet: Wallet): Promise<void> => {
  await supabase.from('samsung_wallets').upsert({
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
    created_at: wallet.createdAt,
  });
};

export const deleteWalletsByUser = async (userId: string): Promise<void> => {
  await supabase.from('samsung_wallets').delete().eq('user_id', userId);
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications = async (): Promise<Notification[]> => {
  const { data } = await supabase.from('samsung_notifications').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapNotification);
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const { data } = await supabase.from('samsung_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapNotification);
};

export const addNotification = async (n: Omit<Notification, 'id' | 'createdAt'>): Promise<void> => {
  await supabase.from('samsung_notifications').insert({
    id: crypto.randomUUID(),
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: n.isRead ?? false,
    created_at: new Date().toISOString(),
  });
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await supabase.from('samsung_notifications').update({ is_read: true }).eq('id', id);
};

export const deleteNotificationsByUser = async (userId: string): Promise<void> => {
  await supabase.from('samsung_notifications').delete().eq('user_id', userId);
};

// ─── Redeem Codes ─────────────────────────────────────────────────────────────
export interface RedeemCode {
  id: string;
  code: string;
  amount: number;
  createdAt: string;
  expiresAt: string;
  usedBy: string[];
  isActive: boolean;
}

const mapRedeemCode = (row: Record<string, unknown>): RedeemCode => ({
  id: row.id as string,
  code: row.code as string,
  amount: Number(row.amount ?? 0),
  createdAt: row.created_at as string,
  expiresAt: row.expires_at as string,
  usedBy: (row.used_by as string[]) ?? [],
  isActive: Boolean(row.is_active),
});

export const getRedeemCodes = async (): Promise<RedeemCode[]> => {
  const { data } = await supabase.from('samsung_redeem_codes').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapRedeemCode);
};

export const createRedeemCode = async (code: RedeemCode): Promise<void> => {
  await supabase.from('samsung_redeem_codes').insert({
    id: code.id,
    code: code.code,
    amount: code.amount,
    created_at: code.createdAt,
    expires_at: code.expiresAt,
    used_by: code.usedBy,
    is_active: code.isActive,
  });
};

export const updateRedeemCode = async (id: string, updates: Partial<RedeemCode>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.usedBy !== undefined) dbUpdates.used_by = updates.usedBy;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  await supabase.from('samsung_redeem_codes').update(dbUpdates).eq('id', id);
};

export const deleteRedeemCodeById = async (id: string): Promise<void> => {
  await supabase.from('samsung_redeem_codes').delete().eq('id', id);
};

// ─── Daily Income Processing ──────────────────────────────────────────────────
export const processDailyIncome = async (): Promise<void> => {
  const products = await getProducts();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  for (const product of products) {
    if (product.status !== 'active') continue;
    const lastDate = product.lastIncomeDate ? product.lastIncomeDate.split('T')[0] : null;
    if (lastDate === todayStr) continue;

    const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;
    if (expiryDate && now > expiryDate) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const income = product.dailyIncome;
    const newTotal = product.totalIncomeEarned + income;
    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: newTotal,
    });

    const user = await getUserById(product.userId);
    if (user) {
      await updateUser(user.id, {
        balance: user.balance + income,
        totalEarnings: user.totalEarnings + income,
        dailyEarnings: user.dailyEarnings + income,
      });

      await addNotification({
        userId: user.id,
        type: 'income',
        title: 'Daily Income Received',
        message: `You received UGX ${income.toLocaleString()} daily income from ${product.packageName}.`,
        isRead: false,
      });

      // Referral commissions: L1 30%, L2 2%, L3 1%
      if (user.referredBy) {
        const l1 = await getUserById(user.referredBy);
        if (l1) {
          const l1Commission = Math.round(income * 0.30);
          await updateUser(l1.id, {
            balance: l1.balance + l1Commission,
            referralEarnings: l1.referralEarnings + l1Commission,
            totalEarnings: l1.totalEarnings + l1Commission,
          });
          await addNotification({
            userId: l1.id,
            type: 'referral',
            title: 'Referral Commission (L1)',
            message: `You earned UGX ${l1Commission.toLocaleString()} L1 commission from ${user.name}.`,
            isRead: false,
          });

          if (l1.referredBy) {
            const l2 = await getUserById(l1.referredBy);
            if (l2) {
              const l2Commission = Math.round(income * 0.02);
              await updateUser(l2.id, {
                balance: l2.balance + l2Commission,
                referralEarnings: l2.referralEarnings + l2Commission,
                totalEarnings: l2.totalEarnings + l2Commission,
              });
              await addNotification({
                userId: l2.id,
                type: 'referral',
                title: 'Referral Commission (L2)',
                message: `You earned UGX ${l2Commission.toLocaleString()} L2 commission from ${user.name}.`,
                isRead: false,
              });

              if (l2.referredBy) {
                const l3 = await getUserById(l2.referredBy);
                if (l3) {
                  const l3Commission = Math.round(income * 0.01);
                  await updateUser(l3.id, {
                    balance: l3.balance + l3Commission,
                    referralEarnings: l3.referralEarnings + l3Commission,
                    totalEarnings: l3.totalEarnings + l3Commission,
                  });
                  await addNotification({
                    userId: l3.id,
                    type: 'referral',
                    title: 'Referral Commission (L3)',
                    message: `You earned UGX ${l3Commission.toLocaleString()} L3 commission from ${user.name}.`,
                    isRead: false,
                  });
                }
              }
            }
          }
        }
      }
    }
  }
};

export interface DailyIncomeStats {
  processed: number;
  totalPaid: number;
  errors: string[];
}

export const runDailyIncomeWithStats = async (): Promise<DailyIncomeStats> => {
  const products = await getProducts();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let processed = 0;
  let totalPaid = 0;
  const errors: string[] = [];

  for (const product of products) {
    if (product.status !== 'active') continue;
    const lastDate = product.lastIncomeDate ? product.lastIncomeDate.split('T')[0] : null;
    if (lastDate === todayStr) continue;

    const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;
    if (expiryDate && now > expiryDate) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const income = product.dailyIncome;
    const newTotal = product.totalIncomeEarned + income;
    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: newTotal,
    });

    const user = await getUserById(product.userId);
    if (user) {
      await updateUser(user.id, {
        balance: user.balance + income,
        totalEarnings: user.totalEarnings + income,
        dailyEarnings: user.dailyEarnings + income,
      });
      await addNotification({
        userId: user.id,
        type: 'income',
        title: 'Daily Income Received',
        message: `You received UGX ${income.toLocaleString()} daily income from ${product.packageName}.`,
        isRead: false,
      });
      processed++;
      totalPaid += income;
    } else {
      errors.push(`User not found for product ${product.id}`);
    }
  }

  return { processed, totalPaid, errors };
};
