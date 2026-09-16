import { supabase } from '@/lib/supabase';
import { User, Product, Recharge, Withdrawal, Wallet, Notification, RedeemCode } from '@/types';

// ─── Session Helpers ──────────────────────────────────────────────────────────

let _currentUser: User | null = null;

export function getCurrentUser(): User | null {
  return _currentUser;
}

export function setCurrentUser(user: User | null): void {
  _currentUser = user;
}

export async function refreshCurrentUser(): Promise<User | null> {
  if (!_currentUser) return null;
  const user = await getUserById(_currentUser.id);
  if (user) _currentUser = user;
  return user;
}

let _adminSession: boolean = false;

export function getAdminSession(): boolean {
  return _adminSession;
}

export function setAdminSession(value: boolean): void {
  _adminSession = value;
}

// ─── User CRUD ────────────────────────────────────────────────────────────────

function mapUserFromDb(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    password: row.password as string,
    balance: Number(row.balance ?? 0),
    totalEarnings: Number(row.total_earnings ?? 0),
    dailyEarnings: Number(row.daily_earnings ?? 0),
    referralEarnings: Number(row.referral_earnings ?? 0),
    totalWithdrawal: Number(row.total_withdrawal ?? 0),
    referralCode: row.referral_code as string,
    referredBy: (row.referred_by as string) || null,
    frozen: Boolean(row.frozen),
    claimedMissions: (row.claimed_missions as string[]) || [],
    lastCheckIn: (row.last_check_in as string) || null,
    registrationBonus: Number(row.registration_bonus ?? 7000),
    createdAt: row.created_at as string,
  };
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getUsers error:', error); return []; }
  return (data || []).map(mapUserFromDb);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('getUserById error:', error); return null; }
  return data ? mapUserFromDb(data) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) { console.error('getUserByPhone error:', error); return null; }
  return data ? mapUserFromDb(data) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('referral_code', code)
    .maybeSingle();
  if (error) { console.error('getUserByReferralCode error:', error); return null; }
  return data ? mapUserFromDb(data) : null;
}

export async function createUser(user: User): Promise<void> {
  const { error } = await supabase.from('samsung_users').insert({
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
    frozen: user.frozen,
    claimed_missions: user.claimedMissions,
    last_check_in: user.lastCheckIn,
    registration_bonus: user.registrationBonus,
    created_at: user.createdAt,
  });
  if (error) { console.error('createUser error:', error); throw error; }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.password !== undefined) dbUpdates.password = updates.password;
  if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
  if (updates.totalEarnings !== undefined) dbUpdates.total_earnings = updates.totalEarnings;
  if (updates.dailyEarnings !== undefined) dbUpdates.daily_earnings = updates.dailyEarnings;
  if (updates.referralEarnings !== undefined) dbUpdates.referral_earnings = updates.referralEarnings;
  if (updates.totalWithdrawal !== undefined) dbUpdates.total_withdrawal = updates.totalWithdrawal;
  if (updates.referralCode !== undefined) dbUpdates.referral_code = updates.referralCode;
  if (updates.referredBy !== undefined) dbUpdates.referred_by = updates.referredBy;
  if (updates.frozen !== undefined) dbUpdates.frozen = updates.frozen;
  if (updates.claimedMissions !== undefined) dbUpdates.claimed_missions = updates.claimedMissions;
  if (updates.lastCheckIn !== undefined) dbUpdates.last_check_in = updates.lastCheckIn;
  if (updates.registrationBonus !== undefined) dbUpdates.registration_bonus = updates.registrationBonus;

  const { error } = await supabase.from('samsung_users').update(dbUpdates).eq('id', id);
  if (error) { console.error('updateUser error:', error); throw error; }
}

export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_users').delete().eq('id', id);
  if (error) { console.error('deleteUserById error:', error); throw error; }
}

// ─── Product CRUD ─────────────────────────────────────────────────────────────

function mapProductFromDb(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    packageId: row.package_id as string,
    packageName: row.package_name as string,
    packagePrice: Number(row.package_price ?? 0),
    dailyIncome: Number(row.daily_income ?? 0),
    duration: Number(row.duration ?? 0),
    status: row.status as string,
    buyDate: (row.buy_date as string) || null,
    expiryDate: (row.expiry_date as string) || null,
    lastIncomeDate: (row.last_income_date as string) || null,
    totalIncomeEarned: Number(row.total_income_earned ?? 0),
    paymentProof: (row.payment_proof as string) || '',
    createdAt: row.created_at as string,
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getProducts error:', error); return []; }
  return (data || []).map(mapProductFromDb);
}

export async function getUserProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserProducts error:', error); return []; }
  return (data || []).map(mapProductFromDb);
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
    payment_proof: product.paymentProof,
    created_at: product.createdAt,
  });
  if (error) { console.error('createProduct error:', error); throw error; }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.buyDate !== undefined) dbUpdates.buy_date = updates.buyDate;
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
  if (updates.lastIncomeDate !== undefined) dbUpdates.last_income_date = updates.lastIncomeDate;
  if (updates.totalIncomeEarned !== undefined) dbUpdates.total_income_earned = updates.totalIncomeEarned;
  if (updates.paymentProof !== undefined) dbUpdates.payment_proof = updates.paymentProof;

  const { error } = await supabase.from('samsung_products').update(dbUpdates).eq('id', id);
  if (error) { console.error('updateProduct error:', error); throw error; }
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_products').delete().eq('id', id);
  if (error) { console.error('deleteProduct error:', error); throw error; }
}

