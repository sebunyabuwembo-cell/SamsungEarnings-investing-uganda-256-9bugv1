const SESSION_KEY = 'engle_current_user';
const ADMIN_KEY = 'engle_admin';
const USERS_KEY = 'engle_users_db';

export const getCurrentUser = () => {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw? JSON.parse(raw) : null; } catch { return null; }
};
export const setCurrentUser = (u: any) => {
  try { if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u)); else localStorage.removeItem(SESSION_KEY); } catch {}
};
export const getAdminSession = () => { try { return localStorage.getItem(ADMIN_KEY) === 'true'; } catch { return false; } };
export const setAdminSession = (v: boolean) => { try { if (v) localStorage.setItem(ADMIN_KEY, 'true'); else localStorage.removeItem(ADMIN_KEY); } catch {} };
export const refreshCurrentUser = async () => getCurrentUser();

function loadUsers(): any[] {
  try { const raw = localStorage.getItem(USERS_KEY); return raw? JSON.parse(raw) : []; } catch { return []; }
}
function saveUsers(users: any[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
}

export const getUsers = async () => loadUsers();
export const getUserById = async (id: string) => loadUsers().find(u => u.id === id) || null;
export const getUserByPhone = async (phone: string) => loadUsers().find(u => u.phone === phone) || null;
export const getUserByReferralCode = async (code: string) => loadUsers().find(u => u.referralCode?.toLowerCase() === code.trim().toLowerCase()) || null;
export const createUser = async (user: any) => { const users = loadUsers(); users.push(user); saveUsers(users); };
export const updateUser = async (user: any) => {
  const users = loadUsers(); const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user; saveUsers(users);
  const cur = getCurrentUser(); if (cur?.id === user.id) setCurrentUser(user);
};
export const deleteUserById = async (id: string) => { saveUsers(loadUsers().filter(u => u.id!== id)); };

const load = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
const save = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const getProducts = async () => load('engle_products');
export const getUserProducts = async (uid: string) => load('engle_products').filter((p:any) => p.userId === uid);
export const createProduct = async (p: any) => { const arr = load('engle_products'); arr.push(p); save('engle_products', arr); };
export const updateProduct = async (p: any) => { let arr = load('engle_products'); arr = arr.map((x:any) => x.id === p.id? p : x); save('engle_products', arr); };
export const deleteProduct = async (id: string) => { save('engle_products', load('engle_products').filter((x:any) => x.id!== id)); };

export const getWithdrawals = async () => load('engle_withdrawals');
export const getUserWithdrawals = async (uid: string) => load('engle_withdrawals').filter((x:any) => x.userId === uid);
export const createWithdrawal = async (w: any) => { const arr = load('engle_withdrawals'); arr.push(w); save('engle_withdrawals', arr); };
export const updateWithdrawal = async (w: any) => { let arr = load('engle_withdrawals'); arr = arr.map((x:any) => x.id === w.id? w : x); save('engle_withdrawals', arr); };

export const getRecharges = async () => load('engle_recharges');
export const getUserRecharges = async (uid: string) => load('engle_recharges').filter((x:any) => x.userId === uid);
export const createRecharge = async (r: any) => { const arr = load('engle_recharges'); arr.push(r); save('engle_recharges', arr); };
export const updateRecharge = async (r: any) => { let arr = load('engle_recharges'); arr = arr.map((x:any) => x.id === r.id? r : x); save('engle_recharges', arr); };

export const getWallets = async () => load('engle_wallets');
export const getUserWallets = async (uid: string) => load('engle_wallets').filter((x:any) => x.userId === uid);
export const saveWallet = async (w: any) => { let arr = load('engle_wallets'); const i = arr.findIndex((x:any) => x.id === w.id); if(i>=0) arr[i]=w; else arr.push(w); save('engle_wallets', arr); };
export const deleteWalletsByUser = async (uid: string) => { save('engle_wallets', load('engle_wallets').filter((x:any) => x.userId!== uid)); };

export const getRedeemCodes = async () => load('engle_redeem');
export const createRedeemCode = async (c: any) => { const arr = load('engle_redeem'); arr.push(c); save('engle_redeem', arr); };
export const updateRedeemCode = async (c: any) => { let arr = load('engle_redeem'); arr = arr.map((x:any) => x.id === c.id? c : x); save('engle_redeem', arr); };
export const deleteRedeemCodeById = async (id: string) => { save('engle_redeem', load('engle_redeem').filter((x:any) => x.id!== id)); };

export const getNotifications = async () => load('engle_notifs');
export const getUserNotifications = async (uid: string) => load('engle_notifs').filter((x:any) => x.userId === uid);
export const addNotification = async (n: any) => { const arr = load('engle_notifs'); arr.push({...n, id: Date.now().toString(), createdAt: new Date().toISOString()}); save('engle_notifs', arr); };
export const markNotificationRead = async (id: string) => { let arr = load('engle_notifs'); arr = arr.map((x:any) => x.id === id? {...x, isRead: true} : x); save('engle_notifs', arr); };
export const deleteNotificationsByUser = async (uid: string) => { save('engle_notifs', load('engle_notifs').filter((x:any) => x.userId!== uid)); };

export const runDailyIncomeWithStats = async () => ({ credited: 0, total: 0 });
export const processDailyIncome = async () => {};
