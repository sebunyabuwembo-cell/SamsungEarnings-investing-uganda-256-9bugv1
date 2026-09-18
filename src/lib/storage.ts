import { supabase } from '@/lib/supabase';
import type { User, UserProduct, Recharge, Withdrawal, Wallet, RedeemCode, Notification } from '@/types';

// ─── Session helpers (in-memory, sessionStorage) ──────────────────────────────

const USER_KEY = 'samsung_current_user';
const ADMIN_KEY = 'samsung_admin_session';

export function getCurrentUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function refreshCurrentUser(): Promise<User | null> {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as User;
    const fresh = await getUserById(cached.id);
    if (fresh) setCurrentUser(fresh);
    return fresh;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_KEY);
  }
}

export function getAdminSession(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function setAdminSession(val: boolean): void {
  if (val) {
    sessionStorage.setItem(ADMIN_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_KEY);
  }
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    phone: row.phone as string,
    password: row.password as string,
    name: row.name as string,
    referralCode: row.referral_code as string,
    referredBy: (row.referred_by as string) || null,
    balance: Number(row.balance ?? 0),
    totalEarnings: Number(row.total_earnings ?? 0),
    totalWithdrawal: Number(row.total_withdrawal ?? 0),
    referralEarnings: Number(row.referral_earnings ?? 0),
    dailyEarnings: Number(row.daily_earnings ?? 0),
    registrationBonus: Number(row.registration_bonus ?? 7000),
    lastCheckIn: (row.last_check_in as string) || null,
    createdAt: row.created_at as string,
    frozen: Boolean(row.frozen),
    claimedMissions: (row.claimed_missions as string[]) || [],
  };
}

function mapProduct(row: Record<string, unknown>): UserProduct {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    packageId: row.package_id as string,
    packageName: row.package_name as string,
    packagePrice: Number(row.package_price ?? 0),
    dailyIncome: Number(row.daily_income ?? 0),
    duration: Number(row.duration ?? 0),
    buyDate: row.buy_date as string,
    expiryDate: row.expiry_date as string,
    status: row.status as 'pending' | 'active' | 'expired',
    lastIncomeDate: (row.last_income_date as string) || null,
    totalIncomeEarned: Number(row.total_income_earned ?? 0),
    paymentProof: (row.payment_proof as string) || '',
  };
}

function mapRecharge(row: Record<string, unknown>): Recharge {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userName: (row.user_name as string) || '',
    userPhone: (row.user_phone as string) || '',
    amount: Number(row.amount ?? 0),
    network: row.network as 'mtn' | 'airtel',
    senderPhone: (row.sender_phone as string) || '',
    senderName: (row.sender_name as string) || '',
    proof: (row.proof as string) || '',
    status: row.status as 'pending' | 'approved' | 'rejected',
    createdAt: row.created_at as string,
    processedAt: (row.processed_at as string) || null,
  };
}

function mapWithdrawal(row: Record<string, unknown>): Withdrawal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userName: (row.user_name as string) || '',
    userPhone: (row.user_phone as string) || '',
    amount: Number(row.amount ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    walletType: row.wallet_type as 'mtn' | 'airtel',
    walletPhone: (row.wallet_phone as string) || '',
    walletName: (row.wallet_name as string) || '',
    status: row.status as 'pending' | 'approved' | 'rejected',
    createdAt: row.created_at as string,
    processedAt: (row.processed_at as string) || null,
  };
}

function mapWallet(row: Record<string, unknown>): Wallet {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as 'mtn' | 'airtel',
    phone: row.phone as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  };
}

function mapRedeemCode(row: Record<string, unknown>): RedeemCode {
  return {
    id: row.id as string,
    code: row.code as string,
    amount: Number(row.amount ?? 0),
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    usedBy: (row.used_by as string[]) || [],
    isActive: Boolean(row.is_active),
  };
}

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    message: row.message as string,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at as string,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getUsers error:', error); return []; }
  return (data || []).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapUser(data);
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error || !data) return null;
  return mapUser(data);
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('referral_code', code)
    .maybeSingle();
  if (error || !data) return null;
  return mapUser(data);
}