// ─── Recharge CRUD ────────────────────────────────────────────────────────────

function mapRechargeFromDb(row: Record<string, unknown>): Recharge {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    amount: Number(row.amount ?? 0),
    network: row.network as string,
    senderPhone: row.sender_phone as string,
    senderName: (row.sender_name as string) || '',
    proof: row.proof as string,
    status: row.status as string,
    userName: (row.user_name as string) || '',
    userPhone: (row.user_phone as string) || '',
    createdAt: row.created_at as string,
    processedAt: (row.processed_at as string) || null,
  };
}

export async function getRecharges(): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRecharges error:', error); return []; }
  return (data || []).map(mapRechargeFromDb);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserRecharges error:', error); return []; }
  return (data || []).map(mapRechargeFromDb);
}

export async function createRecharge(recharge: Recharge): Promise<void> {
  const { error } = await supabase.from('samsung_recharges').insert({
    id: recharge.id,
    user_id: recharge.userId,
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone,
    sender_name: recharge.senderName,
    proof: recharge.proof,
    status: recharge.status,
    user_name: recharge.userName,
    user_phone: recharge.userPhone,
    created_at: recharge.createdAt,
    processed_at: recharge.processedAt,
  });
  if (error) { console.error('createRecharge error:', error); throw error; }
}

export async function updateRecharge(id: string, updates: Partial<Recharge>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.processedAt !== undefined) dbUpdates.processed_at = updates.processedAt;

  const { error } = await supabase.from('samsung_recharges').update(dbUpdates).eq('id', id);
  if (error) { console.error('updateRecharge error:', error); throw error; }
}

// ─── Withdrawal CRUD ──────────────────────────────────────────────────────────

function mapWithdrawalFromDb(row: Record<string, unknown>): Withdrawal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    amount: Number(row.amount ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    walletPhone: row.wallet_phone as string,
    walletName: row.wallet_name as string,
    walletType: row.wallet_type as string,
    status: row.status as string,
    userName: (row.user_name as string) || '',
    userPhone: (row.user_phone as string) || '',
    createdAt: row.created_at as string,
    processedAt: (row.processed_at as string) || null,
  };
}

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWithdrawals error:', error); return []; }
  return (data || []).map(mapWithdrawalFromDb);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWithdrawals error:', error); return []; }
  return (data || []).map(mapWithdrawalFromDb);
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
    user_name: withdrawal.userName,
    user_phone: withdrawal.userPhone,
    created_at: withdrawal.createdAt,
    processed_at: withdrawal.processedAt,
  });
  if (error) { console.error('createWithdrawal error:', error); throw error; }
}

export async function updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.processedAt !== undefined) dbUpdates.processed_at = updates.processedAt;

  const { error } = await supabase.from('samsung_withdrawals').update(dbUpdates).eq('id', id);
  if (error) { console.error('updateWithdrawal error:', error); throw error; }
}

// ─── Wallet CRUD ──────────────────────────────────────────────────────────────

function mapWalletFromDb(row: Record<string, unknown>): Wallet {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    phone: row.phone as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  };
}

export async function getWallets(): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWallets error:', error); return []; }
  return (data || []).map(mapWalletFromDb);
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWallets error:', error); return []; }
  return (data || []).map(mapWalletFromDb);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  const { error } = await supabase.from('samsung_wallets').upsert({
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
    created_at: wallet.createdAt,
  });
  if (error) { console.error('saveWallet error:', error); throw error; }
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  const { error } = await supabase.from('samsung_wallets').delete().eq('user_id', userId);
  if (error) { console.error('deleteWalletsByUser error:', error); throw error; }
}

// ─── Notification CRUD ────────────────────────────────────────────────────────

function mapNotificationFromDb(row: Record<string, unknown>): Notification {
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

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getNotifications error:', error); return []; }
  return (data || []).map(mapNotificationFromDb);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserNotifications error:', error); return []; }
  return (data || []).map(mapNotificationFromDb);
}

export async function addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('samsung_notifications').insert({
    id: crypto.randomUUID(),
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    is_read: notification.isRead,
    created_at: new Date().toISOString(),
  });
  if (error) { console.error('addNotification error:', error); throw error; }
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_notifications').update({ is_read: true }).eq('id', id);
  if (error) { console.error('markNotificationRead error:', error); throw error; }
}

export async function deleteNotificationsByUser(userId: string): Promise<void> {
  const { error } = await supabase.from('samsung_notifications').delete().eq('user_id', userId);
  if (error) { console.error('deleteNotificationsByUser error:', error); throw error; }
}

// ─── Redeem Code CRUD ─────────────────────────────────────────────────────────

