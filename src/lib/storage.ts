// GITHUB ONLY - NO SUPABASE
const USERS_KEY='app_users';
const CUR_KEYS=['samsung_current_user','current_user','currentUser'];

const getUsers=():any[]=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||'[]')}catch{return[]}};
const saveUsers=(u:any[])=>localStorage.setItem(USERS_KEY,JSON.stringify(u));

export function getCurrentUser(){
 for(const k of CUR_KEYS){
  try{ const v=localStorage.getItem(k); if(v){ const u=JSON.parse(v); if(u?.id) return u; } }catch{}
 }
 return null;
}
export function setCurrentUser(u:any){
 if(!u){ CUR_KEYS.forEach(k=>localStorage.removeItem(k)); return; }
 CUR_KEYS.forEach(k=>localStorage.setItem(k, JSON.stringify(u)));
}
export async function refreshCurrentUser(){ return getCurrentUser(); }
export function getAdminSession(){ return localStorage.getItem('adminSession')==='true'; }
export function setAdminSession(v:boolean){ v?localStorage.setItem('adminSession','true'):localStorage.removeItem('adminSession'); }

export async function getUsers(){ return getUsers(); }
export async function getUserById(id:string){ return getUsers().find(x=>x.id===id)||null; }
export async function getUserByPhone(phone:string){ return getUsers().find(x=>x.phone===phone)||null; }
export async function getUserByReferralCode(code:string){ return getUsers().find(x=>x.referralCode===code.toUpperCase())||null; }
export async function createUser(user:any){ const a=getUsers(); a.push(user); saveUsers(a); }
export async function updateUser(id:string,up:any){ const a=getUsers(); const i=a.findIndex(x=>x.id===id); if(i>=0){ a[i]={...a[i],...up}; saveUsers(a); if(getCurrentUser()?.id===id) setCurrentUser(a[i]); } }
export async function deleteUserById(id:string){ saveUsers(getUsers().filter(x=>x.id!==id)); }
export async function getProducts(){ return []; }
export async function getUserProducts(){ return []; }
export async function createProduct(){}
export async function updateProduct(){}
export async function deleteProduct(){}
export async function getRecharges(){ return []; }
export async function getUserRecharges(){ return []; }
export async function createRecharge(){}
export async function updateRecharge(){}
export async function getWithdrawals(){ return []; }
export async function getUserWithdrawals(){ return []; }
export async function createWithdrawal(){}
export async function updateWithdrawal(){}
export async function getWallets(){ return []; }
export async function getUserWallets(){ return []; }
export async function saveWallet(){}
export async function deleteWalletsByUser(){}
export async function getNotifications(){ return []; }
export async function getUserNotifications(){ return []; }
export async function addNotification(n:any){ return; }
export async function markNotificationRead(){}
export async function deleteNotificationsByUser(){}
export async function getRedeemCodes(){ return []; }
export async function createRedeemCode(){}
export async function updateRedeemCode(){}
export async function deleteRedeemCodeById(){}
export async function processDailyIncome(){ return {processed:0,totalPaid:0,expired:0}; }
export async function runDailyIncomeWithStats(){ return {processed:0,totalPaid:0,expired:0}; }
