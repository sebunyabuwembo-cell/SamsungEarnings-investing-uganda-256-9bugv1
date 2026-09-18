import { supabase } from '@/lib/supabase';
import { User, UserProduct, Notification, Recharge, Wallet, Withdrawal, RedeemCode } from '@/types';
import { REGISTRATION_BONUS } from '@/constants/packages';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const REFERRAL_RATES = { l1: 0.30, l2: 0.02, l3: 0.01 };

// ─── SESSION (in-memory / sessionStorage) ────────────────────────────────────

let _currentUser: User | null = null;
const USER_KEY = 'eagle_current_user';
const ADMIN_KEY = 'eagle_admin_session';

export function getCurrentUser(): User | null {
  if (_currentUser) return _currentUser;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (raw) { _currentUser = JSON.parse(raw); return _currentUser; }
  } catch {}
  return null;
}

export function setCurrentUser(user: User | null): void {
  _currentUser = user;
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(USER_KEY);
}

export async function refreshCurrentUser(): Promise<User | null> {
  const cached = getCurrentUser();
  if (!cached) return null;
  const fresh = await getUserById(cached.id);
  if (fresh) { setCurrentUser(fresh); return fresh; }
  return cached;
}

export function getAdminSession(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function setAdminSession(val: boolean): void {
  if (val) sessionStorage.setItem(ADMIN_KEY, 'true');
  else sessionStorage.removeItem(ADMIN_KEY);
}

// ─── MAPPERS ──────────────────────────────────────────────────────────────────

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
    registrationBonus: Number(row.registration_bonus ?? REGISTRATION_BONUS),
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
    packagePrice: Number(row.package_price),
    dailyIncome: Number(row.daily_income),
    duration: Number(row.duration),
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
    amount: Number(row.amount),
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
    amount: Number(row.amount),
    netAmount: Number(row.net_amount),
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
    amount: Number(row.amount),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    usedBy: row.used_by ?? [],
    isActive: row.is_active ?? true,
  };
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from('samsung_users').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('id', id).single();
  return data ? mapUser(data) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('phone', phone).single();
  return data ? mapUser(data) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data } = await supabase.from('samsung_users').select('*').eq('referral_code', code).single();
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
    registration_bonus: user.registrationBonus,
    last_check_in: user.lastCheckIn ?? null,
    frozen: user.frozen ?? false,
    claimed_missions: user.claimedMissions ?? [],
  });
}

export async function updateUser(userOrId: User | string, partial?: Partial<User>): Promise<void> {
  let id: string;
  let updates: Partial<User>;

  if (typeof userOrId === 'string') {
    id = userOrId;
    updates = partial ?? {};
  } else {
    id = userOrId.id;
    updates = userOrId;
  }

  const dbUpdate: any = {};
  if (updates.phone !== undefined) dbUpdate.phone = updates.phone;
  if (updates.password !== undefined) dbUpdate.password = updates.password;
  if (updates.name !== undefined) dbUpdate.name = updates.name;
  if (updates.referralCode !== undefined) dbUpdate.referral_code = updates.referralCode;
  if (updates.referredBy !== undefined) dbUpdate.referred_by = updates.referredBy;
  if (updates.balance !== undefined) dbUpdate.balance = updates.balance;
  if (updates.totalEarnings !== undefined) dbUpdate.total_earnings = updates.totalEarnings;
  if (updates.totalWithdrawal !== undefined) dbUpdate.total_withdrawal = updates.totalWithdrawal;
  if (updates.referralEarnings !== undefined) dbUpdate.referral_earnings = updates.referralEarnings;
  if (updates.dailyEarnings !== undefined) dbUpdate.daily_earnings = updates.dailyEarnings;
  if (updates.registrationBonus !== undefined) dbUpdate.registration_bonus = updates.registrationBonus;
  if (updates.lastCheckIn !== undefined) dbUpdate.last_check_in = updates.lastCheckIn;
  if (updates.frozen !== undefined) dbUpdate.frozen = updates.frozen;
  if (updates.claimedMissions !== undefined) dbUpdate.claimed_missions = updates.claimedMissions;

  await supabase.from('samsung_users').update(dbUpdate).eq('id', id);

  // Keep session in sync
  const cached = getCurrentUser();
  if (cached && cached.id === id) {
    setCurrentUser({ ...cached, ...updates });
  }
}