export async function createUser(userData: {
  name: string;
  phone: string;
  password: string;
  balance: number;
  total_earnings: number;
  daily_earnings: number;
  referral_earnings: number;
  total_withdrawal: number;
  referral_code: string;
  referred_by?: string;
  frozen: boolean;
  claimed_missions: string[];
  registration_bonus: number;
}): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .insert([userData])
    .select()
    .single();
  if (error) { console.error('createUser error:', error); return null; }
  return mapUser(data);
}

export async function updateUser(id: string, updates: Partial<{
  name: string;
  phone: string;
  password: string;
  balance: number;
  total_earnings: number;
  daily_earnings: number;
  referral_earnings: number;
  total_withdrawal: number;
  frozen: boolean;
  last_check_in: string;
  claimed_missions: string[];
  registration_bonus: number;
}>): Promise<void> {
  const { error } = await supabase
    .from('samsung_users')
    .update(updates)
    .eq('id', id);
  if (error) console.error('updateUser error:', error);
}

export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_users')
    .delete()
    .eq('id', id);
  if (error) console.error('deleteUserById error:', error);
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<UserProduct[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getProducts error:', error); return []; }
  return (data || []).map(mapProduct);
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserProducts error:', error); return []; }
  return (data || []).map(mapProduct);
}

export async function createProduct(productData: {
  user_id: string;
  package_id: string;
  package_name: string;
  package_price: number;
  daily_income: number;
  duration: number;
  status: string;
  buy_date: string;
  expiry_date: string;
  last_income_date: string;
  total_income_earned: number;
  payment_proof: string;
}): Promise<UserProduct | null> {
  const { data, error } = await supabase
    .from('samsung_products')
    .insert([productData])
    .select()
    .single();
  if (error) { console.error('createProduct error:', error); return null; }
  return mapProduct(data);
}

export async function updateProduct(id: string, updates: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('samsung_products')
    .update(updates)
    .eq('id', id);
  if (error) console.error('updateProduct error:', error);
}

// ─── Recharges ────────────────────────────────────────────────────────────────

export async function getRecharges(): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRecharges error:', error); return []; }
  return (data || []).map(mapRecharge);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserRecharges error:', error); return []; }
  return (data || []).map(mapRecharge);
}

export async function createRecharge(rechargeData: {
  user_id: string;
  user_name: string;
  user_phone: string;
  amount: number;
  network: string;
  sender_phone: string;
  sender_name: string;
  proof: string;
  status: string;
}): Promise<Recharge | null> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .insert([rechargeData])
    .select()
    .single();
  if (error) { console.error('createRecharge error:', error); return null; }
  return mapRecharge(data);
}

export async function updateRecharge(id: string, updates: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('samsung_recharges')
    .update(updates)
    .eq('id', id);
  if (error) console.error('updateRecharge error:', error);
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWithdrawals error:', error); return []; }
  return (data || []).map(mapWithdrawal);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWithdrawals error:', error); return []; }
  return (data || []).map(mapWithdrawal);
}

export async function createWithdrawal(wData: {
  user_id: string;
  user_name: string;
  user_phone: string;
  amount: number;
  net_amount: number;
  wallet_type: string;
  wallet_phone: string;
  wallet_name: string;
  status: string;
}): Promise<Withdrawal | null> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .insert([wData])
    .select()
    .single();
  if (error) { console.error('createWithdrawal error:', error); return null; }
  return mapWithdrawal(data);
}

export async function updateWithdrawal(id: string, updates: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('samsung_withdrawals')
    .update(updates)
    .eq('id', id);
  if (error) console.error('updateWithdrawal error:', error);
}

// ─── Wallets ──────────────────────────────────────────────────────────────────

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWallets error:', error); return []; }
  return (data || []).map(mapWallet);
}

