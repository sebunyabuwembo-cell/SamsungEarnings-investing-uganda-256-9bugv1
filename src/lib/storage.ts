import { supabase } from '@/lib/supabase';
import { User, Product, Recharge, Withdrawal, Wallet, Notification, RedeemCode } from '@/types';

// ─── camelCase ↔ snake_case helpers ─────────────────────────────────────────

function userFromRow(row: any): User {
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
    lastCheckIn: row.last_check_in ?? null,
    registrationBonus: Number(row.registration_bonus ?? 7000),
    createdAt: row.created_at,
  };
}

function userToRow(u: Partial<User>) {
  const row: any = {};
  if (u.id !== undefined) row.id = u.id;
  if (u.name !== undefined) row.name = u.name;
  if (u.phone !== undefined) row.phone = u.phone;
  if (u.password !== undefined) row.password = u.password;
  if (u.balance !== undefined) row.balance = u.balance;
  if (u.totalEarnings !== undefined) row.total_earnings = u.totalEarnings;
  if (u.dailyEarnings !== undefined) row.daily_earnings = u.dailyEarnings;
  if (u.referralEarnings !== undefined) row.referral_earnings = u.referralEarnings;
  if (u.totalWithdrawal !== undefined) row.total_withdrawal = u.totalWithdrawal;
  if (u.referralCode !== undefined) row.referral_code = u.referralCode;
  if (u.referredBy !== undefined) row.referred_by = u.referredBy;
  if (u.frozen !== undefined) row.frozen = u.frozen;
  if (u.claimedMissions !== undefined) row.claimed_missions = u.claimedMissions;
  if (u.lastCheckIn !== undefined) row.last_check_in = u.lastCheckIn;
  if (u.registrationBonus !== undefined) row.registration_bonus = u.registrationBonus;
  return row;
}

function productFromRow(row: any): Product {
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

function productToRow(p: Partial<Product>) {
  const row: any = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.userId !== undefined) row.user_id = p.userId;
  if (p.packageId !== undefined) row.package_id = p.packageId;
  if (p.packageName !== undefined) row.package_name = p.packageName;
  if (p.packagePrice !== undefined) row.package_price = p.packagePrice;
  if (p.dailyIncome !== undefined) row.daily_income = p.dailyIncome;
  if (p.duration !== undefined) row.duration = p.duration;
  if (p.status !== undefined) row.status = p.status;
  if (p.buyDate !== undefined) row.buy_date = p.buyDate;
  if (p.expiryDate !== undefined) row.expiry_date = p.expiryDate;
  if (p.lastIncomeDate !== undefined) row.last_income_date = p.lastIncomeDate;
  if (p.totalIncomeEarned !== undefined) row.total_income_earned = p.totalIncomeEarned;
  if (p.paymentProof !== undefined) row.payment_proof = p.paymentProof;
  return row;
}

function rechargeFromRow(row: any): Recharge {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount ?? 0),
    network: row.network,
    senderPhone: row.sender_phone,
    proof: row.proof ?? '',
    status: row.status,
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null,
    userName: row.user_name ?? '',
    userPhone: row.user_phone ?? '',
    senderName: row.sender_name ?? '',
  };
}

function withdrawalFromRow(row: any): Withdrawal {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    walletPhone: row.wallet_phone,
    walletName: row.wallet_name,
    walletType: row.wallet_type,
    status: row.status,
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null,
    userName: row.user_name ?? '',
    userPhone: row.user_phone ?? '',
  };
}

function walletFromRow(row: any): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    phone: row.phone,
    name: row.name,
    createdAt: row.created_at,
  };
}

