/**
 * storage.ts — Centralised async data layer backed by Supabase (OnSpace Cloud).
 * All CRUD operations for the Samsung Earnings platform.
 */

import { createClient } from '@supabase/supabase-js';
import { User, UserProduct, Notification, Recharge, Wallet, Withdrawal, RedeemCode } from '@/types';

// ─── Supabase client ─────────────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Session helpers (in-memory / sessionStorage) ───────────────────────────
const SESSION_KEY = 'samsung_current_user';
const ADMIN_SESSION_KEY = 'samsung_admin_session';

export function getCurrentUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export async function refreshCurrentUser(): Promise<User | null> {
  const cached = getCurrentUser();
  if (!cached) return null;
  const fresh = await getUserById(cached.id);
  if (fresh) setCurrentUser(fresh);
  return fresh;
}

export function getAdminSession(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function setAdminSession(val: boolean): void {
  if (val) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    password: row.password,
    balance: Number(row.balance ?? 0),
    totalEarnings: Number(row.total_earnings ?? 0),
    dailyEarnings: Number(row.daily_earnings ?? 0),
    referralEarnings: Number(row.referral_earnings ?? 0),
    totalWithdrawal: Number(row.total_withdrawal ?? 0),
    referralCode: row.referral_code,
    referredBy: row.referred_by ?? null,
    frozen: Boolean(row.frozen),
    claimedMissions: row.claimed_missions ?? [],
    lastCheckIn: row.last_check_in ?? row.last_checkin_date ?? null,
    registrationBonus: Number(row.registration_bonus ?? 7000),
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(row: any): UserProduct {
  return {
    id: row.id,
    userId: row.user_id,
    packageId: row.package_id,
    packageName: row.package_name,
    packagePrice: Number(row.package_price ?? 0),
    dailyIncome: Number(row.daily_income ?? 0),
    duration: Number(row.duration ?? 0),
    status: row.status,
    buyDate: row.buy_date ?? null,
    expiryDate: row.expiry_date ?? null,
    lastIncomeDate: row.last_income_date ?? null,
    totalIncomeEarned: Number(row.total_income_earned ?? 0),
    paymentProof: row.payment_proof ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecharge(row: any): Recharge {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name ?? '',
    userPhone: row.user_phone ?? '',
    amount: Number(row.amount ?? 0),
    network: row.network,
    senderPhone: row.sender_phone,
    senderName: row.sender_name ?? '',
    proof: row.proof ?? '',
    status: row.status,
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWallet(row: any): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    phone: row.phone,
    name: row.name,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWithdrawal(row: any): Withdrawal {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name ?? '',
    userPhone: row.user_phone ?? '',
    amount: Number(row.amount ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    walletType: row.wallet_type,
    walletPhone: row.wallet_phone,
    walletName: row.wallet_name,
    status: row.status,
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRedeemCode(row: any): RedeemCode {
  return {
    id: row.id,
    code: row.code,
    amount: Number(row.amount ?? 0),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    usedBy: row.used_by ?? [],
    isActive: Boolean(row.is_active),
  };
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getUsers', error); return []; }
  return (data ?? []).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('getUserById', error); return null; }
  return data ? mapUser(data) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) { console.error('getUserByPhone', error); return null; }
  return data ? mapUser(data) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('referral_code', code)
    .maybeSingle();
  if (error) { console.error('getUserByReferralCode', error); return null; }
  return data ? mapUser(data) : null;
}

export async function createUser(user: User): Promise<void> {
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
    frozen: user.frozen ?? false,
    claimed_missions: user.claimedMissions ?? [],
    last_check_in: user.lastCheckIn,
    registration_bonus: user.registrationBonus ?? 7000,
    created_at: user.createdAt,
  });
  if (error) console.error('createUser', error);
}

/**
 * updateUser supports two call signatures:
 *  1. updateUser(fullUserObject)          — replaces the whole row
 *  2. updateUser(userId, partialUpdate)   — merges partial fields
 */
export async function updateUser(
  userOrId: User | string,
  partial?: Partial<{
    balance: number;
    totalEarnings: number;
    dailyEarnings: number;
    referralEarnings: number;
    totalWithdrawal: number;
    frozen: boolean;
    claimedMissions: string[];
    lastCheckIn: string | null;
    password: string;
  }>
): Promise<void> {
  if (typeof userOrId === 'string') {
    // Partial update by id
    const p = partial ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (p.balance !== undefined) payload.balance = p.balance;
    if (p.totalEarnings !== undefined) payload.total_earnings = p.totalEarnings;
    if (p.dailyEarnings !== undefined) payload.daily_earnings = p.dailyEarnings;
    if (p.referralEarnings !== undefined) payload.referral_earnings = p.referralEarnings;
    if (p.totalWithdrawal !== undefined) payload.total_withdrawal = p.totalWithdrawal;
    if (p.frozen !== undefined) payload.frozen = p.frozen;
    if (p.claimedMissions !== undefined) payload.claimed_missions = p.claimedMissions;
    if (p.lastCheckIn !== undefined) payload.last_check_in = p.lastCheckIn;
    if (p.password !== undefined) payload.password = p.password;
    const { error } = await supabase
      .from('samsung_users')
      .update(payload)
      .eq('id', userOrId);
    if (error) console.error('updateUser(partial)', error);
  } else {
    // Full user object update
    const u = userOrId;
    const { error } = await supabase
      .from('samsung_users')
      .update({
        name: u.name,
        phone: u.phone,
        password: u.password,
        balance: u.balance,
        total_earnings: u.totalEarnings,
        daily_earnings: u.dailyEarnings,
        referral_earnings: u.referralEarnings,
        total_withdrawal: u.totalWithdrawal,
        frozen: u.frozen ?? false,
        claimed_missions: u.claimedMissions ?? [],
        last_check_in: u.lastCheckIn,
        registration_bonus: u.registrationBonus,
      })
      .eq('id', u.id);
    if (error) console.error('updateUser(full)', error);
  }
}

export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_users').delete().eq('id', id);
  if (error) console.error('deleteUserById', error);
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<UserProduct[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getProducts', error); return []; }
  return (data ?? []).map(mapProduct);
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserProducts', error); return []; }
  return (data ?? []).map(mapProduct);
}

export async function createProduct(product: UserProduct): Promise<void> {
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
    payment_proof: product.paymentProof ?? '',
  });
  if (error) console.error('createProduct', error);
}

export async function updateProduct(
  id: string,
  partial: Partial<{
    status: string;
    buyDate: string | null;
    expiryDate: string | null;
    lastIncomeDate: string | null;
    totalIncomeEarned: number;
  }>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {};
  if (partial.status !== undefined) payload.status = partial.status;
  if (partial.buyDate !== undefined) payload.buy_date = partial.buyDate;
  if (partial.expiryDate !== undefined) payload.expiry_date = partial.expiryDate;
  if (partial.lastIncomeDate !== undefined) payload.last_income_date = partial.lastIncomeDate;
  if (partial.totalIncomeEarned !== undefined) payload.total_income_earned = partial.totalIncomeEarned;
  const { error } = await supabase.from('samsung_products').update(payload).eq('id', id);
  if (error) console.error('updateProduct', error);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_products').delete().eq('id', id);
  if (error) console.error('deleteProduct', error);
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getNotifications', error); return []; }
  return (data ?? []).map(mapNotification);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserNotifications', error); return []; }
  return (data ?? []).map(mapNotification);
}

export async function addNotification(
  notif: Omit<Notification, 'id' | 'createdAt'>
): Promise<void> {
  const { error } = await supabase.from('samsung_notifications').insert({
    id: crypto.randomUUID(),
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    is_read: notif.isRead ?? false,
    created_at: new Date().toISOString(),
  });
  if (error) console.error('addNotification', error);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) console.error('markNotificationRead', error);
}