export async function createWallet(walletData: {
  user_id: string;
  type: string;
  phone: string;
  name: string;
}): Promise<Wallet | null> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .insert([walletData])
    .select()
    .single();
  if (error) { console.error('createWallet error:', error); return null; }
  return mapWallet(data);
}

export async function deleteWallet(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_wallets')
    .delete()
    .eq('id', id);
  if (error) console.error('deleteWallet error:', error);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getNotifications error:', error); return []; }
  return (data || []).map(mapNotification);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserNotifications error:', error); return []; }
  return (data || []).map(mapNotification);
}

export async function addNotification(
  userIdOrObj: string | { userId: string; type: string; title: string; message: string; isRead: boolean },
  type?: string,
  title?: string,
  message?: string
): Promise<void> {
  let payload: { user_id: string; type: string; title: string; message: string; is_read: boolean };

  if (typeof userIdOrObj === 'string') {
    payload = {
      user_id: userIdOrObj,
      type: type!,
      title: title!,
      message: message!,
      is_read: false,
    };
  } else {
    payload = {
      user_id: userIdOrObj.userId,
      type: userIdOrObj.type,
      title: userIdOrObj.title,
      message: userIdOrObj.message,
      is_read: userIdOrObj.isRead,
    };
  }

  const { error } = await supabase
    .from('samsung_notifications')
    .insert([payload]);
  if (error) console.error('addNotification error:', error);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) console.error('markNotificationRead error:', error);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) console.error('markAllNotificationsRead error:', error);
}

// ─── Redeem Codes ─────────────────────────────────────────────────────────────

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase
    .from('samsung_redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRedeemCodes error:', error); return []; }
  return (data || []).map(mapRedeemCode);
}

