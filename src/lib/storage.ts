/**
 * storage.ts — centralized cloud data layer using Supabase
 * All tables: engle_users, engle_products, engle_notifications,
 *             engle_recharges, engle_redeem_codes, engle_wallets, engle_withdrawals
 */

import { supabase } from '@/lib/supabase';
import {
  User, UserProduct, Notification, Recharge, Wallet,
  RedeemCode, Withdrawal,
} from '@/types';

const SESSION_KEY = 'engle_current_user';
const ADMIN_SESSION_KEY = 'engle_admin_session';

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
export function getAdminSession(): boolean {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}
export function setAdminSession(value: boolean): void {
  if (value) localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  else localStorage.removeItem(ADMIN_SESSION_KEY);
}

function mapUser(row: any): User {
  return {
    id: row.id, phone: row.phone, password: row.password, name: row.name,
    referralCode: row.referral_code, referredBy: row.referred_by ?? null,
    balance: Number(row.balance ?? 0), totalEarnings: Number(row.total_earnings ?? 0),
    totalWithdrawal: Number(row.total_withdrawal ?? 0), referralEarnings: Number(row.referral_earnings ?? 0),
    dailyEarnings: Number(row.daily_earnings ?? 0), registrationBonus: Number(row.registration_bonus ?? 7000),
    lastCheckIn: row.last_check_in ?? null, createdAt: row.created_at,
    frozen: row.frozen ?? false, claimedMissions: row.claimed_missions ?? [],
  };
}
function mapProduct(row: any): UserProduct {
  return {
    id: row.id, userId: row.user_id, packageId: row.package_id, packageName: row.package_name,
    packagePrice: Number(row.package_price ?? 0), dailyIncome: Number(row.daily_income ?? 0),
    duration: Number(row.duration ?? 0), status: row.status, buyDate: row.buy_date ?? null,
    expiryDate: row.expiry_date ?? null, lastIncomeDate: row.last_income_date ?? null,
    totalIncomeEarned: Number(row.total_income_earned ?? 0), paymentProof: row.payment_proof ?? '',
  };
}
function mapNotification(row: any): Notification {
  return { id: row.id, userId: row.user_id, type: row.type, title: row.title, message: row.message, isRead: row.is_read ?? false, createdAt: row.created_at };
}
function mapRecharge(row: any): Recharge {
  return {
    id: row.id, userId: row.user_id, userName: row.user_name ?? '', userPhone: row.user_phone ?? '',
    amount: Number(row.amount ?? 0), network: row.network, senderPhone: row.sender_phone ?? '',
    senderName: row.sender_name ?? '', proof: row.proof ?? '', status: row.status,
    createdAt: row.created_at
