// ─── Package Definition ────────────────────────────────────────────────────────

export enum PackageGroup {
  Starter = 'Starter',
  Growth = 'Growth',
  Premium = 'Premium',
}

export interface Package {
  id: string;
  name: string;
  price: number;
  dailyIncome: number;
  duration: number; // days
  group: PackageGroup | 1 | 2 | 3;
  image: string;
}

export const PACKAGES: Package[] = [
  // ── Group 1: Starter ──────────────────────────────────────────────────────
  {
    id: 'starter-1',
    name: 'Samsung A05',
    price: 15000,
    dailyIncome: 600,
    duration: 60,
    group: PackageGroup.Starter,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80&auto=format',
  },
  {
    id: 'starter-2',
    name: 'Samsung A15',
    price: 30000,
    dailyIncome: 1200,
    duration: 60,
    group: PackageGroup.Starter,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80&auto=format',
  },
  {
    id: 'starter-3',
    name: 'Samsung A25',
    price: 60000,
    dailyIncome: 2500,
    duration: 60,
    group: PackageGroup.Starter,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80&auto=format',
  },
  {
    id: 'starter-4',
    name: 'Samsung A35',
    price: 100000,
    dailyIncome: 4200,
    duration: 60,
    group: PackageGroup.Starter,
    image: 'https://images.unsplash.com/photo-1603145733146-ae562a55031e?w=600&q=80&auto=format',
  },

  // ── Group 2: Growth ───────────────────────────────────────────────────────
  {
    id: 'growth-1',
    name: 'Samsung A55',
    price: 200000,
    dailyIncome: 9000,
    duration: 90,
    group: PackageGroup.Growth,
    image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&q=80&auto=format',
  },
  {
    id: 'growth-2',
    name: 'Samsung S23',
    price: 500000,
    dailyIncome: 23000,
    duration: 90,
    group: PackageGroup.Growth,
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80&auto=format',
  },
  {
    id: 'growth-3',
    name: 'Samsung S24',
    price: 800000,
    dailyIncome: 38000,
    duration: 90,
    group: PackageGroup.Growth,
    image: 'https://images.unsplash.com/photo-1610945264803-c22b62831983?w=600&q=80&auto=format',
  },
  {
    id: 'growth-4',
    name: 'Samsung S24+',
    price: 1000000,
    dailyIncome: 50000,
    duration: 90,
    group: PackageGroup.Growth,
    image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600&q=80&auto=format',
  },

  // ── Group 3: Premium ──────────────────────────────────────────────────────
  {
    id: 'premium-1',
    name: 'Samsung S24 Ultra',
    price: 1300000,
    dailyIncome: 500000,
    duration: 30,
    group: PackageGroup.Premium,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80&auto=format',
  },
  {
    id: 'premium-2',
    name: 'Samsung Z Fold 6',
    price: 2000000,
    dailyIncome: 700000,
    duration: 30,
    group: PackageGroup.Premium,
    image: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=600&q=80&auto=format',
  },
  {
    id: 'premium-3',
    name: 'Samsung Z Fold 6 Pro',
    price: 3000000,
    dailyIncome: 1100000,
    duration: 30,
    group: PackageGroup.Premium,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80&auto=format',
  },
];

// ─── Financial Constants ───────────────────────────────────────────────────────

/** 18% withdrawal tax */
export const WITHDRAWAL_TAX = 0.18;

/** Minimum withdrawal amount in UGX */
export const MIN_WITHDRAWAL = 10000;

/** Minimum recharge/deposit amount in UGX */
export const MIN_DEPOSIT = 15000;

/** Registration bonus in UGX */
export const REGISTRATION_BONUS = 7000;

/** Daily check-in reward in UGX */
export const DAILY_CHECKIN_REWARD = 200;

// ─── Mobile Money Numbers ──────────────────────────────────────────────────────

export const MTN_NUMBER = '0756406186';
export const MTN_NAME = 'Nabakooza Milly';

export const AIRTEL_NUMBER = '0756406186';
export const AIRTEL_NAME = 'Nabakooza Milly';

// ─── Social / Links ────────────────────────────────────────────────────────────

export const TELEGRAM_OFFICIAL = 'https://t.me/engleinvestment';
