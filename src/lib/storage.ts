import { supabase } from '@/lib/supabase';
import { User, UserProduct, Recharge, Withdrawal, Wallet, Notification, RedeemCode } from '@/types';

const SESSION_KEY = 'samsung_current_user';
const ADMIN_KEY = 'samsung_admin_session';

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function setCurrentUser(user: User | null): void {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}
export async function refreshCurrentUser(): Promise<User | null> {
  const cached = getCurrentUser();
  if (!cached) return null;
  const fresh = await getUserById(cached.id);
  if (fresh) setCurrentUser(fresh);
  return fresh;
}
export function getAdminSession(): boolean { return localStorage.getItem(ADMIN_KEY) === 'true'; }
export function setAdminSession(value: boolean): void {
  if (value) localStorage.setItem(ADMIN_KEY, 'true');
  else localStorage.removeItem(ADMIN_KEY);
}

function rowToUser(r: any): User {
  return {
    id: r.id, name: r.name, phone: r.phone, password: r.password,
    balance: Number(r.balance ?? 0), totalEarnings: Number(r.total_earnings ?? 0),
    dailyEarnings: Number(r.daily_earnings ?? 0), referralEarnings: Number(r.referral_earnings ?? 0),
    totalWithdrawal: Number(r.total_withdrawal ?? 0), referralCode: r.referral_code,
    referredBy: r.referred_by ?? null, frozen: r.frozen ?? false,
    claimedMissions: r.claimed_missions ?? [], lastCheckIn: r.last_check_in ?? null,
    registrationBonus: Number(r.registration_bonus ?? 7000), createdAt: r.created_at,
  };
}
function userToRow(u: User) {
  return {
    id: u.id, name: u.name, phone: u.phone, password: u.password, balance: u.balance,
    total_earnings: u.totalEarnings, daily_earnings: u.dailyEarnings,
    referral_earnings: u.referralEarnings, total_withdrawal: u.totalWithdrawal,
    referral_code: u.referralCode, referred_by: u.referredBy ?? null,
    frozen: u.frozen ?? false, claimed_missions: u.claimedMissions ?? [],
    last_check_in: u.lastCheckIn ?? null, registration_bonus: u.registrationBonus ?? 7000,
  };
}
function rowToProduct(r: any): UserProduct {
  return { id: r.id, userId: r.user_id, packageId: r.package_id, packageName: r.package_name, packagePrice: Number(r.package_price), dailyIncome: Number(r.daily_income), duration: r.duration, status: r.status, buyDate: r.buy_date ?? '', expiryDate: r.expiry_date ?? '', lastIncomeDate: r.last_income_date ?? null, totalIncomeEarned: Number(r.total_income_earned ?? 0), paymentProof: r.payment_proof ?? '' };
}
function rowToRecharge(r: any): Recharge {
  return { id: r.id, userId: r.user_id, userName: r.user_name ?? '', userPhone: r.user_phone ?? '', amount: Number(r.amount), network: r.network, senderPhone: r.sender_phone, senderName: r.sender_name ?? '', proof: r.proof ?? '', status: r.status, createdAt: r.created_at, processedAt: r.processed_at ?? null };
}
function rowToWithdrawal(r: any): Withdrawal {
  return { id: r.id, userId: r.user_id, userName: r.user_name ?? '', userPhone: r.user_phone ?? '', amount: Number(r.amount), netAmount: Number(r.net_amount), walletType: r.wallet_type, walletPhone: r.wallet_phone, walletName: r.wallet_name, status: r.status, createdAt: r.created_at, processedAt: r.processed_at ?? null };
}
function rowToWallet(r: any): Wallet { return { id: r.id, userId: r.user_id, type: r.type, phone: r.phone, name: r.name, createdAt: r.created_at }; }
function rowToNotification(r: any): Notification { return { id: r.id, userId: r.user_id, type: r.type, title: r.title, message: r.message, isRead: r.is_read, createdAt: r.created_at }; }
function rowToRedeemCode(r: any): RedeemCode { return { id: r.id, code: r.code, amount: Number(r.amount), createdAt: r.created_at, expiresAt: r.expires_at, usedBy: r.used_by ?? [], isActive: r.is_active }; }

