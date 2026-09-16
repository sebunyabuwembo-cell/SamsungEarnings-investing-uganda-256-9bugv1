import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isMissingEnv = !supabaseUrl || !supabaseAnonKey;

if (isMissingEnv) {
  console.warn("⚠️ VITE_SUPABASE_URL or ANON_KEY missing - check GitHub Secrets!");
}

function createDummyQuery() {
  const chain: any = {
    select: () => chain,
    insert: () => chain,
    upsert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    order: () => chain,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };
  return chain;
}

export const supabase = isMissingEnv
  ? ({
      from: () => createDummyQuery(),
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as any)
  : createClient(supabaseUrl, supabaseAnonKey);
