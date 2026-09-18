/**
 * storage.ts — Centralized async API for all Supabase cloud database operations.
 * Tables: samsung_users, samsung_products, samsung_notifications,
 *         samsung_recharges, samsung_wallets, samsung_withdrawals, samsung_redeem_codes
 */

import { supabase } from '@/lib/supabase';
import { User, UserProduct, Notification, Recharge, Wallet, Withdrawal, RedeemCode } from '@/types';

// ─── Session helpers ──────────────────────────────────────────────────────────

const SESSION_KEY = 'eagle_current_user';
const ADMIN_SESSION_KEY = 'eagle_admin_session';

/** Return cached User object or null (synchronous). */
export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist a User object (or null to log out) to the local session. */
export function setCurrentUser(user: User | null | string): void {
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  if (typeof user === 'string') {
    localStorage.setItem(SESSION_KEY, user);
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
}

/** FIXED: Never logs out if cloud fails - returns cached user */
export async function refreshCurrentUser(): Promise<User | null> {
  const cached = getCurrentUser();
  if (!cached) return null;
  try {
    const fresh = await getUserById(cached.id);
    if (fresh) {
      setCurrentUser(fresh);
      return fresh;
    }
  } catch (e) {
    console.log('refresh failed, keeping cached', e);
  }
  return cached;
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

// ─── Map helpers ─────────────────────────────────────────────────────────────

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
    frozen: row.frozen ?? false,
    claimedMissions: row.claimed_missions ?? [],
    lastCheckIn: row.last_check_in ?? row.last_checkin_date ?? null,
    registrationBonus: Number(row.registration_bonus ?? 7000),
    createdAt: row.created_at,
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
    duration: row.duration,
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
    isRead: row.is_read,
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
    senderPhone: row.sender_phone,
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
    walletPhone: row.wallet_phone,
    walletName: row.wallet_name,
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
    isActive: row.is_active,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('samsung_users').select('*');
  if (error) { console.error('getUsers error', error); return []; }
  return (data ?? []).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('samsung_users').select('*').eq('id', id).single();
  if (error) { return null; }
  return data ? mapUser(data) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase.from('samsung_users').select('*').eq('phone', phone.trim()).maybeSingle();
  if (error) { return null; }
  return data ? mapUser(data) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase.from('samsung_users').select('*').eq('referral_code', code.trim()).maybeSingle();
  if (error) { return null; }
  return data ? mapUser(data) : null;
}

export async function createUser(user: User): Promise<User | null> {
  const row = {
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
  };
  const { data, error } = await supabase.from('samsung_users').insert(row).select().single();
  if (error) { console.error('createUser error', error); return null; }
  return data ? mapUser(data) : null;
}

export async function updateUser(userOrId: User | string, updates?: Partial<User>): Promise<void> {
  let id: string;
  let patch: any = {};
  if (typeof userOrId === 'string') {
    id = userOrId;
    const u = updates!;
    if (u.balance !== undefined) patch.balance = u.balance;
    if (u.totalEarnings !== undefined) patch.total_earnings = u.totalEarnings;
    if (u.dailyEarnings !== undefined) patch.daily_earnings = u.dailyEarnings;
    if (u.referralEarnings !== undefined) patch.referral_earnings = u.referralEarnings;
    if (u.totalWithdrawal !== undefined) patch.total_withdrawal = u.totalWithdrawal;
    if (u.frozen !== undefined) patch.frozen = u.frozen;
    if (u.claimedMissions !== undefined) patch.claimed_missions = u.claimedMissions;
    if (u.lastCheckIn !== undefined) patch.last_check_in = u.lastCheckIn;
    if (u.password !== undefined) patch.password = u.password;
    if (u.name !== undefined) patch.name = u.name;
  } else {
    id = userOrId.id;
    patch = {
      balance: userOrId.balance,
      total_earnings: userOrId.totalEarnings,
      daily_earnings: userOrId.dailyEarnings,
      referral_earnings: userOrId.referralEarnings,
      total_withdrawal: userOrId.totalWithdrawal,
      frozen: userOrId.frozen,
      claimed_missions: userOrId.claimedMissions,
      last_check_in: userOrId.lastCheckIn,
      password: userOrId.password,
      name: userOrId.name,
    };
  }
  const { error } = await supabase.from('samsung_users').update(patch).eq('id', id);
  if (error) console.error('updateUser error', error);
}

export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_users').update({ frozen: true }).eq('id', id);
  if (error) {
    const { error: delErr } = await (supabase as any).from('samsung_users').delete().eq('id', id);
    if (delErr) console.error('deleteUserById error', delErr);
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<UserProduct[]> {
  const { data, error } = await supabase.from('samsung_products').select('*');
  if (error) { console.error('getProducts error', error); return []; }
  return (data ?? []).map(mapProduct);
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data, error } = await supabase.from('samsung_products').select('*').eq('user_id', userId);
  if (error) { console.error('getUserProducts error', error); return []; }
  return (data ?? []).map(mapProduct);
}

export async function createProduct(product: UserProduct): Promise<void> {
  const row = {
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
  };
  const { error } = await supabase.from('samsung_products').insert(row);
  if (error) console.error('createProduct error', error);
}

export async function updateProduct(id: string, updates: Partial<UserProduct>): Promise<void> {
  const patch: any = {};
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.buyDate !== undefined) patch.buy_date = updates.buyDate;
  if (updates.expiryDate !== undefined) patch.expiry_date = updates.expiryDate;
  if (updates.lastIncomeDate !== undefined) patch.last_income_date = updates.lastIncomeDate;
  if (updates.totalIncomeEarned !== undefined) patch.total_income_earned = updates.totalIncomeEarned;
  const { error } = await supabase.from('samsung_products').update(patch).eq('id', id);
  if (error) console.error('updateProduct error', error);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await (supabase as any).from('samsung_products').delete().eq('id', id);
  if (error) console.error('deleteProduct error', error);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.from('samsung_notifications').select('*');
  if (error) { console.error('getNotifications error', error); return []; }
  return (data ?? []).map(mapNotification);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase.from('samsung_notifications').select('*').eq('user_id', userId);
  if (error) { console.error('getUserNotifications error', error); return []; }
  return (data ?? []).map(mapNotification);
}

