import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isMissingEnv =!supabaseUrl ||!supabaseAnonKey;

// --- OFFLINE DEMO MODE (works without OnSpace) ---
function createLocalStorageMock() {
  const getUsers = () => JSON.parse(localStorage.getItem('engle_users') || '[]');
  const saveUsers = (users: any[]) => localStorage.setItem('engle_users', JSON.stringify(users));

  return {
    from: (table: string) => {
      return {
        select: () => ({
          eq: (field: string, value: any) => ({
            single: async () => {
              const users = getUsers();
              const user = users.find((u: any) => u[field] === value);
              return { data: user || null, error: null };
            },
            maybeSingle: async () => {
              const users = getUsers();
              const user = users.find((u: any) => u[field] === value);
              return { data: user || null, error: null };
            }
          }),
          single: async () => ({ data: getUsers()[0] || null, error: null })
        }),
        insert: (data: any) => ({
          select: () => ({
            single: async () => {
              const users = getUsers();
              const newUser = Array.isArray(data)? data[0] : data;
              users.push({...newUser, id: Date.now().toString() });
              saveUsers(users);
              return { data: newUser, error: null };
            }
          }),
          then: (resolve: any) => {
            const users = getUsers();
            const newUser = Array.isArray(data)? data[0] : data;
            users.push({...newUser, id: Date.now().toString() });
            saveUsers(users);
            resolve({ data: newUser, error: null });
          }
        }),
        upsert: (data: any) => ({
          then: (resolve: any) => resolve({ data, error: null })
        })
      };
    },
    auth: {
      getSession: async () => ({ data: { session: JSON.parse(localStorage.getItem('engle_session') || 'null') } }),
      onAuthStateChange: (cb: any) => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signUp: async () => ({ data: null, error: null }),
      signIn: async () => ({ data: null, error: null }),
    }
  } as any;
}

export const supabase = isMissingEnv
 ? createLocalStorageMock()
  : createClient(supabaseUrl, supabaseAnonKey);
