/**
 * storage.ts — centralized cloud data layer using Supabase (OnSpace Cloud)
 * All tables: samsung_users, samsung_products, samsung_notifications,
 *             samsung_recharges, samsung_redeem_codes, samsung_wallets, samsung_withdrawals
 */

import { supabase } from '@/lib/supabase';
import {
  User, UserProduct, Notification, Recharge, Wallet,
  RedeemCode, Withdrawal,
} from '@/types';

// ─── SESSION HELPERS ────────────────────────────────────────────────────────

const SESSION_KEY = 'samsung_current_user';
const ADMIN_SESSION_KEY = 'samsung_admin_session';

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
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
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function setAdminSession(value: boolean): void {
  if (value) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

// ─── MAPPERS: DB row → TypeScript ────────────────────────────────────────────

function mapUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    password: row.password,
    name: row.name,
    referralCode: row.referral_code,
    referredBy: row.referred_by ?? null,
    balance: Number(row.balance ?? 0),
    totalEarnings: Number(row.total_earnings ?? 0),
    totalWithdrawal: Number(row.total_withdrawal ?? 0),
    referralEarnings: Number(row.referral_earnings ?? 0),
    dailyEarnings: Number(row.daily_earnings ?? 0),
    registrationBonus: Number(row.registration_bonus ?? 7000),
    lastCheckIn: row.last_check_in ?? null,
    createdAt: row.created_at,
    frozen: row.frozen ?? false,
    claimedMissions: row.claimed_missions ?? [],
  };
}

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

function mapNotification(row: any): Notification {
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

function mapRecharge(row: any): Recharge {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name ?? '',
    userPhone: row.user_phone ?? '',
    amount: Number(row.amount ?? 0),
    network: row.network,
    senderPhone: row.sender_phone ?? '',
    senderName: row.sender_name ?? '',
    proof: row.proof ?? '',
    status: row.status,
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null,
  };
}

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

function mapWithdrawal(row: any): Withdrawal {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name ?? '',
    userPhone: row.user_phone ?? '',
    amount: Number(row.amount ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    walletType: row.wallet_type,
    walletPhone: row.wallet_phone ?? '',
    walletName: row.wallet_name ?? '',
    status: row.status,
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null,
  };
}

function mapRedeemCode(row: any): RedeemCode {
  return {
    id: row.id,
    code: row.code,
    amount: Number(row.amount ?? 0),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    usedBy: row.used_by ?? [],
    isActive: row.is_active ?? true,
  };
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from('samsung_users').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('id', id).single();
  return data ? mapUser(data) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('phone', phone).maybeSingle();
  return data ? mapUser(data) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('referral_code', code).maybeSingle();
  return data ? mapUser(data) : null;
}

export async function createUser(user: User): Promise<void> {
  await supabase.from('samsung_users').insert({
    id: user.id,
    phone: user.phone,
    password: user.password,
    name: user.name,
    referral_code: user.referralCode,
    referred_by: user.referredBy ?? null,
    balance: user.balance,
    total_earnings: user.totalEarnings,
    total_withdrawal: user.totalWithdrawal,
    referral_earnings: user.referralEarnings,
    daily_earnings: user.dailyEarnings,
    registration_bonus: user.registrationBonus ?? 7000,
    last_check_in: user.lastCheckIn ?? null,
    frozen: user.frozen ?? false,
    claimed_missions: user.claimedMissions ?? [],
  });
}

