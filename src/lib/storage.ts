/**
 * storage.ts
 * Centralized async data layer — all operations use Supabase
 * Tables: engle_users, engle_products, engle_notifications,
 *         engle_recharges, engle_redeem_codes, engle_wallets, engle_withdrawals
 */

import { supabase } from '@/lib/supabase';
import {
  User, UserProduct, Notification, Recharge, Wallet,
  Withdrawal, RedeemCode,
} from '@/types';

export type Product = UserProduct;

const SESSION_KEY = 'current_user';
const ADMIN_KEY = 'admin_session';

export function getCurrentUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
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
  const user = await getUserById(cached.id);
  if (user) setCurrentUser(user);
  return user;
}

export function getAdminSession(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function setAdminSession(value: boolean): void {
  if (value) {
    sessionStorage.setItem(ADMIN_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_KEY);
  }
}

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
    buyDate: row.buy_date ?? null,
    expiryDate: row.expiry_date ?? null,
    status: row.status,
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

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('engle_users').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getUsers:', error); return []; }
  return (data ?? []).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('engle_users').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapUser(data);
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase.from('engle_users').select('*').eq('phone', phone).single();
  if (error || !data) return null;
  return mapUser(data);
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase.from('engle_users').select('*').eq('referral_code', code).single();
  if (error || !data) return null;
  return mapUser(data);
}

export async function createUser(user: User): Promise<void> {
  const { error } = await supabase.from('engle_users').insert({
    id: user.id,
    phone: user.phone,
    password: user.password,
    name: user.name,
    referral_code: user.referralCode,
    referred_by: user.referredBy,
    balance: user.balance,
    total_earnings: user.totalEarnings,
    total_withdrawal: user.totalWithdrawal,
    referral_earnings: user.referralEarnings,
    daily_earnings: user.dailyEarnings,
    registration_bonus: user.registrationBonus,
    last_check_in: user.lastCheckIn,
    frozen: user.frozen ?? false,
    claimed_missions: user.claimedMissions ?? [],
  });
  if (error) console.error('createUser:', error);
}

export async function updateUser(
  userOrId: User | string,
  patch?: Partial<{
    balance: number;
    totalEarnings: number;
    totalWithdrawal: number;
    referralEarnings: number;
    dailyEarnings: number;
    lastCheckIn: string | null;
    frozen: boolean;
    claimedMissions: string[];
    password: string;
    name: string;
  }>
): Promise<void> {
  if (typeof userOrId === 'string') {
    const id = userOrId;
    const updates: Record<string, unknown> = {};
    if (patch?.balance !== undefined) updates.balance = patch.balance;
    if (patch?.totalEarnings !== undefined) updates.total_earnings = patch.totalEarnings;
    if (patch?.totalWithdrawal !== undefined) updates.total_withdrawal = patch.totalWithdrawal;
    if (patch?.referralEarnings !== undefined) updates.referral_earnings = patch.referralEarnings;
    if (patch?.dailyEarnings !== undefined) updates.daily_earnings = patch.dailyEarnings;
    if (patch?.lastCheckIn !== undefined) updates.last_check_in = patch.lastCheckIn;
    if (patch?.frozen !== undefined) updates.frozen = patch.frozen;
    if (patch?.claimedMissions !== undefined) updates.claimed_missions = patch.claimedMissions;
    if (patch?.password !== undefined) updates.password = patch.password;
    if (patch?.name !== undefined) updates.name = patch.name;
    const { error } = await supabase.from('engle_users').update(updates).eq('id', id);
    if (error) console.error('updateUser (partial):', error);
  } else {
    const user = userOrId;
    const { error } = await supabase.from('engle_users').update({
      phone: user.phone,
      password: user.password,
      name: user.name,
      balance: user.balance,
      total_earnings: user.totalEarnings,
      total_withdrawal: user.totalWithdrawal,
      referral_earnings: user.referralEarnings,
      daily_earnings: user.dailyEarnings,
      last_check_in: user.lastCheckIn,
      frozen: user.frozen ?? false,
      claimed_missions: user.claimedMissions ?? [],
    }).eq('id', user.id);
    if (error) console.error('updateUser (full):', error);
  }
}

export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase.from('engle_users').delete().eq('id', id);
  if (error) console.error('deleteUserById:', error);
}

export async function getProducts(): Promise<UserProduct[]> {
  const { data, error } = await supabase.from('engle_products').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getProducts:', error); return []; }
  return (data ?? []).map(mapProduct);
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data, error } = await supabase.from('engle_products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('getUserProducts:', error); return []; }
  return (data ?? []).map(mapProduct);
}