export async function getRedeemCodeByCode(code: string): Promise<RedeemCode | null> {
  const { data, error } = await supabase
    .from('samsung_redeem_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error || !data) return null;
  return mapRedeemCode(data);
}

export async function createRedeemCode(codeData: {
  id: string;
  code: string;
  amount: number;
  createdAt: string;
  expiresAt: string;
  usedBy: string[];
  isActive: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from('samsung_redeem_codes')
    .insert([{
      id: codeData.id,
      code: codeData.code,
      amount: codeData.amount,
      created_at: codeData.createdAt,
      expires_at: codeData.expiresAt,
      used_by: codeData.usedBy,
      is_active: codeData.isActive,
    }]);
  if (error) console.error('createRedeemCode error:', error);
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
  if (error) console.error('updateRedeemCode error:', error);
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_redeem_codes')
    .delete()
    .eq('id', id);
  if (error) console.error('deleteRedeemCodeById error:', error);
}

// ─── Daily Income Engine ──────────────────────────────────────────────────────

export async function processDailyIncome(): Promise<number> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const { data: activeProducts, error: prodErr } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('status', 'active');

  if (prodErr || !activeProducts) return 0;

  let processed = 0;

  for (const product of activeProducts) {
    const lastDate = product.last_income_date
      ? new Date(product.last_income_date).toISOString().split('T')[0]
      : null;

    if (lastDate === todayStr) continue;

    const expiryDate = product.expiry_date ? new Date(product.expiry_date) : null;
    const isExpired = expiryDate && now > expiryDate;

    if (isExpired) {
      await supabase
        .from('samsung_products')
        .update({ status: 'expired' })
        .eq('id', product.id);
      continue;
    }

    const dailyIncome = Number(product.daily_income);
    const newTotalEarned = Number(product.total_income_earned) + dailyIncome;

    await supabase
      .from('samsung_products')
      .update({
        total_income_earned: newTotalEarned,
        last_income_date: now.toISOString(),
      })
      .eq('id', product.id);

    const { data: userRow } = await supabase
      .from('samsung_users')
      .select('*')
      .eq('id', product.user_id)
      .single();

    if (userRow) {
      await supabase
        .from('samsung_users')
        .update({
          balance: Number(userRow.balance) + dailyIncome,
          total_earnings: Number(userRow.total_earnings) + dailyIncome,
          daily_earnings: Number(userRow.daily_earnings) + dailyIncome,
        })
        .eq('id', product.user_id);

      await addNotification(
        product.user_id,
        'income',
        'Daily Income Received',
        `You earned UGX ${dailyIncome.toLocaleString()} from your ${product.package_name} package.`
      );

      // Referral commissions
      const REFERRAL_RATES = [0.30, 0.02, 0.01];
      let currentUserId = userRow.referred_by;

      for (let level = 0; level < 3; level++) {
        if (!currentUserId) break;

        const { data: refUser } = await supabase
          .from('samsung_users')
          .select('*')
          .eq('id', currentUserId)
          .single();

        if (!refUser) break;

        const commission = Math.floor(dailyIncome * REFERRAL_RATES[level]);
        if (commission > 0) {
          await supabase
            .from('samsung_users')
            .update({
              balance: Number(refUser.balance) + commission,
              referral_earnings: Number(refUser.referral_earnings) + commission,
              total_earnings: Number(refUser.total_earnings) + commission,
            })
            .eq('id', currentUserId);

          await addNotification(
            currentUserId,
            'referral',
            `L${level + 1} Referral Commission`,
            `You earned UGX ${commission.toLocaleString()} referral commission from your L${level + 1} member's daily income.`
          );
        }

        currentUserId = refUser.referred_by;
      }
    }

    processed++;
  }

  return processed;
}

export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number }> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const { data: activeProducts, error: prodErr } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('status', 'active');

  if (prodErr || !activeProducts) return { processed: 0, totalPaid: 0 };

  let processed = 0;
  let totalPaid = 0;

  for (const product of activeProducts) {
    const lastDate = product.last_income_date
      ? new Date(product.last_income_date).toISOString().split('T')[0]
      : null;

    if (lastDate === todayStr) continue;

    const expiryDate = product.expiry_date ? new Date(product.expiry_date) : null;
    const isExpired = expiryDate && now > expiryDate;

    if (isExpired) {
      await supabase
        .from('samsung_products')
        .update({ status: 'expired' })
        .eq('id', product.id);
      continue;
    }

    const dailyIncome = Number(product.daily_income);
    const newTotalEarned = Number(product.total_income_earned) + dailyIncome;

    await supabase
      .from('samsung_products')
      .update({
        total_income_earned: newTotalEarned,
        last_income_date: now.toISOString(),
      })
      .eq('id', product.id);

    const { data: userRow } = await supabase
      .from('samsung_users')
      .select('*')
      .eq('id', product.user_id)
      .single();

    if (userRow) {
      await supabase
        .from('samsung_users')
        .update({
          balance: Number(userRow.balance) + dailyIncome,
          total_earnings: Number(userRow.total_earnings) + dailyIncome,
          daily_earnings: Number(userRow.daily_earnings) + dailyIncome,
        })
        .eq('id', product.user_id);

      await addNotification(
        product.user_id,
        'income',
        'Daily Income Received',
        `You earned UGX ${dailyIncome.toLocaleString()} from your ${product.package_name} package.`
      );

      const REFERRAL_RATES = [0.30, 0.02, 0.01];
      let currentUserId = userRow.referred_by;

      for (let level = 0; level < 3; level++) {
        if (!currentUserId) break;
        const { data: refUser } = await supabase
          .from('samsung_users')
          .select('*')
          .eq('id', currentUserId)
          .single();
        if (!refUser) break;

        const commission = Math.floor(dailyIncome * REFERRAL_RATES[level]);
        if (commission > 0) {
          await supabase
            .from('samsung_users')
            .update({
              balance: Number(refUser.balance) + commission,
              referral_earnings: Number(refUser.referral_earnings) + commission,
              total_earnings: Number(refUser.total_earnings) + commission,
            })
            .eq('id', currentUserId);
        }
        currentUserId = refUser.referred_by;
      }
    }

    processed++;
    totalPaid += dailyIncome;
  }

  return { processed, totalPaid };
}