// ─── Users ───
export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from('samsung_users').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(rowToUser);
}
export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from('samsung_users').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return rowToUser(data);
  } catch { return null; }
}
export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from('samsung_users').select('*').eq('phone', phone).maybeSingle();
    if (error || !data) return null;
    return rowToUser(data);
  } catch { return null; }
}
export async function getUserByReferralCode(code: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from('samsung_users').select('*').eq('referral_code', code.toUpperCase()).maybeSingle();
    if (error || !data) return null;
    return rowToUser(data);
  } catch { return null; }
}
export async function createUser(user: User): Promise<void> {
  const { error } = await supabase.from('samsung_users').insert(userToRow(user));
  if (error) { console.error("createUser error:", error); throw new Error(error.message); }
}
export async function updateUser(user: User): Promise<void> { await supabase.from('samsung_users').update(userToRow(user)).eq('id', user.id); }
export async function deleteUserById(id: string): Promise<void> { await supabase.from('samsung_users').delete().eq('id', id); }

// ─── Products ───
export async function getProducts(): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(rowToProduct);
}
export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data } = await supabase.from('samsung_products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(rowToProduct);
}
export async function createProduct(product: UserProduct): Promise<void> {
  await supabase.from('samsung_products').insert({ id: product.id, user_id: product.userId, package_id: product.packageId, package_name: product.packageName, package_price: product.packagePrice, daily_income: product.dailyIncome, duration: product.duration, status: product.status, buy_date: product.buyDate || null, expiry_date: product.expiryDate || null, last_income_date: product.lastIncomeDate ?? null, total_income_earned: product.totalIncomeEarned ?? 0, payment_proof: product.paymentProof ?? '' });
}
export async function updateProduct(product: UserProduct): Promise<void> {
  await supabase.from('samsung_products').update({ user_id: product.userId, package_id: product.packageId, package_name: product.packageName, package_price: product.packagePrice, daily_income: product.dailyIncome, duration: product.duration, status: product.status, buy_date: product.buyDate || null, expiry_date: product.expiryDate || null, last_income_date: product.lastIncomeDate ?? null, total_income_earned: product.totalIncomeEarned ?? 0, payment_proof: product.paymentProof ?? '' }).eq('id', product.id);
}
export async function deleteProduct(id: string): Promise<void> { await supabase.from('samsung_products').delete().eq('id', id); }

// ─── Recharges / Withdrawals / Wallets / Notifications / Redeem ───
export async function getRecharges(): Promise<Recharge[]> { const { data } = await supabase.from('samsung_recharges').select('*').order('created_at', { ascending: false }); return (data ?? []).map(rowToRecharge); }
export async function getUserRecharges(userId: string): Promise<Recharge[]> { const { data } = await supabase.from('samsung_recharges').select('*').eq('user_id', userId).order('created_at', { ascending: false }); return (data ?? []).map(rowToRecharge); }
export async function createRecharge(recharge: Recharge): Promise<void> { await supabase.from('samsung_recharges').insert({ id: recharge.id, user_id: recharge.userId, user_name: recharge.userName, user_phone: recharge.userPhone, amount: recharge.amount, network: recharge.network, sender_phone: recharge.senderPhone, sender_name: recharge.senderName ?? '', proof: recharge.proof ?? '', status: recharge.status }); }
export async function updateRecharge(recharge: Recharge): Promise<void> { await supabase.from('samsung_recharges').update({ status: recharge.status, processed_at: recharge.processedAt }).eq('id', recharge.id); }

