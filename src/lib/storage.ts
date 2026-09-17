/**
 * storage.ts — Fixed for Eagle Investment
 */

import { createClient } from '@supabase/supabase-js';
import { User, UserProduct, Notification, Recharge, Wallet, Withdrawal, RedeemCode } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use Eagle keys - clear old Samsung cache
const SESSION_KEY = 'eagle_current_user';
const ADMIN_SESSION_KEY = 'eagle_admin_session';

export function getCurrentUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Handle old bug where only ID string was saved
    if (typeof parsed === 'string') return null;
    return parsed as User;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | string | null): void {
  if (!user) {
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  // If string ID passed, we need to fetch later - for now just clear and let caller handle
  if (typeof user === 'string') {
    // Keep backward compat: store as {id: string} placeholder
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user }));
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
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

//... KEEP ALL YOUR MAPPERS SAME AS BEFORE...
function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    password: row.password,
    balance: Number(row.balance?? 0),
    totalEarnings: Number(row.total_earnings?? 0),
    dailyEarnings: Number(row.daily_earnings?? 0),
    referralEarnings: Number(row.referral_earnings?? 0),
    totalWithdrawal: Number(row.total_withdrawal?? 0),
    referralCode: row.referral_code,
    referredBy: row.referred_by?? null,
    frozen: Boolean(row.frozen),
    claimedMissions: row.claimed_missions?? [],
    lastCheckIn: row.last_check_in?? row.last_checkin_date?? null,
    registrationBonus: Number(row.registration_bonus?? 7000),
    createdAt: row.created_at,
  };
}
function mapProduct(row: any): UserProduct { return { id: row.id, userId: row.user_id, packageId: row.package_id, packageName: row.package_name, packagePrice: Number(row.package_price?? 0), dailyIncome: Number(row.daily_income?? 0), duration: Number(row.duration?? 0), status: row.status, buyDate: row.buy_date?? null, expiryDate: row.expiry_date?? null, lastIncomeDate: row.last_income_date?? null, totalIncomeEarned: Number(row.total_income_earned?? 0), paymentProof: row.payment_proof?? '', }; }
function mapNotification(row: any): Notification { return { id: row.id, userId: row.user_id, type: row.type, title: row.title, message: row.message, isRead: Boolean(row.is_read), createdAt: row.created_at, }; }
function mapRecharge(row: any): Recharge { return { id: row.id, userId: row.user_id, userName: row.user_name?? '', userPhone: row.user_phone?? '', amount: Number(row.amount?? 0), network: row.network, senderPhone: row.sender_phone, senderName: row.sender_name?? '', proof: row.proof?? '', status: row.status, createdAt: row.created_at, processedAt: row.processed_at?? null, }; }
function mapWallet(row: any): Wallet { return { id: row.id, userId: row.user_id, type: row.type, phone: row.phone, name: row.name, createdAt: row.created_at, }; }
function mapWithdrawal(row: any): Withdrawal { return { id: row.id, userId: row.user_id, userName: row.user_name?? '', userPhone: row.user_phone?? '', amount: Number(row.amount?? 0), netAmount: Number(row.net_amount?? 0), walletType: row.wallet_type, walletPhone: row.wallet_phone, walletName: row.wallet_name, status: row.status, createdAt: row.created_at, processedAt: row.processed_at?? null, }; }
function mapRedeemCode(row: any): RedeemCode { return { id: row.id, code: row.code, amount: Number(row.amount?? 0), createdAt: row.created_at, expiresAt: row.expires_at, usedBy: row.used_by?? [], isActive: Boolean(row.is_active), }; }