// Accepts either (fullUser: User) or (userId: string, partial: Partial<User>)
export async function updateUser(userOrId: User | string, partial?: Partial<User>): Promise<void> {
  let id: string;
  let fields: Partial<User>;

  if (typeof userOrId === 'string') {
    id = userOrId;
    fields = partial ?? {};
  } else {
    id = userOrId.id;
    fields = userOrId;
  }

  const dbFields: Record<string, any> = {};
  if (fields.phone !== undefined) dbFields.phone = fields.phone;
  if (fields.password !== undefined) dbFields.password = fields.password;
  if (fields.name !== undefined) dbFields.name = fields.name;
  if (fields.referralCode !== undefined) dbFields.referral_code = fields.referralCode;
  if (fields.referredBy !== undefined) dbFields.referred_by = fields.referredBy;
  if (fields.balance !== undefined) dbFields.balance = fields.balance;
  if (fields.totalEarnings !== undefined) dbFields.total_earnings = fields.totalEarnings;
  if (fields.totalWithdrawal !== undefined) dbFields.total_withdrawal = fields.totalWithdrawal;
  if (fields.referralEarnings !== undefined) dbFields.referral_earnings = fields.referralEarnings;
  if (fields.dailyEarnings !== undefined) dbFields.daily_earnings = fields.dailyEarnings;
  if (fields.registrationBonus !== undefined) dbFields.registration_bonus = fields.registrationBonus;
  if (fields.lastCheckIn !== undefined) dbFields.last_check_in = fields.lastCheckIn;
  if (fields.frozen !== undefined) dbFields.frozen = fields.frozen;
  if (fields.claimedMissions !== undefined) dbFields.claimed_missions = fields.claimedMissions;

  if (Object.keys(dbFields).length > 0) {
    await supabase.from('samsung_users').update(dbFields).eq('id', id);
  }
}

export async function deleteUserById(id: string): Promise<void> {
  await supabase.from('samsung_users').delete().eq('id', id);
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapProduct);
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapProduct);
}

export async function createProduct(product: UserProduct): Promise<void> {
  await supabase.from('samsung_products').insert({
    id: product.id,
    user_id: product.userId,
    package_id: product.packageId,
    package_name: product.packageName,
    package_price: product.packagePrice,
    daily_income: product.dailyIncome,
    duration: product.duration,
    status: product.status,
    buy_date: product.buyDate ?? null,
    expiry_date: product.expiryDate ?? null,
    last_income_date: product.lastIncomeDate ?? null,
    total_income_earned: product.totalIncomeEarned ?? 0,
    payment_proof: product.paymentProof ?? '',
  });
}

export async function updateProduct(id: string, partial: Partial<UserProduct>): Promise<void> {
  const dbFields: Record<string, any> = {};
  if (partial.status !== undefined) dbFields.status = partial.status;
  if (partial.buyDate !== undefined) dbFields.buy_date = partial.buyDate;
  if (partial.expiryDate !== undefined) dbFields.expiry_date = partial.expiryDate;
  if (partial.lastIncomeDate !== undefined) dbFields.last_income_date = partial.lastIncomeDate;
  if (partial.totalIncomeEarned !== undefined) dbFields.total_income_earned = partial.totalIncomeEarned;
  if (partial.dailyIncome !== undefined) dbFields.daily_income = partial.dailyIncome;
  if (partial.packagePrice !== undefined) dbFields.package_price = partial.packagePrice;
  if (partial.packageName !== undefined) dbFields.package_name = partial.packageName;

  if (Object.keys(dbFields).length > 0) {
    await supabase.from('samsung_products').update(dbFields).eq('id', id);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  await supabase.from('samsung_products').delete().eq('id', id);
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await supabase.from('samsung_notifications').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapNotification);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase.from('samsung_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapNotification);
}

export async function addNotification(notif: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('samsung_notifications').insert({
    id: crypto.randomUUID(),
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    is_read: notif.isRead ?? false,
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('samsung_notifications').update({ is_read: true }).eq('id', id);
}

// ─── RECHARGES ───────────────────────────────────────────────────────────────

export async function getRecharges(): Promise<Recharge[]> {
  const { data } = await supabase.from('samsung_recharges').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapRecharge);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data } = await supabase.from('samsung_recharges').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapRecharge);
}

export async function createRecharge(recharge: Recharge): Promise<void> {
  await supabase.from('samsung_recharges').insert({
    id: recharge.id,
    user_id: recharge.userId,
    user_name: recharge.userName ?? '',
    user_phone: recharge.userPhone ?? '',
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone ?? '',
    sender_name: recharge.senderName ?? '',
    proof: recharge.proof ?? '',
    status: recharge.status,
  });
}

export async function updateRecharge(id: string, partial: Partial<Recharge>): Promise<void> {
  const dbFields: Record<string, any> = {};
  if (partial.status !== undefined) dbFields.status = partial.status;
  if (partial.processedAt !== undefined) dbFields.processed_at = partial.processedAt;
  if (partial.amount !== undefined) dbFields.amount = partial.amount;

  if (Object.keys(dbFields).length > 0) {
    await supabase.from('samsung_recharges').update(dbFields).eq('id', id);
  }
}