function mapRedeemCodeFromDb(row: Record<string, unknown>): RedeemCode {
  return {
    id: row.id as string,
    code: row.code as string,
    amount: Number(row.amount ?? 0),
    usedBy: (row.used_by as string[]) || [],
    isActive: Boolean(row.is_active),
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
  };
}

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase
    .from('samsung_redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRedeemCodes error:', error); return []; }
  return (data || []).map(mapRedeemCodeFromDb);
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase.from('samsung_redeem_codes').insert({
    id: code.id,
    code: code.code,
    amount: code.amount,
    used_by: code.usedBy,
    is_active: code.isActive,
    expires_at: code.expiresAt,
    created_at: code.createdAt,
  });
  if (error) { console.error('createRedeemCode error:', error); throw error; }
}

export async function updateRedeemCode(id: string, updates: Partial<RedeemCode>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.usedBy !== undefined) dbUpdates.used_by = updates.usedBy;

  const { error } = await supabase.from('samsung_redeem_codes').update(dbUpdates).eq('id', id);
  if (error) { console.error('updateRedeemCode error:', error); throw error; }
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_redeem_codes').delete().eq('id', id);
  if (error) { console.error('deleteRedeemCodeById error:', error); throw error; }
}

// ─── Daily Income Engine ──────────────────────────────────────────────────────

export async function processDailyIncome(): Promise<void> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const products = await getProducts();
  const activeProducts = products.filter(p => p.status === 'active');

  for (const product of activeProducts) {
    if (product.lastIncomeDate === todayStr) continue;

    const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;
    if (expiryDate && now > expiryDate) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const user = await getUserById(product.userId);
    if (!user || user.frozen) continue;

    const newTotalIncome = product.totalIncomeEarned + product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: todayStr,
      totalIncomeEarned: newTotalIncome,
    });

    await updateUser(product.userId, {
      balance: user.balance + product.dailyIncome,
      totalEarnings: user.totalEarnings + product.dailyIncome,
      dailyEarnings: user.dailyEarnings + product.dailyIncome,
    });

    await addNotification({
      userId: product.userId,
      type: 'income',
      title: 'Daily Income Received',
      message: `You received UGX ${product.dailyIncome.toLocaleString()} daily income from ${product.packageName}.`,
      isRead: false,
    });

    // Handle L1/L2/L3 referral commissions
    if (user.referredBy) {
      const l1User = await getUserById(user.referredBy);
      if (l1User && !l1User.frozen) {
        const l1Commission = Math.floor(product.dailyIncome * 0.30);
        await updateUser(l1User.id, {
          balance: l1User.balance + l1Commission,
          referralEarnings: l1User.referralEarnings + l1Commission,
          totalEarnings: l1User.totalEarnings + l1Commission,
        });
        await addNotification({
          userId: l1User.id,
          type: 'referral',
          title: 'Referral Commission (L1)',
          message: `You earned UGX ${l1Commission.toLocaleString()} L1 referral commission from ${user.name}.`,
          isRead: false,
        });

        if (l1User.referredBy) {
          const l2User = await getUserById(l1User.referredBy);
          if (l2User && !l2User.frozen) {
            const l2Commission = Math.floor(product.dailyIncome * 0.02);
            await updateUser(l2User.id, {
              balance: l2User.balance + l2Commission,
              referralEarnings: l2User.referralEarnings + l2Commission,
              totalEarnings: l2User.totalEarnings + l2Commission,
            });

            if (l2User.referredBy) {
              const l3User = await getUserById(l2User.referredBy);
              if (l3User && !l3User.frozen) {
                const l3Commission = Math.floor(product.dailyIncome * 0.01);
                await updateUser(l3User.id, {
                  balance: l3User.balance + l3Commission,
                  referralEarnings: l3User.referralEarnings + l3Commission,
                  totalEarnings: l3User.totalEarnings + l3Commission,
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
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const products = await getProducts();
  const activeProducts = products.filter(p => p.status === 'active');

  let processed = 0;
  let totalPaid = 0;

  for (const product of activeProducts) {
    if (product.lastIncomeDate === todayStr) continue;

    const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;
    if (expiryDate && now > expiryDate) {
      await updateProduct(product.id, { status: 'expired' });
      continue;
    }

    const user = await getUserById(product.userId);
    if (!user || user.frozen) continue;

    const newTotalIncome = product.totalIncomeEarned + product.dailyIncome;
    await updateProduct(product.id, {
      lastIncomeDate: todayStr,
      totalIncomeEarned: newTotalIncome,
    });

    await updateUser(product.userId, {
      balance: user.balance + product.dailyIncome,
      totalEarnings: user.totalEarnings + product.dailyIncome,
      dailyEarnings: user.dailyEarnings + product.dailyIncome,
    });

    await addNotification({
      userId: product.userId,
      type: 'income',
      title: 'Daily Income Received',
      message: `You received UGX ${product.dailyIncome.toLocaleString()} daily income from ${product.packageName}.`,
      isRead: false,
    });

    processed++;
    totalPaid += product.dailyIncome;
  }

  return { processed, totalPaid };
}
