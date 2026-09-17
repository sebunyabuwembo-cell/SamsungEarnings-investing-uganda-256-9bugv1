import { InvestmentPackage } from '@/types';

// ─── CONTACT / CHANNEL ───────────────────────────────────────────────────────
export const TELEGRAM_OFFICIAL = 'https://t.me/samsungearningsuganda';

// ─── RECHARGE NUMBERS ────────────────────────────────────────────────────────
export const MTN_NUMBER = '0756406186';
export const MTN_NAME = 'Nabakooza Milly';
export const AIRTEL_NUMBER = '0756406186';
export const AIRTEL_NAME = 'Nabakooza Milly';

// ─── FINANCIAL CONSTANTS ─────────────────────────────────────────────────────
export const MIN_DEPOSIT = 5000;
export const MIN_WITHDRAWAL = 10000;
export const WITHDRAWAL_TAX = 0.18; // 18%
export const DAILY_CHECKIN_REWARD = 200;
export const REGISTRATION_BONUS = 7000;

// ─── REFERRAL COMMISSIONS ────────────────────────────────────────────────────
export const REFERRAL_L1 = 0.30; // 30%
export const REFERRAL_L2 = 0.02; // 2%
export const REFERRAL_L3 = 0.01; // 1%

// ─── INVESTMENT PACKAGES ─────────────────────────────────────────────────────
export const PACKAGES: InvestmentPackage[] = [
  // ── Starter Packages (Group 1) ──────────────────────────────────────────
  {
    id: 'pkg-s1',
    name: 'Samsung A05',
    group: 1,
    price: 15000,
    dailyIncome: 600,
    duration: 60,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
  },
  {
    id: 'pkg-s2',
    name: 'Samsung A15',
    group: 1,
    price: 30000,
    dailyIncome: 1200,
    duration: 60,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80',
  },
  {
    id: 'pkg-s3',
    name: 'Samsung A25',
    group: 1,
    price: 50000,
    dailyIncome: 2000,
    duration: 60,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&q=80',
  },
  {
    id: 'pkg-s4',
    name: 'Samsung A35',
    group: 1,
    price: 100000,
    dailyIncome: 4000,
    duration: 60,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80',
  },

  // ── Growth Packages (Group 2) ────────────────────────────────────────────
  {
    id: 'pkg-g1',
    name: 'Samsung A55',
    group: 2,
    price: 200000,
    dailyIncome: 9000,
    duration: 90,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&q=80',
  },
  {
    id: 'pkg-g2',
    name: 'Samsung S23',
    group: 2,
    price: 500000,
    dailyIncome: 22000,
    duration: 90,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80',
  },
  {
    id: 'pkg-g3',
    name: 'Samsung S24',
    group: 2,
    price: 700000,
    dailyIncome: 32000,
    duration: 90,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400&q=80',
  },

  // ── Premium Packages (Group 3) ───────────────────────────────────────────
  {
    id: 'pkg-p1',
    name: 'Samsung S24 Ultra',
    group: 3,
    price: 1000000,
    dailyIncome: 50000,
    duration: 120,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80',
  },
  {
    id: 'pkg-p2',
    name: 'Samsung Z Fold 5',
    group: 3,
    price: 1300000,
    dailyIncome: 500000,
    duration: 60,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1672213452-cd0e8c674be3?w=400&q=80',
  },
  {
    id: 'pkg-p3',
    name: 'Samsung Z Fold 6',
    group: 3,
    price: 2000000,
    dailyIncome: 700000,
    duration: 60,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',
  },
  {
    id: 'pkg-p4',
    name: 'Samsung Galaxy AI',
    group: 3,
    price: 5000000,
    dailyIncome: 250000,
    duration: 210,
    phone: MTN_NUMBER,
    image: 'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=400&q=80',
  },
];