// ─── WALLETS ─────────────────────────────────────────────────────────────────

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data } = await supabase.from('samsung_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapWallet);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  await supabase.from('samsung_wallets').insert({
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
  });
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  await supabase.from('samsung_wallets').delete().eq('user_id', userId);
}

// ─── WITHDRAWALS ─────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapWithdrawal);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapWithdrawal);
}

export async function createWithdrawal(w: Withdrawal): Promise<void> {
  await supabase.from('samsung_withdrawals').insert({
    id: w.id,
    user_id: w.userId,
    user_name: w.userName ?? '',
    user_phone: w.userPhone ?? '',
    amount: w.amount,
    net_amount: w.netAmount,
    wallet_type: w.walletType,
    wallet_phone: w.walletPhone,
    wallet_name: w.walletName,
    status: w.status,
  });
}

export async function updateWithdrawal(id: string, partial: Partial<Withdrawal>): Promise<void> {
  const dbFields: Record<string, any> = {};
  if (partial.status !== undefined) dbFields.status = partial.status;
  if (partial.processedAt !== undefined) dbFields.processed_at = partial.processedAt;

  if (Object.keys(dbFields).length > 0) {
    await supabase.from('samsung_withdrawals').update(dbFields).eq('id', id);
  }
}

// ─── REDEEM CODES ─────────────────────────────────────────────────────────────

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data } = await supabase.from('samsung_redeem_codes').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapRedeemCode);
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  await supabase.from('samsung_redeem_codes').insert({
    id: code.id,
    code: code.code,
    amount: code.amount,
    expires_at: code.expiresAt,
    used_by: code.usedBy ?? [],
    is_active: code.isActive ?? true,
  });
}

export async function updateRedeemCode(code: RedeemCode): Promise<void> {
  await supabase.from('samsung_redeem_codes').update({
    used_by: code.usedBy,
    is_active: code.isActive,
  }).eq('id', code.id);
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  await supabase.from('samsung_redeem_codes').delete().eq('id', id);
}

// ─── DAILY INCOME ENGINE ─────────────────────────────────────────────────────

function isSameDay(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

export async function processDailyIncome(): Promise<void> {
  const products = await getProducts();
  const activeProducts = products.filter(p => p.status === 'active');
  const now = new Date();

  for (const product of activeProducts) {
    // Check if already paid today
    if (product.lastIncomeDate && isSameDay(product.lastIncomeDate)) continue;

    // Check if expired
    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    // Credit income
    const user = await getUserById(product.userId);
    if (!user) continue;

    const newTotalEarned = product.totalIncomeEarned + product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: newTotalEarned,
    });

    await updateUser(product.userId, {
      balance: user.balance + product.dailyIncome,
      totalEarnings: user.totalEarnings + product.dailyIncome,
      dailyEarnings: user.dailyEarnings + product.dailyIncome,
    });

    await addNotification({
      userId: product.userId,
      type: 'daily_income',
      title: 'Daily Income Credited',
      message: `UGX ${product.dailyIncome.toLocaleString()} from ${product.packageName} has been added to your balance.`,
      isRead: false,
    });
  }
}

export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number }> {
  const products = await getProducts();
  const activeProducts = products.filter(p => p.status === 'active');
  const now = new Date();

  let processed = 0;
  let totalPaid = 0;

  for (const product of activeProducts) {
    if (product.lastIncomeDate && isSameDay(product.lastIncomeDate)) continue;

    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const user = await getUserById(product.userId);
    if (!user) continue;

    const newTotalEarned = product.totalIncomeEarned + product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: newTotalEarned,
    });

    await updateUser(product.userId, {
      balance: user.balance + product.dailyIncome,
      totalEarnings: user.totalEarnings + product.dailyIncome,
      dailyEarnings: user.dailyEarnings + product.dailyIncome,
    });

    await addNotification({
      userId: product.userId,
      type: 'daily_income',
      title: 'Daily Income Credited',
      message: `UGX ${product.dailyIncome.toLocaleString()} from ${product.packageName} has been added to your balance.`,
      isRead: false,
    });

    processed++;
    totalPaid += product.dailyIncome;
  }

  return { processed, totalPaid };
}