// ─── RECHARGES ───────────────────────────────────────────────────────────────

export async function getRecharges(): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRecharges', error); return []; }
  return (data ?? []).map(mapRecharge);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserRecharges', error); return []; }
  return (data ?? []).map(mapRecharge);
}

export async function createRecharge(recharge: Recharge): Promise<void> {
  const { error } = await supabase.from('samsung_recharges').insert({
    id: recharge.id,
    user_id: recharge.userId,
    user_name: recharge.userName,
    user_phone: recharge.userPhone,
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone,
    sender_name: recharge.senderName,
    proof: recharge.proof,
    status: recharge.status,
    created_at: recharge.createdAt,
    processed_at: recharge.processedAt,
  });
  if (error) console.error('createRecharge', error);
}

export async function updateRecharge(
  id: string,
  partial: Partial<{ status: string; processedAt: string | null }>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {};
  if (partial.status !== undefined) payload.status = partial.status;
  if (partial.processedAt !== undefined) payload.processed_at = partial.processedAt;
  const { error } = await supabase.from('samsung_recharges').update(payload).eq('id', id);
  if (error) console.error('updateRecharge', error);
}

// ─── WALLETS ─────────────────────────────────────────────────────────────────

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) { console.error('getUserWallets', error); return []; }
  return (data ?? []).map(mapWallet);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  const { error } = await supabase.from('samsung_wallets').upsert({
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
    created_at: wallet.createdAt,
  });
  if (error) console.error('saveWallet', error);
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  const { error } = await supabase.from('samsung_wallets').delete().eq('user_id', userId);
  if (error) console.error('deleteWalletsByUser', error);
}