function notificationFromRow(row: any): Notification {
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

function redeemCodeFromRow(row: any): RedeemCode {
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

// ─── Session helpers (localStorage) ─────────────────────────────────────────

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem('currentUser');
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { return null; }
}

export function setCurrentUser(user: User | null): void {
  if (user) localStorage.setItem('currentUser', JSON.stringify(user));
  else localStorage.removeItem('currentUser');
}

export async function refreshCurrentUser(): Promise<User | null> {
  const current = getCurrentUser();
  if (!current) return null;
  const fresh = await getUserById(current.id);
  if (fresh) setCurrentUser(fresh);
  return fresh;
}

export function getAdminSession(): boolean {
  return localStorage.getItem('adminSession') === 'true';
}

export function setAdminSession(value: boolean): void {
  if (value) localStorage.setItem('adminSession', 'true');
  else localStorage.removeItem('adminSession');
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getUsers error:', error); return []; }
  return (data ?? []).map(userFromRow);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('getUserById error:', error); return null; }
  return data ? userFromRow(data) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) { console.error('getUserByPhone error:', error); return null; }
  return data ? userFromRow(data) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('referral_code', code)
    .maybeSingle();
  if (error) { console.error('getUserByReferralCode error:', error); return null; }
  return data ? userFromRow(data) : null;
}

export async function createUser(user: User): Promise<void> {
  const { error } = await supabase
    .from('samsung_users')
    .insert(userToRow(user));
  if (error) { console.error('createUser error:', error); throw error; }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const { error } = await supabase
    .from('samsung_users')
    .update(userToRow(updates))
    .eq('id', id);
  if (error) { console.error('updateUser error:', error); throw error; }
}

export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_users')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteUserById error:', error); throw error; }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getProducts error:', error); return []; }
  return (data ?? []).map(productFromRow);
}

export async function getUserProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserProducts error:', error); return []; }
  return (data ?? []).map(productFromRow);
}

export async function createProduct(product: Product): Promise<void> {
  const { error } = await supabase
    .from('samsung_products')
    .insert(productToRow(product));
  if (error) { console.error('createProduct error:', error); throw error; }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const { error } = await supabase
    .from('samsung_products')
    .update(productToRow(updates))
    .eq('id', id);
  if (error) { console.error('updateProduct error:', error); throw error; }
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_products')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteProduct error:', error); throw error; }
}

// ─── Recharges ────────────────────────────────────────────────────────────────

export async function getRecharges(): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRecharges error:', error); return []; }
  return (data ?? []).map(rechargeFromRow);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserRecharges error:', error); return []; }
  return (data ?? []).map(rechargeFromRow);
}

export async function createRecharge(recharge: Recharge): Promise<void> {
  const row = {
    id: recharge.id,
    user_id: recharge.userId,
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone,
    proof: recharge.proof,
    status: recharge.status,
    user_name: recharge.userName,
    user_phone: recharge.userPhone,
    sender_name: recharge.senderName,
  };
  const { error } = await supabase.from('samsung_recharges').insert(row);
  if (error) { console.error('createRecharge error:', error); throw error; }
}

export async function updateRecharge(id: string, updates: Partial<Recharge>): Promise<void> {
  const row: any = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.processedAt !== undefined) row.processed_at = updates.processedAt;
  if (updates.amount !== undefined) row.amount = updates.amount;
  const { error } = await supabase
    .from('samsung_recharges')
    .update(row)
    .eq('id', id);
  if (error) { console.error('updateRecharge error:', error); throw error; }
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWithdrawals error:', error); return []; }
  return (data ?? []).map(withdrawalFromRow);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWithdrawals error:', error); return []; }
  return (data ?? []).map(withdrawalFromRow);
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  const row = {
    id: withdrawal.id,
    user_id: withdrawal.userId,
    amount: withdrawal.amount,
    net_amount: withdrawal.netAmount,
    wallet_phone: withdrawal.walletPhone,
    wallet_name: withdrawal.walletName,
    wallet_type: withdrawal.walletType,
    status: withdrawal.status,
    user_name: withdrawal.userName,
    user_phone: withdrawal.userPhone,
  };
  const { error } = await supabase.from('samsung_withdrawals').insert(row);
  if (error) { console.error('createWithdrawal error:', error); throw error; }
}

