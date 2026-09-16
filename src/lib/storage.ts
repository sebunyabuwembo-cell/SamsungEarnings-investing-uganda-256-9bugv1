import { supabase } from '@/lib/supabase';
import { User, Product, Recharge, Withdrawal, Wallet, Notification, RedeemCode } from '@/types';

// ─── Session helpers (localStorage) ─────────────────────────────────────────

const CURRENT_USER_KEY = 'samsung_current_user';
const ADMIN_SESSION_KEY = 'samsung_admin_session';

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export async function refreshCurrentUser(): Promise<User | null> {
  const local = getCurrentUser();
  if (!local) return null;
  const fresh = await getUserById(local.id);
  if (fresh) setCurrentUser(fresh);
  return fresh;
}

export function getAdminSession(): boolean {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function setAdminSession(active: boolean): void {
  if (active) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

// ─── Converters ──────────────────────────────────────────────────────────────

function rowToUser(row: any): User {
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
    frozen: row.frozen ?? false,
    claimedMissions: row.claimed_missions ?? [],
    lastCheckIn: row.last_check_in ?? row.last_checkin_date ?? null,
    registrationBonus: Number(row.registration_bonus ?? 7000),
    createdAt: row.created_at,
  };
}

function userToRow(user: Partial<User>): any {
  const row: any = {};
  if (user.id !== undefined) row.id = user.id;
  if (user.name !== undefined) row.name = user.name;
  if (user.phone !== undefined) row.phone = user.phone;
  if (user.password !== undefined) row.password = user.password;
  if (user.balance !== undefined) row.balance = user.balance;
  if (user.totalEarnings !== undefined) row.total_earnings = user.totalEarnings;
  if (user.dailyEarnings !== undefined) row.daily_earnings = user.dailyEarnings;
  if (user.referralEarnings !== undefined) row.referral_earnings = user.referralEarnings;
  if (user.totalWithdrawal !== undefined) row.total_withdrawal = user.totalWithdrawal;
  if (user.referralCode !== undefined) row.referral_code = user.referralCode;
  if (user.referredBy !== undefined) row.referred_by = user.referredBy;
  if (user.frozen !== undefined) row.frozen = user.frozen;
  if (user.claimedMissions !== undefined) row.claimed_missions = user.claimedMissions;
  if (user.lastCheckIn !== undefined) row.last_check_in = user.lastCheckIn;
  if (user.registrationBonus !== undefined) row.registration_bonus = user.registrationBonus;
  return row;
}

function rowToProduct(row: any): Product {
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
    createdAt: row.created_at,
  };
}

function rowToRecharge(row: any): Recharge {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount ?? 0),
    network: row.network,
    senderPhone: row.sender_phone,
    senderName: row.sender_name ?? '',
    proof: row.proof ?? '',
    status: row.status,
    userName: row.user_name ?? '',
    userPhone: row.user_phone ?? '',
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null,
  };
}

function rowToWithdrawal(row: any): Withdrawal {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    walletPhone: row.wallet_phone,
    walletName: row.wallet_name,
    walletType: row.wallet_type,
    status: row.status,
    userName: row.user_name ?? '',
    userPhone: row.user_phone ?? '',
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null,
  };
}

function rowToWallet(row: any): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    phone: row.phone,
    name: row.name,
    createdAt: row.created_at,
  };
}

function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read ?? false,
    createdAt: row.created_at,
  };
}

function rowToRedeemCode(row: any): RedeemCode {
  return {
    id: row.id,
    code: row.code,
    amount: Number(row.amount ?? 0),
    expiresAt: row.expires_at,
    usedBy: row.used_by ?? [],
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getUsers:', error); return []; }
  return (data ?? []).map(rowToUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('getUserById:', error); return null; }
  return data ? rowToUser(data) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) { console.error('getUserByPhone:', error); return null; }
  return data ? rowToUser(data) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('referral_code', code.toUpperCase())
    .maybeSingle();
  if (error) { console.error('getUserByReferralCode:', error); return null; }
  return data ? rowToUser(data) : null;
}

export async function createUser(user: User): Promise<void> {
  const { error } = await supabase
    .from('samsung_users')
    .insert(userToRow(user));
  if (error) console.error('createUser:', error);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const { error } = await supabase
    .from('samsung_users')
    .update(userToRow(updates))
    .eq('id', id);
  if (error) console.error('updateUser:', error);
}

export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_users')
    .delete()
    .eq('id', id);
  if (error) console.error('deleteUserById:', error);
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getProducts:', error); return []; }
  return (data ?? []).map(rowToProduct);
}

export async function getUserProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserProducts:', error); return []; }
  return (data ?? []).map(rowToProduct);
}

export async function createProduct(product: Product): Promise<void> {
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
  if (error) console.error('createProduct:', error);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const row: any = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.buyDate !== undefined) row.buy_date = updates.buyDate;
  if (updates.expiryDate !== undefined) row.expiry_date = updates.expiryDate;
  if (updates.lastIncomeDate !== undefined) row.last_income_date = updates.lastIncomeDate;
  if (updates.totalIncomeEarned !== undefined) row.total_income_earned = updates.totalIncomeEarned;
  if (updates.paymentProof !== undefined) row.payment_proof = updates.paymentProof;
  const { error } = await supabase.from('samsung_products').update(row).eq('id', id);
  if (error) console.error('updateProduct:', error);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_products').delete().eq('id', id);
  if (error) console.error('deleteProduct:', error);
}

// ─── Recharges ───────────────────────────────────────────────────────────────

export async function getRecharges(): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRecharges:', error); return []; }
  return (data ?? []).map(rowToRecharge);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserRecharges:', error); return []; }
  return (data ?? []).map(rowToRecharge);
}

