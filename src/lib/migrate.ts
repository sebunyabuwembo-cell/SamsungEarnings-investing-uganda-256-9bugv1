import { supabase } from '@/lib/supabase';

export interface MigrationStats {
  users: number;
  products: number;
  recharges: number;
  withdrawals: number;
  wallets: number;
  notifications: number;
  errors: string[];
}

const MIGRATION_DONE_KEY = 'samsung_migration_done';
const LS_KEYS = {
  users: 'samsung_users',
  products: 'samsung_products',
  recharges: 'samsung_recharges',
  withdrawals: 'samsung_withdrawals',
  wallets: 'samsung_wallets',
  notifications: 'samsung_notifications',
};

export function hasPendingMigration(): boolean {
  if (localStorage.getItem(MIGRATION_DONE_KEY) === 'true') return false;
  return Object.values(LS_KEYS).some((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  });
}

export function skipMigration(): void {
  localStorage.setItem(MIGRATION_DONE_KEY, 'true');
}

type ProgressCallback = (step: string, pct: number) => void;

async function upsertBatch(
  table: string,
  rows: Record<string, unknown>[],
  errors: string[]
): Promise<number> {
  if (!rows.length) return 0;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) errors.push(`${table}: ${error.message}`);
  return error ? 0 : rows.length;
}

export async function runMigration(onProgress: ProgressCallback): Promise<MigrationStats> {
  const stats: MigrationStats = {
    users: 0,
    products: 0,
    recharges: 0,
    withdrawals: 0,
    wallets: 0,
    notifications: 0,
    errors: [],
  };

  const load = <T>(key: string): T[] => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  };

  onProgress('Loading local data…', 5);
  const users = load<Record<string, unknown>>(LS_KEYS.users);
  const products = load<Record<string, unknown>>(LS_KEYS.products);
  const recharges = load<Record<string, unknown>>(LS_KEYS.recharges);
  const withdrawals = load<Record<string, unknown>>(LS_KEYS.withdrawals);
  const wallets = load<Record<string, unknown>>(LS_KEYS.wallets);
  const notifications = load<Record<string, unknown>>(LS_KEYS.notifications);

  onProgress('Migrating users…', 15);
  stats.users = await upsertBatch('samsung_users', users, stats.errors);

  onProgress('Migrating products…', 30);
  stats.products = await upsertBatch('samsung_products', products, stats.errors);

  onProgress('Migrating recharges…', 45);
  stats.recharges = await upsertBatch('samsung_recharges', recharges, stats.errors);

  onProgress('Migrating withdrawals…', 60);
  stats.withdrawals = await upsertBatch('samsung_withdrawals', withdrawals, stats.errors);

  onProgress('Migrating wallets…', 75);
  stats.wallets = await upsertBatch('samsung_wallets', wallets, stats.errors);

  onProgress('Migrating notifications…', 88);
  stats.notifications = await upsertBatch('samsung_notifications', notifications, stats.errors);

  if (stats.errors.length === 0) {
    onProgress('Cleaning up local storage…', 95);
    Object.values(LS_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(MIGRATION_DONE_KEY, 'true');
  }

  onProgress('Done', 100);
  return stats;
}