// ─── USERS ────────────────────────────────────────────────────────────────
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('samsung_users').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getUsers', error); return []; }
  return (data?? []).map(mapUser);
}
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('samsung_users').select('*').eq('id', id).maybeSingle();
  if (error) { console.error('getUserById', error); return null; }
  return data? mapUser(data) : null;
}
export async function getUserByPhone(phone: string): Promise<User | null> {
  const clean = phone.trim();
  const { data, error } = await supabase.from('samsung_users').select('*').eq('phone', clean).maybeSingle();
  if (error) { console.error('getUserByPhone', error); return null; }
  return data? mapUser(data) : null;
}
export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase.from('samsung_users').select('*').eq('referral_code', code).maybeSingle();
  if (error) { console.error('getUserByReferralCode', error); return null; }
  return data? mapUser(data) : null;
}
export async function createUser(user: User): Promise<void> {
  const { error } = await supabase.from('samsung_users').insert({
    id: user.id, name: user.name, phone: user.phone.trim(), password: user.password,
    balance: user.balance, total_earnings: user.totalEarnings, daily_earnings: user.dailyEarnings,
    referral_earnings: user.referralEarnings, total_withdrawal: user.totalWithdrawal,
    referral_code: user.referralCode, referred_by: user.referredBy, frozen: user.frozen?? false,
    claimed_missions: user.claimedMissions?? [], last_check_in: user.lastCheckIn,
    registration_bonus: user.registrationBonus?? 7000, created_at: user.createdAt,
  });
  if (error) console.error('createUser', error);
}
export async function updateUser(userOrId: User | string, partial?: any): Promise<void> {
  if (typeof userOrId === 'string') {
    const p = partial?? {}; const payload: any = {};
    if (p.balance!== undefined) payload.balance = p.balance;
    if (p.totalEarnings!== undefined) payload.total_earnings = p.totalEarnings;
    if (p.dailyEarnings!== undefined) payload.daily_earnings = p.dailyEarnings;
    if (p.referralEarnings!== undefined) payload.referral_earnings = p.referralEarnings;
    if (p.totalWithdrawal!== undefined) payload.total_withdrawal = p.totalWithdrawal;
    if (p.frozen!== undefined) payload.frozen = p.frozen;
    if (p.claimedMissions!== undefined) payload.claimed_missions = p.claimedMissions;
    if (p.lastCheckIn!== undefined) payload.last_check_in = p.lastCheckIn;
    if (p.password!== undefined) payload.password = p.password;
    const { error } = await supabase.from('samsung_users').update(payload).eq('id', userOrId);
    if (error) console.error('updateUser(partial)', error);
  } else {
    const u = userOrId;
    const { error } = await supabase.from('samsung_users').update({
      name: u.name, phone: u.phone, password: u.password, balance: u.balance,
      total_earnings: u.totalEarnings, daily_earnings: u.dailyEarnings,
      referral_earnings: u.referralEarnings, total_withdrawal: u.totalWithdrawal,
      frozen: u.frozen?? false, claimed_missions: u.claimedMissions?? [],
      last_check_in: u.lastCheckIn, registration_bonus: u.registrationBonus,
    }).eq('id', u.id);
    if (error) console.error('updateUser(full)', error);
  }
}
export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_users').delete().eq('id', id);
  if (error) console.error('deleteUserById', error);
}
// KEEP REST OF YOUR FUNCTIONS (Products, Notifications, etc) SAME AS BEFORE
export async function getProducts(): Promise<UserProduct[]> {
  const { data, error } = await supabase.from('samsung_products').select('*').order('created_at', { ascending: false });
  if (error) { return []; } return (data?? []).map(mapProduct);
}
export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data, error } = await supabase.from('samsung_products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { return []; } return (data?? []).map(mapProduct);
}
export async function createProduct(product: UserProduct): Promise<void> {
  const { error } = await supabase.from('samsung_products').insert({
    id: product.id, user_id: product.userId, package_id: product.packageId, package_name: product.packageName,
    package_price: product.packagePrice, daily_income: product.dailyIncome, duration: product.duration,
    status: product.status, buy_date: product.buyDate, expiry_date: product.expiryDate,
    last_income_date: product.lastIncomeDate, total_income_earned: product.totalIncomeEarned, payment_proof: product.paymentProof?? '',
  }); if (error) console.error('createProduct', error);
}
export async function updateProduct(id: string, partial: any): Promise<void> {
  const payload: any = {};
  if (partial.status!== undefined) payload.status = partial.status;
  if (partial.buyDate!== undefined) payload.buy_date = partial.buyDate;
  if (partial.expiryDate!== undefined) payload.expiry_date = partial.expiryDate;
  if (partial.lastIncomeDate!== undefined) payload.last_income_date = partial.lastIncomeDate;
  if (partial.totalIncomeEarned!== undefined) payload.total_income_earned = partial.totalIncomeEarned;
  const { error } = await supabase.from('samsung_products').update(payload).eq('id', id);
  if (error) console.error('updateProduct', error);
}
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_products').delete().eq('id', id);
  if (error) console.error('deleteProduct', error);
}
export async function getNotifications(): Promise<Notification[]> {
  const { data } = await supabase.from('samsung_notifications').select('*').order('created_at', { ascending: false });
  return (data?? []).map(mapNotification);
}
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase.from('samsung_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data?? []).map(mapNotification);
}
export async function addNotification(notif: any): Promise<void> {
  await supabase.from('samsung_notifications').insert({
    id: crypto.randomUUID(), user_id: notif.userId, type: notif.type, title: notif.title,
    message: notif.message, is_read: notif.isRead?? false, created_at: new Date().toISOString(),
  });
}
export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('samsung_notifications').update({ is_read: true }).eq('id', id);
}
export async function getRecharges(): Promise<Recharge[]> {
  const { data } = await supabase.from('samsung_recharges').select('*').order('created_at', { ascending: false });
  return (data?? []).map(mapRecharge);
}
export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data } = await supabase.from('samsung_recharges').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data?? []).map(mapRecharge);
}
export async function createRecharge(recharge: Recharge): Promise<void> {
  await supabase.from('samsung_recharges').insert({
    id: recharge.id, user_id: recharge.userId, user_name: recharge.userName, user_phone: recharge.userPhone,
    amount: recharge.amount, network: recharge.network, sender_phone: recharge.senderPhone,
    sender_name: recharge.senderName, proof: recharge.proof, status: recharge.status,
    created_at: recharge.createdAt, processed_at: recharge.processedAt,
  });
}
export async function updateRecharge(id: string, partial: any): Promise<void> {
  const payload: any = {};
  if (partial.status!== undefined) payload.status = partial.status;
  if (partial.processedAt!== undefined) payload.processed_at = partial.processedAt;
  await supabase.from('samsung_recharges').update(payload).eq('id', id);
}
export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data } = await supabase.from('samsung_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  return (data?? []).map(mapWallet);
}
export async function saveWallet(wallet: Wallet): Promise<void> {
  await supabase.from('samsung_wallets').upsert({
    id: wallet.id, user_id: wallet.userId, type: wallet.type, phone: wallet.phone, name: wallet.name, created_at: wallet.createdAt,
  });
}
export async function deleteWalletsByUser(userId: string): Promise<void> {
  await supabase.from('samsung_wallets').delete().eq('user_id', userId);
}
export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').order('created_at', { ascending: false });
  return (data?? []).map(mapWithdrawal);
}
export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data?? []).map(mapWithdrawal);
}
export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  await supabase.from('samsung_withdrawals').insert({
    id: withdrawal.id, user_id: withdrawal.userId, user_name: withdrawal.userName, user_phone: withdrawal.userPhone,
    amount: withdrawal.amount, net_amount: withdrawal.netAmount, wallet_type: withdrawal.walletType,
    wallet_phone: withdrawal.walletPhone, wallet_name: withdrawal.walletName, status: withdrawal.status,
    created_at: withdrawal.createdAt, processed_at: withdrawal.processedAt,
  });
}
export async function updateWithdrawal(id: string, partial: any): Promise<void> {
  const payload: any = {};
  if (partial.status!== undefined) payload.status = partial.status;
  if (partial.processedAt!== undefined) payload.processed_at = partial.processedAt;
  await supabase.from('samsung_withdrawals').update(payload).eq('id', id);
}
export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data } = await supabase.from('samsung_redeem_codes').select('*').order('created_at', { ascending: false });
  return (data?? []).map(mapRedeemCode);
}
export async function createRedeemCode(code: RedeemCode): Promise<void> {
  await supabase.from('samsung_redeem_codes').insert({
    id: code.id, code: code.code, amount: code.amount, created_at: code.createdAt,
    expires_at: code.expiresAt, used_by: code.usedBy, is_active: code.isActive,
  });
}
export async function updateRedeemCode(code: RedeemCode): Promise<void> {
  await supabase.from('samsung_redeem_codes').update({
    code: code.code, amount: code.amount, expires_at: code.expiresAt, used_by: code.usedBy, is_active: code.isActive,
  }).eq('id', code.id);
}
export async function deleteRedeemCodeById(id: string): Promise<void> {
  await supabase.from('samsung_redeem_codes').delete().eq('id', id);
}
export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number; errors: number }> {
  const stats = { processed: 0, totalPaid: 0, errors: 0 };
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const allProducts = await getProducts();
  const activeProducts = allProducts.filter((p) => p.status === 'active');
  for (const product of activeProducts) {
    try {
      if (product.lastIncomeDate && product.lastIncomeDate.startsWith(todayStr)) continue;
      if (product.expiryDate && new Date(product.expiryDate) < now) {
        await updateProduct(product.id, { status: 'expired' }); continue;
      }
      const income = product.dailyIncome;
      await updateProduct(product.id, { lastIncomeDate: now.toISOString(), totalIncomeEarned: product.totalIncomeEarned + income });
      const fresh = await getUserById(product.userId);
      if (fresh) {
        await updateUser(product.userId, { balance: fresh.balance + income, totalEarnings: fresh.totalEarnings + income, dailyEarnings: (fresh.dailyEarnings ?? 0) + income });
        await addNotification({ userId: product.userId, type: 'income', title: 'Daily Income Credited', message: `UGX ${income.toLocaleString()} from ${product.packageName} has been added to your balance.`, isRead: false });
      }
      stats.processed++;
      stats.totalPaid += income;
    } catch (e) {
      console.error('runDailyIncomeWithStats error for product', product.id, e);
      stats.errors++;
    }
  }
  return stats;
}

export async function processDailyIncome(): Promise<void> {
  const user = getCurrentUser(); if (!user) return;
  const now = new Date(); const todayStr = now.toISOString().split('T')[0];
  const products = await getUserProducts(user.id);
  const activeProducts = products.filter((p) => p.status === 'active');
  for (const product of activeProducts) {
    if (product.lastIncomeDate && product.lastIncomeDate.startsWith(todayStr)) continue;
    if (product.expiryDate && new Date(product.expiryDate) < now) {
      await updateProduct(product.id, { status: 'expired' }); continue;
    }
    const income = product.dailyIncome;
    await updateProduct(product.id, { lastIncomeDate: now.toISOString(), totalIncomeEarned: product.totalIncomeEarned + income, });
    const fresh = await getUserById(user.id);
    if (fresh) await updateUser(user.id, { balance: fresh.balance + income, totalEarnings: fresh.totalEarnings + income, dailyEarnings: (fresh.dailyEarnings?? 0) + income, });
  }
}