export async function createRecharge(recharge: Recharge): Promise<void> {
  const { error } = await supabase.from('samsung_recharges').insert({
    id: recharge.id,
    user_id: recharge.userId,
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone,
    sender_name: recharge.senderName ?? '',
    proof: recharge.proof ?? '',
    status: recharge.status,
    user_name: recharge.userName ?? '',
    user_phone: recharge.userPhone ?? '',
  });
  if (error) console.error('createRecharge:', error);
}

export async function updateRecharge(id: string, updates: Partial<Recharge>): Promise<void> {
  const row: any = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.processedAt !== undefined) row.processed_at = updates.processedAt;
  if (updates.amount !== undefined) row.amount = updates.amount;
  const { error } = await supabase.from('samsung_recharges').update(row).eq('id', id);
  if (error) console.error('updateRecharge:', error);
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWithdrawals:', error); return []; }
  return (data ?? []).map(rowToWithdrawal);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWithdrawals:', error); return []; }
  return (data ?? []).map(rowToWithdrawal);
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  const { error } = await supabase.from('samsung_withdrawals').insert({
    id: withdrawal.id,
    user_id: withdrawal.userId,
    amount: withdrawal.amount,
    net_amount: withdrawal.netAmount,
    wallet_phone: withdrawal.walletPhone,
    wallet_name: withdrawal.walletName,
    wallet_type: withdrawal.walletType,
    status: withdrawal.status,
    user_name: withdrawal.userName ?? '',
    user_phone: withdrawal.userPhone ?? '',
  });
  if (error) console.error('createWithdrawal:', error);
}

export async function updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<void> {
  const row: any = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.processedAt !== undefined) row.processed_at = updates.processedAt;
  const { error } = await supabase.from('samsung_withdrawals').update(row).eq('id', id);
  if (error) console.error('updateWithdrawal:', error);
}

// ─── Wallets ─────────────────────────────────────────────────────────────────

export async function getWallets(): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWallets:', error); return []; }
  return (data ?? []).map(rowToWallet);
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWallets:', error); return []; }
  return (data ?? []).map(rowToWallet);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  const { error } = await supabase.from('samsung_wallets').upsert({
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
  });
  if (error) console.error('saveWallet:', error);
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  const { error } = await supabase.from('samsung_wallets').delete().eq('user_id', userId);
  if (error) console.error('deleteWalletsByUser:', error);
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getNotifications:', error); return []; }
  return (data ?? []).map(rowToNotification);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserNotifications:', error); return []; }
  return (data ?? []).map(rowToNotification);
}

export async function addNotification(n: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('samsung_notifications').insert({
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: n.isRead ?? false,
  });
  if (error) console.error('addNotification:', error);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) console.error('markNotificationRead:', error);
}

export async function deleteNotificationsByUser(userId: string): Promise<void> {
  const { error } = await supabase.from('samsung_notifications').delete().eq('user_id', userId);
  if (error) console.error('deleteNotificationsByUser:', error);
}

// ─── Redeem Codes ────────────────────────────────────────────────────────────

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase
    .from('samsung_redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRedeemCodes:', error); return []; }
  return (data ?? []).map(rowToRedeemCode);
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase.from('samsung_redeem_codes').insert({
    id: code.id,
    code: code.code,
    amount: code.amount,
    expires_at: code.expiresAt,
    used_by: code.usedBy ?? [],
    is_active: code.isActive ?? true,
  });
  if (error) console.error('createRedeemCode:', error);
}

export async function updateRedeemCode(id: string, updates: Partial<RedeemCode>): Promise<void> {
  const row: any = {};
  if (updates.isActive !== undefined) row.is_active = updates.isActive;
  if (updates.usedBy !== undefined) row.used_by = updates.usedBy;
  const { error } = await supabase.from('samsung_redeem_codes').update(row).eq('id', id);
  if (error) console.error('updateRedeemCode:', error);
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_redeem_codes').delete().eq('id', id);
  if (error) console.error('deleteRedeemCodeById:', error);
}

// ─── Daily Income ────────────────────────────────────────────────────────────

export interface DailyIncomeStats {
  processed: number;
  totalPaid: number;
  expired: number;
  skipped: number;
}

export async function processDailyIncome(): Promise<DailyIncomeStats> {
  const stats: DailyIncomeStats = { processed: 0, totalPaid: 0, expired: 0, skipped: 0 };

  const products = await getProducts();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  for (const product of products) {
    if (product.status !== 'active') { stats.skipped++; continue; }

    // Check expiry
    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' });
      stats.expired++;
      continue;
    }

    // Guard: already processed today
    if (product.lastIncomeDate && product.lastIncomeDate.startsWith(todayStr)) {
      stats.skipped++;
      continue;
    }

    // Credit daily income to user
    const user = await getUserById(product.userId);
    if (!user) { stats.skipped++; continue; }

    const newBalance = user.balance + product.dailyIncome;
    const newTotal = user.totalEarnings + product.dailyIncome;
    const newDaily = user.dailyEarnings + product.dailyIncome;
    const newTotalIncome = product.totalIncomeEarned + product.dailyIncome;

    await updateUser(user.id, {
      balance: newBalance,
      totalEarnings: newTotal,
      dailyEarnings: newDaily,
    });

    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: newTotalIncome,
    });

    await addNotification({
      userId: user.id,
      type: 'daily_income',
      title: 'Daily Income Credited',
      message: `UGX ${product.dailyIncome.toLocaleString()} from ${product.packageName} has been added to your balance.`,
      isRead: false,
    });

    stats.processed++;
    stats.totalPaid += product.dailyIncome;
  }

  return stats;
}

export async function runDailyIncomeWithStats(): Promise<DailyIncomeStats> {
  return processDailyIncome();
}
