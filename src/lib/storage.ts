const SESSION_KEY = 'engle_current_user';
const ADMIN_KEY = 'engle_admin';

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const setCurrentUser = (u: any) => {
  try {
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
};

export const getAdminSession = () => {
  try { return localStorage.getItem(ADMIN_KEY) === 'true'; } catch { return false; }
};

export const setAdminSession = (v: boolean) => {
  try {
    if (v) localStorage.setItem(ADMIN_KEY, 'true');
    else localStorage.removeItem(ADMIN_KEY);
  } catch {}
};

export const refreshCurrentUser = async () => getCurrentUser();

// All these are stubs so your pages don't crash
export const getUsers = async () => [];
export const getUserById = async () => null;
export const getUserByPhone = async () => null;
export const getUserByReferralCode = async () => null;
export const createUser = async () => {};
export const updateUser = async () => {};
export const deleteUserById = async () => {};
export const getProducts = async () => [];
export const getUserProducts = async () => [];
export const createProduct = async () => {};
export const updateProduct = async () => {};
export const deleteProduct = async () => {};
export const getWithdrawals = async () => [];
export const getUserWithdrawals = async () => [];
export const createWithdrawal = async () => {};
export const updateWithdrawal = async () => {};
export const getRecharges = async () => [];
export const getUserRecharges = async () => [];
export const createRecharge = async () => {};
export const updateRecharge = async () => {};
export const getWallets = async () => [];
export const getUserWallets = async () => [];
export const saveWallet = async () => {};
export const deleteWalletsByUser = async () => {};
export const getRedeemCodes = async () => [];
export const createRedeemCode = async () => {};
export const updateRedeemCode = async () => {};
export const deleteRedeemCodeById = async () => {};
export const getNotifications = async () => [];
export const getUserNotifications = async () => [];
export const addNotification = async () => {};
export const markNotificationRead = async () => {};
export const deleteNotificationsByUser = async () => {};
export const runDailyIncomeWithStats = async () => ({ credited: 0, total: 0 });
export const processDailyIncome = async () => {};