export async function deleteUserById(id: string): Promise<void> {
  await supabase.from('samsung_users').delete().eq('id', id);
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

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
    total_income_earned: product.totalIncomeEarned,
    payment_proof: product.paymentProof ?? '',
  });
}

export async function updateProduct(id: string, partial: Partial<UserProduct>): Promise<void> {
  const dbUpdate: any = {};
  if (partial.status !== undefined) dbUpdate.status = partial.status;
  if (partial.buyDate !== undefined) dbUpdate.buy_date = partial.buyDate;
  if (partial.expiryDate !== undefined) dbUpdate.expiry_date = partial.expiryDate;
  if (partial.lastIncomeDate !== undefined) dbUpdate.last_income_date = partial.lastIncomeDate;
  if (partial.totalIncomeEarned !== undefined) dbUpdate.total_income_earned = partial.totalIncomeEarned;
  if (partial.paymentProof !== undefined) dbUpdate.payment_proof = partial.paymentProof;
  await supabase.from('samsung_products').update(dbUpdate).eq('id', id);
}

export async function deleteProduct(id: string): Promise<void> {
  await supabase.from('samsung_products').delete().eq('id', id);
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

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

// ─── RECHARGES ────────────────────────────────────────────────────────────────

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
    user_name: recharge.userName,
    user_phone: recharge.userPhone,
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone,
    sender_name: recharge.senderName,
    proof: recharge.proof,
    status: recharge.status,
    processed_at: recharge.processedAt ?? null,
  });
}

export async function updateRecharge(id: string, partial: Partial<Recharge>): Promise<void> {
  const dbUpdate: any = {};
  if (partial.status !== undefined) dbUpdate.status = partial.status;
  if (partial.processedAt !== undefined) dbUpdate.processed_at = partial.processedAt;
  await supabase.from('samsung_recharges').update(dbUpdate).eq('id', id);
}

// ─── WALLETS ──────────────────────────────────────────────────────────────────

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data } = await supabase.from('samsung_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapWallet);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  await supabase.from('samsung_wallets').upsert({
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

// ─── WITHDRAWALS ──────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapWithdrawal);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data } = await supabase.from('samsung_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(mapWithdrawal);
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  await supabase.from('samsung_withdrawals').insert({
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
    processed_at: withdrawal.processedAt ?? null,
  });
}

export async function updateWithdrawal(id: string, partial: Partial<Withdrawal>): Promise<void> {
  const dbUpdate: any = {};
  if (partial.status !== undefined) dbUpdate.status = partial.status;
  if (partial.processedAt !== undefined) dbUpdate.processed_at = partial.processedAt;
  await supabase.from('samsung_withdrawals').update(dbUpdate).eq('id', id);
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
    used_by: code.usedBy,
    is_active: code.isActive,
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

// ─── DAILY INCOME ─────────────────────────────────────────────────────────────

export async function processDailyIncome(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { data: activeProducts } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('status', 'active');

  if (!activeProducts || activeProducts.length === 0) return;

  for (const row of activeProducts) {
    const product = mapProduct(row);

    // Skip if already processed today
    if (product.lastIncomeDate && product.lastIncomeDate.startsWith(today)) continue;

    // Check expiry
    if (product.expiryDate && new Date(product.expiryDate) < new Date()) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    // Credit daily income to user
    const user = await getUserById(product.userId);
    if (!user) continue;

    const newBalance = user.balance + product.dailyIncome;
    const newTotalEarnings = user.totalEarnings + product.dailyIncome;
    const newDailyEarnings = user.dailyEarnings + product.dailyIncome;

    await updateUser(user.id, {
      balance: newBalance,
      totalEarnings: newTotalEarnings,
      dailyEarnings: newDailyEarnings,
    });

    // Update product record
    const newTotalIncomeEarned = product.totalIncomeEarned + product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: new Date().toISOString(),
      totalIncomeEarned: newTotalIncomeEarned,
    });

    // Send notification
    await addNotification({
      userId: user.id,
      type: 'income',
      title: 'Daily Income Credited',
      message: `UGX ${product.dailyIncome.toLocaleString()} has been credited from your ${product.packageName} package.`,
      isRead: false,
    });

    // Pay referral commissions
    if (user.referredBy) {
      const l1User = await getUserById(user.referredBy);
      if (l1User) {
        const l1Commission = Math.floor(product.dailyIncome * REFERRAL_RATES.l1);
        await updateUser(l1User.id, {
          balance: l1User.balance + l1Commission,
          totalEarnings: l1User.totalEarnings + l1Commission,
          referralEarnings: l1User.referralEarnings + l1Commission,
        });
        await addNotification({
          userId: l1User.id,
          type: 'referral',
          title: 'Referral Commission (L1)',
          message: `You earned UGX ${l1Commission.toLocaleString()} from ${user.name}'s daily income (30%).`,
          isRead: false,
        });

        if (l1User.referredBy) {
          const l2User = await getUserById(l1User.referredBy);
          if (l2User) {
            const l2Commission = Math.floor(product.dailyIncome * REFERRAL_RATES.l2);
            await updateUser(l2User.id, {
              balance: l2User.balance + l2Commission,
              totalEarnings: l2User.totalEarnings + l2Commission,
              referralEarnings: l2User.referralEarnings + l2Commission,
            });

            if (l2User.referredBy) {
              const l3User = await getUserById(l2User.referredBy);
              if (l3User) {
                const l3Commission = Math.floor(product.dailyIncome * REFERRAL_RATES.l3);
                await updateUser(l3User.id, {
                  balance: l3User.balance + l3Commission,
                  totalEarnings: l3User.totalEarnings + l3Commission,
                  referralEarnings: l3User.referralEarnings + l3Commission,
                });
              }
            }
          }
        }
      }
    }
  }
}