export async function createProduct(product: UserProduct): Promise<void> {
  const { error } = await supabase.from('engle_products').insert({
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

export async function updateProduct(
  id: string,
  patch: Partial<{
    status: string;
    buyDate: string | null;
    expiryDate: string | null;
    lastIncomeDate: string | null;
    totalIncomeEarned: number;
  }>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.buyDate !== undefined) updates.buy_date = patch.buyDate;
  if (patch.expiryDate !== undefined) updates.expiry_date = patch.expiryDate;
  if (patch.lastIncomeDate !== undefined) updates.last_income_date = patch.lastIncomeDate;
  if (patch.totalIncomeEarned !== undefined) updates.total_income_earned = patch.totalIncomeEarned;
  const { error } = await supabase.from('engle_products').update(updates).eq('id', id);
  if (error) console.error('updateProduct:', error);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('engle_products').delete().eq('id', id);
  if (error) console.error('deleteProduct:', error);
}

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.from('engle_notifications').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getNotifications:', error); return []; }
  return (data ?? []).map(mapNotification);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase.from('engle_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('getUserNotifications:', error); return []; }
  return (data ?? []).map(mapNotification);
}

export async function addNotification(
  notif: Omit<Notification, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<void> {
  const { error } = await supabase.from('engle_notifications').insert({
    id: notif.id ?? crypto.randomUUID(),
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    is_read: notif.isRead ?? false,
    created_at: notif.createdAt ?? new Date().toISOString(),
  });
  if (error) console.error('addNotification:', error);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('engle_notifications').update({ is_read: true }).eq('id', id);
  if (error) console.error('markNotificationRead:', error);
}

export async function getRecharges(): Promise<Recharge[]> {
  const { data, error } = await supabase.from('engle_recharges').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getRecharges:', error); return []; }
  return (data ?? []).map(mapRecharge);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data, error } = await supabase.from('engle_recharges').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('getUserRecharges:', error); return []; }
  return (data ?? []).map(mapRecharge);
}

export async function createRecharge(recharge: Recharge): Promise<void> {
  const { error } = await supabase.from('engle_recharges').insert({
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
  if (error) console.error('createRecharge:', error);
}

export async function updateRecharge(
  id: string,
  patch: Partial<{ status: string; processedAt: string | null }>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.processedAt !== undefined) updates.processed_at = patch.processedAt;
  const { error } = await supabase.from('engle_recharges').update(updates).eq('id', id);
  if (error) console.error('updateRecharge:', error);
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase.from('engle_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (error) { console.error('getUserWallets:', error); return []; }
  return (data ?? []).map(mapWallet);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  const { error } = await supabase.from('engle_wallets').insert({
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
    created_at: wallet.createdAt,
  });
  if (error) console.error('saveWallet:', error);
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  const { error } = await supabase.from('engle_wallets').delete().eq('user_id', userId);
  if (error) console.error('deleteWalletsByUser:', error);
}

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase.from('engle_withdrawals').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getWithdrawals:', error); return []; }
  return (data ?? []).map(mapWithdrawal);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase.from('engle_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('getUserWithdrawals:', error); return []; }
  return (data ?? []).map(mapWithdrawal);
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  const { error } = await supabase.from('engle_withdrawals').insert({
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
  if (error) console.error('createWithdrawal:', error);
}

export async function updateWithdrawal(
  id: string,
  patch: Partial<{ status: string; processedAt: string | null }>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.processedAt !== undefined) updates.processed_at = patch.processedAt;
  const { error } = await supabase.from('engle_withdrawals').update(updates).eq('id', id);
  if (error) console.error('updateWithdrawal:', error);
}

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase.from('engle_redeem_codes').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getRedeemCodes:', error); return []; }
  return (data ?? []).map(mapRedeemCode);
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase.from('engle_redeem_codes').insert({
    id: code.id,
    code: code.code,
    amount: code.amount,
    expires_at: code.expiresAt,
    used_by: code.usedBy,
    is_active: code.isActive,
    created_at: code.createdAt,
  });
  if (error) console.error('createRedeemCode:', error);
}

export async function updateRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase.from('engle_redeem_codes').update({
    used_by: code.usedBy,
    is_active: code.isActive,
  }).eq('id', code.id);
  if (error) console.error('updateRedeemCode:', error);
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  const { error } = await supabase.from('engle_redeem_codes').delete().eq('id', id);
  if (error) console.error('deleteRedeemCodeById:', error);
}

export async function processDailyIncome(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;
  const { data: products, error } = await supabase.from('engle_products').select('*').eq('user_id', user.id).eq('status', 'active');
  if (error || !products?.length) return;
  const now = new Date();
  for (const row of products) {
    const product = mapProduct(row);
    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }
    const lastIncome = product.lastIncomeDate ? new Date(product.lastIncomeDate) : null;
    const hoursSince = lastIncome ? (now.getTime() - lastIncome.getTime()) / 3600000 : 25;
    if (hoursSince < 24) continue;
    const freshUser = await getUserById(user.id);
    if (!freshUser) continue;
    await updateUser(user.id, {
      balance: freshUser.balance + product.dailyIncome,
      totalEarnings: freshUser.totalEarnings + product.dailyIncome,
    });
    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: product.totalIncomeEarned + product.dailyIncome,
    });
    await addNotification({
      userId: user.id,
      type: 'daily_income',
      title: 'Daily Income Received',
      message: `You earned UGX ${product.dailyIncome.toLocaleString()} from ${product.packageName}`,
      isRead: false,
    });
  }
}

export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number }> {
  const { data: products, error } = await supabase.from('engle_products').select('*').eq('status', 'active');
  if (error || !products?.length) return { processed: 0, totalPaid: 0 };
  const now = new Date();
  let processed = 0;
  let totalPaid = 0;
  for (const row of products) {
    const product = mapProduct(row);
    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }
    const lastIncome = product.lastIncomeDate ? new Date(product.lastIncomeDate) : null;
    const hoursSince = lastIncome ? (now.getTime() - lastIncome.getTime()) / 3600000 : 25;
    if (hoursSince < 24) continue;
    const freshUser = await getUserById(product.userId);
    if (!freshUser) continue;
    await updateUser(product.userId, {
      balance: freshUser.balance + product.dailyIncome,
      totalEarnings: freshUser.totalEarnings + product.dailyIncome,
    });
    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: product.totalIncomeEarned + product.dailyIncome,
    });
    await addNotification({
      userId: product.userId,
      type: 'daily_income',
      title: 'Daily Income Received',
      message: `You earned UGX ${product.dailyIncome.toLocaleString()} from ${product.packageName}`,
      isRead: false,
    });
    processed++;
    totalPaid += product.dailyIncome;
  }
  return { processed, totalPaid };
}