export async function addNotification(notif: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  const row = {
    id: crypto.randomUUID(),
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    is_read: notif.isRead,
  };
  const { error } = await supabase.from('samsung_notifications').insert(row);
  if (error) console.error('addNotification error', error);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_notifications').update({ is_read: true }).eq('id', id);
  if (error) console.error('markNotificationRead error', error);
}

// ─── Recharges ────────────────────────────────────────────────────────────────

export async function getRecharges(): Promise<Recharge[]> {
  const { data, error } = await supabase.from('samsung_recharges').select('*');
  if (error) { console.error('getRecharges error', error); return []; }
  return (data ?? []).map(mapRecharge);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data, error } = await supabase.from('samsung_recharges').select('*').eq('user_id', userId);
  if (error) { console.error('getUserRecharges error', error); return []; }
  return (data ?? []).map(mapRecharge);
}

export async function createRecharge(recharge: Recharge): Promise<void> {
  const row = {
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
  };
  const { error } = await supabase.from('samsung_recharges').insert(row);
  if (error) console.error('createRecharge error', error);
}

export async function updateRecharge(id: string, updates: Partial<Recharge>): Promise<void> {
  const patch: any = {};
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.processedAt !== undefined) patch.processed_at = updates.processedAt;
  const { error } = await supabase.from('samsung_recharges').update(patch).eq('id', id);
  if (error) console.error('updateRecharge error', error);
}

