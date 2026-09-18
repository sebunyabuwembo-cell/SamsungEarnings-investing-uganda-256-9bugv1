import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isMissingEnv =!supabaseUrl ||!supabaseAnonKey;

// --- FIXED OFFLINE DEMO MODE (GitHub Pages) ---
function createLocalStorageMock() {
  const get = (key: string) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  };
  const save = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

  return {
    from: (table: string) => {
      const storageKey = table === 'samsung_users'? 'engle_users' : table;

      return {
        select: (_cols?: string) => {
          return {
            eq: (field: string, value: any) => {
              return {
                single: async () => {
                  const items = get(storageKey);
                  const found = items.find((u: any) => String(u[field]).trim() === String(value).trim());
                  return { data: found || null, error: null };
                },
                maybeSingle: async () => {
                  const items = get(storageKey);
                  const found = items.find((u: any) => String(u[field]).trim() === String(value).trim());
                  return { data: found || null, error: null };
                },
                // for.select('*').eq().limit() etc
                then: (resolve: any) => {
                  const items = get(storageKey);
                  resolve({ data: items, error: null });
                }
              };
            },
            // for get all
            then: (resolve: any) => {
              const items = get(storageKey);
              resolve({ data: items, error: null });
            }
          };
        },
        insert: (data: any) => {
          return {
            select: () => ({
              single: async () => {
                const items = get(storageKey);
                const newUser = Array.isArray(data)? data[0] : data;
                // Keep the ID you created, don't overwrite!
                if (!items.find((u: any) => u.phone === newUser.phone)) {
                  items.push(newUser);
                  save(storageKey, items);
                }
                return { data: newUser, error: null };
              }
            })
          };
        },
        update: (updates: any) => ({
          eq: (field: string, value: any) => ({
            select: () => ({
              single: async () => {
                const items = get(storageKey);
                const idx = items.findIndex((u: any) => String(u[field]) === String(value));
                if (idx >= 0) {
                  items[idx] = {...items[idx],...updates };
                  save(storageKey, items);
                  return { data: items[idx], error: null };
                }
                return { data: null, error: null };
              }
            }),
            then: (resolve: any) => {
              const items = get(storageKey);
              const idx = items.findIndex((u: any) => String(u[field]) === String(value));
              if (idx >= 0) {
                items[idx] = {...items[idx],...updates };
                save(storageKey, items);
              }
              resolve({ data: null, error: null });
            }
          })
        }),
        upsert: (data: any) => ({
          then: (resolve: any) => {
            const items = get(storageKey);
            items.push(data);
            save(storageKey, items);
            resolve({ data, error: null });
          }
        })
      };
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  } as any;
}

export const supabase = isMissingEnv
 ? createLocalStorageMock()
  : createClient(supabaseUrl, supabaseAnonKey);
