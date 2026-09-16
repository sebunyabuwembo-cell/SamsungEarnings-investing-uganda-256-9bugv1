import { supabase } from '@/lib/supabase';
import { User, UserProduct, Withdrawal, Recharge, Wallet, RedeemCode, Notification } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    userId: 'user_id',
    packageId: 'package_id',
    packageName: 'package_name',
    packagePrice: 'package_price',
    dailyIncome: 'daily_income',
    buyDate: 'buy_date',
    expiryDate: 'expiry_date',
    lastIncomeDate: 'last_income_date',
    totalIncomeEarned: 'total_income_earned',
    paymentProof: 'payment_proof',
    referralCode: 'referral_code',
    referredBy: 'referred_by',
    totalEarnings: 'total_earnings',
    totalWithdrawal: 'total_withdrawal',
    referralEarnings: 'referral_earnings',
    dailyEarnings: 'daily_earnings',
    registrationBonus: 'registration_bonus',
    lastCheckIn: 'last_check_in',
    createdAt: 'created_at',
    processedAt: 'processed_at',
    senderPhone: 'sender_phone',
    senderName: 'sender_name',
    walletType: 'wallet_type',
    walletPhone: 'wallet_phone',
    walletName: 'wallet_name',
    netAmount: 'net_amount',
    userName: 'user_name',
    userPhone: 'user_phone',
    expiresAt: 'expires_at',
    usedBy: 'used_by',
    isActive: 'is_active',
    isRead: 'is_read',
    claimedMissions: 'claimed_missions',
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[map[k] || k] = v;
  }
  return out;
}

function toCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    user_id: 'userId',
    package_id: 'packageId',
    package_name: 'packageName',
    package_price: 'packagePrice',
    daily_income: 'dailyIncome',
    buy_date: 'buyDate',
    expiry_date: 'expiryDate',
    last_income_date: 'lastIncomeDate',
    total_income_earned: 'totalIncomeEarned',
    payment_proof: 'paymentProof',
    referral_code: 'referralCode',
    referred_by: 'referredBy',
    total_earnings: 'totalEarnings',
    total_withdrawal: 'totalWithdrawal',
    referral_earnings: 'referralEarnings',
    daily_earnings: 'dailyEarnings',
    registration_bonus: 'registrationBonus',
    last_check_in: 'lastCheckIn',
    created_at: 'createdAt',
    processed_at: 'processedAt',
    sender_phone: 'senderPhone',
    sender_name: 'senderName',
    wallet_type: 'walletType',
    wallet_phone: 'walletPhone',
    wallet_name: 'walletName',
    net_amount: 'netAmount',
    user_name: 'userName',
    user_phone: 'userPhone',
    expires_at: 'expiresAt',
    used_by: 'usedBy',
    is_active: 'isActive',
    is_read: 'isRead',
    claimed_missions: 'claimedMissions',
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[map[k] || k] = v;
  }
  return out;
}

// ─── session ──────────────────────────────────────────────────────────────────

const CURRENT_USER_KEY = 'samsung_current_user';
const ADMIN_SESSION_KEY = 'samsung_admin_session';

export function getCurrentUser(): User | null {
  try {
    const raw = sessionStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(CURRENT_USER_KEY);
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
  if (val) sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  else sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

// ─── users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from('samsung_users').select('*').order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as User);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('id', id).single();
  return data ? (toCamel(data) as unknown as User) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('phone', phone).single();
  return data ? (toCamel(data) as unknown as User) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').ilike('referral_code', code).single();
  return data ? (toCamel(data) as unknown as User) : null;
}

export async function createUser(user: User): Promise<void> {
  await supabase.from('samsung_users').insert(toSnake(user as unknown as Record<string, unknown>));
}

export async function updateUser(user: User): Promise<void> {
  await supabase.from('samsung_users').update(toSnake(user as unknown as Record<string, unknown>)).eq('id', user.id);
}

export async function deleteUserById(id: string): Promise<void> {
  await supabase.from('samsung_users').delete().eq('id', id);
}

// ─── products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as UserProduct);
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as UserProduct);
}

export async function createProduct(product: UserProduct): Promise<void> {
  await supabase.from('samsung_products').insert(toSnake(product as unknown as Record<string, unknown>));
}

export async function updateProduct(product: UserProduct): Promise<void> {
  await supabase.from('samsung_products').update(toSnake(product as unknown as Record<string, unknown>)).eq('id', product.id);
}

export async function deleteProduct(id: string): Promise<void> {
  await supabase.from('samsung_products').delete().eq('id', id);
}

// ─── recharges ────────────────────────────────────────────────────────────────

export async function getRecharges(): Promise<Recharge[]> {
  const { data } = await supabase.from('samsung_recharges').select('*').order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as Recharge);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data } = await supabase.from('samsung_recharges').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as Recharge);
}

export async function createRecharge(recharge: Recharge): Promise<void> {
  await supabase.from('samsung_recharges').insert(toSnake(recharge as unknown as Record<string, unknown>));
}