// ─── Wallets ──────────────────────────────────────────────────────────────────

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase.from('samsung_wallets').select('*').eq('user_id', userId);
  if (error) { console.error('getUserWallets error', error); return []; }
  return (data ?? []).map(mapWallet);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  const row = {
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
  };
  const { error } = await supabase.from('samsung_wallets').insert(row);
  if (error) console.error('saveWallet error', error);
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  const { error } = await (supabase as any).from('samsung_wallets').delete().eq('user_id', userId);
  if (error) console.error('deleteWalletsByUser error', error);
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase.from('samsung_withdrawals').select('*');
  if (error) { console.error('getWithdrawals error', error); return []; }
  return (data ?? []).map(mapWithdrawal);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase.from('samsung_withdrawals').select('*').eq('user_id', userId);
  if (error) { console.error('getUserWithdrawals error', error); return []; }
  return (data ?? []).map(mapWithdrawal);
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  const row = {
    id: withdrawal.id,
    user_id: withdrawal.userId,
    user_name: withdrawal.userName,
    user_phone: withdrawal.userPhone,
    amount: withdrawal.amount,
    net_amount: withdrawal.netAmount,
    wallet_phone: withdrawal.walletPhone,
    wallet_name: withdrawal.walletName,
    wallet_type: withdrawal.walletType,
    status: withdrawal.status,
  };
  const { error } = await supabase.from('samsung_withdrawals').insert(row);
  if (error) console.error('createWithdrawal error', error);
}

export async function updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<void> {
  const patch: any = {};
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.processedAt !== undefined) patch.processed_at = updates.processedAt;
  const { error } = await supabase.from('samsung_withdrawals').update(patch).eq('id', id);
  if (error) console.error('updateWithdrawal error', error);
}

// ─── Redeem Codes ─────────────────────────────────────────────────────────────

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase.from('samsung_redeem_codes').select('*');
  if (error) { console.error('getRedeemCodes error', error); return []; }
  return (data ?? []).map(mapRedeemCode);
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  const row = {
    id: code.id,
    code: code.code,
    amount: code.amount,
    expires_at: code.expiresAt,
    used_by: code.usedBy,
    is_active: code.isActive,
  };
  const { error } = await supabase.from('samsung_redeem_codes').insert(row);
  if (error) console.error('createRedeemCode error', error);
}

export async function updateRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase.from('samsung_redeem_codes').update({ used_by: code.usedBy, is_active: code.isActive }).eq('id', code.id);
  if (error) console.error('updateRedeemCode error', error);
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  const { error } = await (supabase as any).from('samsung_redeem_codes').delete().eq('id', id);
  if (error) console.error('deleteRedeemCodeById error', error);
}

// ─── Daily Income Engine ──────────────────────────────────────────────────────

export async function processDailyIncome(): Promise<void> {
  const products = await getProducts();
  const activeProducts = products.filter(p => p.status === 'active');
  if (activeProducts.length === 0) return;
  const today = new Date().toDateString();
  for (const product of activeProducts) {
    if (product.lastIncomeDate && new Date(product.lastIncomeDate).toDateString() === today) continue;
    if (product.expiryDate && new Date(product.expiryDate) < new Date()) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }
    const newTotal = product.totalIncomeEarned + product.dailyIncome;
    await updateProduct(product.id, { lastIncomeDate: new Date().toISOString(), totalIncomeEarned: newTotal });
    const user = await getUserById(product.userId);
    if (user) {
      await updateUser(user.id, {
        balance: user.balance + product.dailyIncome,
        totalEarnings: user.totalEarnings + product.dailyIncome,
        dailyEarnings: user.dailyEarnings + product.dailyIncome,
      });
    }
  }
}

export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number }> {
  const products = await getProducts();
  const activeProducts = products.filter(p => p.status === 'active');
  const today = new Date().toDateString();
  let processed = 0;
  let totalPaid = 0;
  for (const product of activeProducts) {
    if (product.lastIncomeDate && new Date(product.lastIncomeDate).toDateString() === today) continue;
    if (product.expiryDate && new Date(product.expiryDate) < new Date()) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }
    const newTotal = product.totalIncomeEarned + product.dailyIncome;
    await updateProduct(product.id, { lastIncomeDate: new Date().toISOString(), totalIncomeEarned: newTotal });
    const user = await getUserById(product.userId);
    if (user) {
      await updateUser(user.id, {
        balance: user.balance + product.dailyIncome,
        totalEarnings: user.totalEarnings + product.dailyIncome,
        dailyEarnings: user.dailyEarnings + product.dailyIncome,
      });
      processed++;
      totalPaid += product.dailyIncome;
    }
  }
  return { processed, totalPaid };
}