export async function updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<void> {
  const row: any = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.processedAt !== undefined) row.processed_at = updates.processedAt;
  if (updates.netAmount !== undefined) row.net_amount = updates.netAmount;
  const { error } = await supabase
    .from('samsung_withdrawals')
    .update(row)
    .eq('id', id);
  if (error) { console.error('updateWithdrawal error:', error); throw error; }
}

// ─── Wallets ──────────────────────────────────────────────────────────────────

export async function getWallets(): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWallets error:', error); return []; }
  return (data ?? []).map(walletFromRow);
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWallets error:', error); return []; }
  return (data ?? []).map(walletFromRow);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  const row = {
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
  };
  const { error } = await supabase.from('samsung_wallets').upsert(row);
  if (error) { console.error('saveWallet error:', error); throw error; }
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_wallets')
    .delete()
    .eq('user_id', userId);
  if (error) { console.error('deleteWalletsByUser error:', error); throw error; }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getNotifications error:', error); return []; }
  return (data ?? []).map(notificationFromRow);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserNotifications error:', error); return []; }
  return (data ?? []).map(notificationFromRow);
}

export async function addNotification(notif: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  const row = {
    id: crypto.randomUUID(),
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    is_read: notif.isRead ?? false,
  };
  const { error } = await supabase.from('samsung_notifications').insert(row);
  if (error) { console.error('addNotification error:', error); throw error; }
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) { console.error('markNotificationRead error:', error); throw error; }
}

export async function deleteNotificationsByUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_notifications')
    .delete()
    .eq('user_id', userId);
  if (error) { console.error('deleteNotificationsByUser error:', error); throw error; }
}

// ─── Redeem Codes ─────────────────────────────────────────────────────────────

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase
    .from('samsung_redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRedeemCodes error:', error); return []; }
  return (data ?? []).map(redeemCodeFromRow);
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  const row = {
    id: code.id,
    code: code.code,
    amount: code.amount,
    expires_at: code.expiresAt,
    used_by: code.usedBy ?? [],
    is_active: code.isActive ?? true,
  };
  const { error } = await supabase.from('samsung_redeem_codes').insert(row);
  if (error) { console.error('createRedeemCode error:', error); throw error; }
}

export async function updateRedeemCode(id: string, updates: Partial<RedeemCode>): Promise<void> {
  const row: any = {};
  if (updates.isActive !== undefined) row.is_active = updates.isActive;
  if (updates.usedBy !== undefined) row.used_by = updates.usedBy;
  const { error } = await supabase
    .from('samsung_redeem_codes')
    .update(row)
    .eq('id', id);
  if (error) { console.error('updateRedeemCode error:', error); throw error; }
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_redeem_codes')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteRedeemCodeById error:', error); throw error; }
}

// ─── Daily Income Engine ──────────────────────────────────────────────────────

export async function processDailyIncome(): Promise<void> {
  await runDailyIncomeWithStats();
}

export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number; expired: number }> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const allProducts = await getProducts();
  const activeProducts = allProducts.filter(p => p.status === 'active');

  let processed = 0;
  let totalPaid = 0;
  let expired = 0;

  for (const product of activeProducts) {
    const lastDate = product.lastIncomeDate ? product.lastIncomeDate.split('T')[0] : null;
    if (lastDate === today) continue;

    const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;
    if (expiryDate && now > expiryDate) {
      await updateProduct(product.id, { status: 'expired' });
      expired++;
      continue;
    }

    // Credit daily income
    const income = product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: now.toISOString(),
      totalIncomeEarned: product.totalIncomeEarned + income,
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
        title: 'Daily Income Credited',
        message: `UGX ${income.toLocaleString()} has been credited to your account from ${product.packageName}.`,
        isRead: false,
      });
    }

    totalPaid += income;
    processed++;
  }

  console.log(`Daily income: processed=${processed}, totalPaid=${totalPaid}, expired=${expired}`);
  return { processed, totalPaid, expired };
}