// ─── WITHDRAWALS ─────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWithdrawals', error); return []; }
  return (data ?? []).map(mapWithdrawal);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWithdrawals', error); return []; }
  return (data ?? []).map(mapWithdrawal);
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  const { error } = await supabase.from('samsung_withdrawals').insert({
    id: withdrawal.id,
    user_id: withdrawal.userId,
    user_name: withdrawal.userName,
    user_phone: withdrawal.userPhone,
    amount: withdrawal.amount,
    net_amount: withdrawal.netAmount,
    wallet_type: withdrawal.walletType,
    wallet_phone: withdrawal.walletPhone,
    wallet_name: withdrawal.walletName,
    status: withdrawal.status,
    created_at: withdrawal.createdAt,
    processed_at: withdrawal.processedAt,
  });
  if (error) console.error('createWithdrawal', error);
}

export async function updateWithdrawal(
  id: string,
  partial: Partial<{ status: string; processedAt: string | null }>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {};
  if (partial.status !== undefined) payload.status = partial.status;
  if (partial.processedAt !== undefined) payload.processed_at = partial.processedAt;
  const { error } = await supabase.from('samsung_withdrawals').update(payload).eq('id', id);
  if (error) console.error('updateWithdrawal', error);
}

// ─── REDEEM CODES ────────────────────────────────────────────────────────────

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase
    .from('samsung_redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRedeemCodes', error); return []; }
  return (data ?? []).map(mapRedeemCode);
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase.from('samsung_redeem_codes').insert({
    id: code.id,
    code: code.code,
    amount: code.amount,
    created_at: code.createdAt,
    expires_at: code.expiresAt,
    used_by: code.usedBy,
    is_active: code.isActive,
  });
  if (error) console.error('createRedeemCode', error);
}

export async function updateRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase
    .from('samsung_redeem_codes')
    .update({
      code: code.code,
      amount: code.amount,
      expires_at: code.expiresAt,
      used_by: code.usedBy,
      is_active: code.isActive,
    })
    .eq('id', code.id);
  if (error) console.error('updateRedeemCode', error);
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_redeem_codes').delete().eq('id', id);
  if (error) console.error('deleteRedeemCodeById', error);
}

// ─── DAILY INCOME ENGINE ─────────────────────────────────────────────────────

/**
 * Process daily income for the current session user's active packages.
 * Called silently from AppLayout on each navigation.
 */
export async function processDailyIncome(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const products = await getUserProducts(user.id);
  const activeProducts = products.filter((p) => p.status === 'active');

  for (const product of activeProducts) {
    // Already paid today?
    if (product.lastIncomeDate && product.lastIncomeDate.startsWith(todayStr)) continue;

    // Check if expired
    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' });
      await addNotification({
        userId: user.id,
        type: 'income',
        title: 'Package Expired',
        message: `Your ${product.packageName} package has expired after ${product.duration} days.`,
        isRead: false,
      });
      continue;
    }

    // Credit income
    const income = product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: product.totalIncomeEarned + income,
    });

    const fresh = await getUserById(user.id);
    if (fresh) {
      await updateUser(user.id, {
        balance: fresh.balance + income,
        totalEarnings: fresh.totalEarnings + income,
        dailyEarnings: (fresh.dailyEarnings ?? 0) + income,
      });
    }

    await addNotification({
      userId: user.id,
      type: 'daily_income',
      title: 'Daily Income Credited',
      message: `UGX ${income.toLocaleString()} from ${product.packageName} has been added to your balance.`,
      isRead: false,
    });
  }
}

/**
 * Admin: run income for ALL active packages across ALL users and return stats.
 */
export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number }> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const { data: allProducts, error } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('status', 'active');

  if (error || !allProducts) {
    console.error('runDailyIncomeWithStats - fetch', error);
    return { processed: 0, totalPaid: 0 };
  }

  let processed = 0;
  let totalPaid = 0;

  for (const row of allProducts) {
    const product = mapProduct(row);

    // Already paid today?
    if (product.lastIncomeDate && product.lastIncomeDate.startsWith(todayStr)) continue;

    // Check expiry
    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const income = product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: product.totalIncomeEarned + income,
    });

    const userRow = await getUserById(product.userId);
    if (userRow) {
      await updateUser(product.userId, {
        balance: userRow.balance + income,
        totalEarnings: userRow.totalEarnings + income,
        dailyEarnings: (userRow.dailyEarnings ?? 0) + income,
      });
    }

    await addNotification({
      userId: product.userId,
      type: 'daily_income',
      title: 'Daily Income Credited',
      message: `UGX ${income.toLocaleString()} from ${product.packageName} has been added to your balance.`,
      isRead: false,
    });

    processed++;
    totalPaid += income;
  }

  return { processed, totalPaid };
}
