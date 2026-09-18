// FORCE OFFLINE MOCK - makes login remember accounts
function createLocalStorageMock() {
  const get = (key: string) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  };
  const save = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));
  const normalizeKey = (t: string) => (t === 'samsung_users' || t === 'engle_users'? 'engle_users' : t);

  return {
    from: (table: string) => {
      const storageKey = normalizeKey(table);
      return {
        select: () => ({
          eq: (field: string, value: any) => ({
            single: async () => {
              const items = get(storageKey);
              const found = items.find((u: any) => String(u[field]?? '').trim() === String(value).trim());
              return { data: found || null, error: null };
            },
            maybeSingle: async () => {
              const items = get(storageKey);
              const found = items.find((u: any) => String(u[field]?? '').trim() === String(value).trim());
              return { data: found || null, error: null };
            },
            then: (resolve: any) => {
              const items = get(storageKey);
              const filtered = items.filter((u: any) => String(u[field]?? '').trim() === String(value).trim());
              resolve({ data: filtered, error: null });
            }
          }),
          then: (resolve: any) => {
            const items = get(storageKey);
            resolve({ data: items, error: null });
          }
        }),
        insert: (data: any) => {
          const toSave = Array.isArray(data)? data[0] : data;
          const items = get(storageKey);
          if (storageKey === 'engle_users') {
            if (!items.find((u: any) => u.phone === toSave.phone)) {
              items.push(toSave);
              save(storageKey, items);
            }
          } else {
            items.push(toSave);
            save(storageKey, items);
          }
          return {
            select: () => ({ single: async () => ({ data: toSave, error: null }) }),
            then: (resolve: any) => resolve({ data: toSave, error: null }),
          };
        },
        update: (updates: any) => ({
          eq: (field: string, value: any) => {
            const items = get(storageKey);
            const idx = items.findIndex((u: any) => String(u[field]?? '').trim() === String(value).trim());
            if (idx >= 0) {
              items[idx] = {...items[idx],...updates };
              save(storageKey, items);
            }
            return {
              select: () => ({ single: async () => ({ data: items[idx] || null, error: null }) }),
              then: (resolve: any) => resolve({ data: null, error: null }),
            };
          }
        }),
        delete: () => ({
          eq: (field: string, value: any) => ({
            then: (resolve: any) => {
              let items = get(storageKey);
              items = items.filter((u: any) => String(u[field]?? '').trim()!== String(value).trim());
              save(storageKey, items);
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

export const supabase = createLocalStorageMock();