export async function updateRecharge(recharge: Recharge): Promise<void> {
  await supabase.from('samsung_recharges').update(toSnake(recharge as unknown as Record<string, unknown>)).eq('id', recharge.id);
}

// ─── withdrawals ──────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as Withdrawal);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as Withdrawal);
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  await supabase.from('samsung_withdrawals').insert(toSnake(withdrawal as unknown as Record<string, unknown>));
}

export async function updateWithdrawal(withdrawal: Withdrawal): Promise<void> {
  await supabase.from('samsung_withdrawals').update(toSnake(withdrawal as unknown as Record<string, unknown>)).eq('id', withdrawal.id);
}

// ─── wallets ──────────────────────────────────────────────────────────────────

export async function getWallets(): Promise<Wallet[]> {
  const { data } = await supabase.from('samsung_wallets').select('*').order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as Wallet);
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data } = await supabase.from('samsung_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as Wallet);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  await supabase.from('samsung_wallets').upsert(toSnake(wallet as unknown as Record<string, unknown>), { onConflict: 'id' });
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  await supabase.from('samsung_wallets').delete().eq('user_id', userId);
}

// ─── notifications ────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await supabase.from('samsung_notifications').select('*').order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as Notification);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase.from('samsung_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as Notification);
}

export async function addNotification(notif: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  const full = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...notif };
  await supabase.from('samsung_notifications').insert(toSnake(full as unknown as Record<string, unknown>));
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('samsung_notifications').update({ is_read: true }).eq('id', id);
}

export async function deleteNotificationsByUser(userId: string): Promise<void> {
  await supabase.from('samsung_notifications').delete().eq('user_id', userId);
}

// ─── redeem codes ─────────────────────────────────────────────────────────────

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data } = await supabase.from('samsung_redeem_codes').select('*').order('created_at', { ascending: false });
  return (data || []).map((r) => toCamel(r) as unknown as RedeemCode);
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  await supabase.from('samsung_redeem_codes').insert(toSnake(code as unknown as Record<string, unknown>));
}

export async function updateRedeemCode(code: RedeemCode): Promise<void> {
  await supabase.from('samsung_redeem_codes').update(toSnake(code as unknown as Record<string, unknown>)).eq('id', code.id);
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  await supabase.from('samsung_redeem_codes').delete().eq('id', id);
}

// ─── daily income ─────────────────────────────────────────────────────────────

export async function processDailyIncome(): Promise<void> {
  const products = await getProducts();
  const now = new Date();
  for (const prod of products) {
    if (prod.status !== 'active') continue;
    const last = prod.lastIncomeDate ? new Date(prod.lastIncomeDate) : null;
    if (last && now.getTime() - last.getTime() < 23 * 60 * 60 * 1000) continue;

    const user = await getUserById(prod.userId);
    if (!user) continue;

    const updatedUser: User = {
      ...user,
      balance: user.balance + prod.dailyIncome,
      totalEarnings: user.totalEarnings + prod.dailyIncome,
      dailyEarnings: user.dailyEarnings + prod.dailyIncome,
    };
    await updateUser(updatedUser);

    const updatedProd: UserProduct = {
      ...prod,
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: prod.totalIncomeEarned + prod.dailyIncome,
    };

    // Check expiry
    if (prod.expiryDate && new Date(prod.expiryDate) < now) {
      updatedProd.status = 'expired';
    }
    await updateProduct(updatedProd);

    await addNotification({
      userId: prod.userId,
      type: 'daily_income',
      title: 'Daily Income Credited!',
      message: `UGX ${prod.dailyIncome.toLocaleString()} credited from your ${prod.packageName}.`,
      isRead: false,
    });
  }
}

export async function runDailyIncomeWithStats(): Promise<{ credited: number; total: number }> {
  const products = await getProducts();
  const now = new Date();
  let credited = 0;
  let total = 0;

  for (const prod of products) {
    if (prod.status !== 'active') continue;
    const last = prod.lastIncomeDate ? new Date(prod.lastIncomeDate) : null;
    if (last && now.getTime() - last.getTime() < 23 * 60 * 60 * 1000) continue;

    const user = await getUserById(prod.userId);
    if (!user) continue;

    const updatedUser: User = {
      ...user,
      balance: user.balance + prod.dailyIncome,
      totalEarnings: user.totalEarnings + prod.dailyIncome,
      dailyEarnings: user.dailyEarnings + prod.dailyIncome,
    };
    await updateUser(updatedUser);

    const updatedProd: UserProduct = {
      ...prod,
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: prod.totalIncomeEarned + prod.dailyIncome,
    };
    if (prod.expiryDate && new Date(prod.expiryDate) < now) {
      updatedProd.status = 'expired';
    }
    await updateProduct(updatedProd);

    await addNotification({
      userId: prod.userId,
      type: 'daily_income',
      title: 'Daily Income Credited!',
      message: `UGX ${prod.dailyIncome.toLocaleString()} credited from your ${prod.packageName}.`,
      isRead: false,
    });

    credited++;
    total += prod.dailyIncome;
  }

  return { credited, total };
}