export async function getWithdrawals(): Promise<Withdrawal[]> { const { data } = await supabase.from('samsung_withdrawals').select('*').order('created_at', { ascending: false }); return (data ?? []).map(rowToWithdrawal); }
export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> { const { data } = await supabase.from('samsung_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false }); return (data ?? []).map(rowToWithdrawal); }
export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> { await supabase.from('samsung_withdrawals').insert({ id: withdrawal.id, user_id: withdrawal.userId, user_name: withdrawal.userName, user_phone: withdrawal.userPhone, amount: withdrawal.amount, net_amount: withdrawal.netAmount, wallet_type: withdrawal.walletType, wallet_phone: withdrawal.walletPhone, wallet_name: withdrawal.walletName, status: withdrawal.status }); }
export async function updateWithdrawal(withdrawal: Withdrawal): Promise<void> { await supabase.from('samsung_withdrawals').update({ status: withdrawal.status, processed_at: withdrawal.processedAt }).eq('id', withdrawal.id); }

export async function getWallets(): Promise<Wallet[]> { const { data } = await supabase.from('samsung_wallets').select('*').order('created_at', { ascending: false }); return (data ?? []).map(rowToWallet); }
export async function getUserWallets(userId: string): Promise<Wallet[]> { const { data } = await supabase.from('samsung_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: false }); return (data ?? []).map(rowToWallet); }
export async function saveWallet(wallet: Wallet): Promise<void> { await supabase.from('samsung_wallets').upsert({ id: wallet.id, user_id: wallet.userId, type: wallet.type, phone: wallet.phone, name: wallet.name }); }
export async function deleteWalletsByUser(userId: string): Promise<void> { await supabase.from('samsung_wallets').delete().eq('user_id', userId); }

export async function getNotifications(): Promise<Notification[]> { const { data } = await supabase.from('samsung_notifications').select('*').order('created_at', { ascending: false }); return (data ?? []).map(rowToNotification); }
export async function getUserNotifications(userId: string): Promise<Notification[]> { const { data } = await supabase.from('samsung_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }); return (data ?? []).map(rowToNotification); }
export async function addNotification(n: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  const { generateId } = await import('@/lib/utils');
  await supabase.from('samsung_notifications').insert({ id: generateId(), user_id: n.userId, type: n.type, title: n.title, message: n.message, is_read: n.isRead });
}
export async function markNotificationRead(id: string): Promise<void> { await supabase.from('samsung_notifications').update({ is_read: true }).eq('id', id); }
export async function deleteNotificationsByUser(userId: string): Promise<void> { await supabase.from('samsung_notifications').delete().eq('user_id', userId); }

export async function getRedeemCodes(): Promise<RedeemCode[]> { const { data } = await supabase.from('samsung_redeem_codes').select('*').order('created_at', { ascending: false }); return (data ?? []).map(rowToRedeemCode); }
export async function createRedeemCode(code: RedeemCode): Promise<void> { await supabase.from('samsung_redeem_codes').insert({ id: code.id, code: code.code, amount: code.amount, expires_at: code.expiresAt, used_by: code.usedBy, is_active: code.isActive }); }
export async function updateRedeemCode(code: RedeemCode): Promise<void> { await supabase.from('samsung_redeem_codes').update({ used_by: code.usedBy, is_active: code.isActive }).eq('id', code.id); }
export async function deleteRedeemCodeById(id: string): Promise<void> { await supabase.from('samsung_redeem_codes').delete().eq('id', id); }

// ─── Daily Income ───
export async function processDailyIncome(): Promise<void> {
  const [products, users] = await Promise.all([getProducts(), getUsers()]);
  const now = new Date();
  for (const prod of products.filter((p) => p.status === 'active')) {
    const lastIncome = prod.lastIncomeDate ? new Date(prod.lastIncomeDate) : null;
    const hoursSinceLast = lastIncome ? (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60) : 999;
    if (hoursSinceLast < 24) continue;
    if (prod.expiryDate && new Date(prod.expiryDate) < now) { await updateProduct({ ...prod, status: 'expired' }); continue; }
    const user = users.find((u) => u.id === prod.userId);
    if (!user) continue;
    await Promise.all([updateUser({ ...user, balance: user.balance + prod.dailyIncome, totalEarnings: user.totalEarnings + prod.dailyIncome, dailyEarnings: user.dailyEarnings + prod.dailyIncome }), updateProduct({ ...prod, lastIncomeDate: now.toISOString(), totalIncomeEarned: prod.totalIncomeEarned + prod.dailyIncome })]);
  }
}
export async function runDailyIncomeWithStats(): Promise<{ credited: number; total: number }> {
  const [products, users] = await Promise.all([getProducts(), getUsers()]);
  const now = new Date();
  let credited = 0; let total = 0;
  for (const prod of products.filter((p) => p.status === 'active')) {
    const lastIncome = prod.lastIncomeDate ? new Date(prod.lastIncomeDate) : null;
    const hoursSinceLast = lastIncome ? (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60) : 999;
    if (hoursSinceLast < 24) continue;
    if (prod.expiryDate && new Date(prod.expiryDate) < now) { await updateProduct({ ...prod, status: 'expired' }); continue; }
    const user = users.find((u) => u.id === prod.userId);
    if (!user) continue;
    await Promise.all([updateUser({ ...user, balance: user.balance + prod.dailyIncome, totalEarnings: user.totalEarnings + prod.dailyIncome, dailyEarnings: user.dailyEarnings + prod.dailyIncome }), updateProduct({ ...prod, lastIncomeDate: now.toISOString(), totalIncomeEarned: prod.totalIncomeEarned + prod.dailyIncome }), addNotification({ userId: user.id, type: 'daily_income', title: 'Daily Income Credited!', message: `UGX ${prod.dailyIncome.toLocaleString()} credited for your ${prod.packageName}.`, isRead: false })]);
    credited++; total += prod.dailyIncome;
  }
  return { credited, total };
}