export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number }> {
  const today = new Date().toISOString().split('T')[0];
  const { data: activeProducts } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('status', 'active');

  if (!activeProducts || activeProducts.length === 0) return { processed: 0, totalPaid: 0 };

  let processed = 0;
  let totalPaid = 0;

  for (const row of activeProducts) {
    const product = mapProduct(row);
    if (product.lastIncomeDate && product.lastIncomeDate.startsWith(today)) continue;

    if (product.expiryDate && new Date(product.expiryDate) < new Date()) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const user = await getUserById(product.userId);
    if (!user) continue;

    await updateUser(user.id, {
      balance: user.balance + product.dailyIncome,
      totalEarnings: user.totalEarnings + product.dailyIncome,
      dailyEarnings: user.dailyEarnings + product.dailyIncome,
    });

    await updateProduct(product.id, {
      lastIncomeDate: new Date().toISOString(),
      totalIncomeEarned: product.totalIncomeEarned + product.dailyIncome,
    });

    await addNotification({
      userId: user.id,
      type: 'income',
      title: 'Daily Income Credited',
      message: `UGX ${product.dailyIncome.toLocaleString()} has been credited from your ${product.packageName} package.`,
      isRead: false,
    });

    processed++;
    totalPaid += product.dailyIncome;

    // Referral commissions
    if (user.referredBy) {
      const l1User = await getUserById(user.referredBy);
      if (l1User) {
        const l1Commission = Math.floor(product.dailyIncome * REFERRAL_RATES.l1);
        await updateUser(l1User.id, {
          balance: l1User.balance + l1Commission,
          totalEarnings: l1User.totalEarnings + l1Commission,
          referralEarnings: l1User.referralEarnings + l1Commission,
        });
        if (l1User.referredBy) {
          const l2User = await getUserById(l1User.referredBy);
          if (l2User) {
            const l2Commission = Math.floor(product.dailyIncome * REFERRAL_RATES.l2);
            await updateUser(l2User.id, {
              balance: l2User.balance + l2Commission,
              totalEarnings: l2User.totalEarnings + l2Commission,
              referralEarnings: l2User.referralEarnings + l2Commission,
            });
            if (l2User.referredBy) {
              const l3User = await getUserById(l2User.referredBy);
              if (l3User) {
                const l3Commission = Math.floor(product.dailyIncome * REFERRAL_RATES.l3);
                await updateUser(l3User.id, {
                  balance: l3User.balance + l3Commission,
                  totalEarnings: l3User.totalEarnings + l3Commission,
                  referralEarnings: l3User.referralEarnings + l3Commission,
                });
              }
            }
          }
        }
      }
    }
  }

  return { processed, totalPaid };
}
