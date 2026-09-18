import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getAdminSession, setAdminSession,
  getUsers, getUserById, updateUser, deleteUserById,
  getProducts, updateProduct,
  getRecharges, updateRecharge,
  getWithdrawals, updateWithdrawal,
  getNotifications, addNotification,
  getRedeemCodes, createRedeemCode, deleteRedeemCodeById,
  runDailyIncomeWithStats,
} from '@/lib/storage';
import { User, Product, Recharge, Withdrawal, Notification, RedeemCode } from '@/types';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type Tab = 'overview' | 'users' | 'products' | 'recharges' | 'withdrawals' | 'notifications' | 'redeem' | 'analytics';
const fmt = (n: number) => `UGX ${Number(n).toLocaleString()}`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'frozen' | 'active'>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [adjustModalUser, setAdjustModalUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustReason, setAdjustReason] = useState('');
  const [newRedeemCode, setNewRedeemCode] = useState('');
  const [newRedeemAmount, setNewRedeemAmount] = useState('');
  const [newRedeemExpiry, setNewRedeemExpiry] = useState('');
  const [referralTrees, setReferralTrees] = useState<Record<string, { l1: User[]; l2: User[]; l3: User[] }>>({});

  const pendingRecharges = recharges.filter(r => r.status === 'pending');

  useEffect(() => {
    if (!getAdminSession()) { navigate('/admin'); return; }
    loadAll();
  }, []);

  // FIXED loadAll - never hangs
  const loadAll = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getUsers(), getProducts(), getRecharges(),
        getWithdrawals(), getNotifications(), getRedeemCodes(),
      ]);
      setUsers(results[0].status === 'fulfilled'? (results[0].value as User[]) : []);
      setProducts(results[1].status === 'fulfilled'? (results[1].value as Product[]) : []);
      setRecharges(results[2].status === 'fulfilled'? (results[2].value as Recharge[]) : []);
      setWithdrawals(results[3].status === 'fulfilled'? (results[3].value as Withdrawal[]) : []);
      setNotifications(results[4].status === 'fulfilled'? (results[4].value as Notification[]) : []);
      setRedeemCodes(results[5].status === 'fulfilled'? (results[5].value as RedeemCode[]) : []);

      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) console.warn(`${failed} admin queries failed - check Supabase`);
    } catch (e) {
      console.error("Admin load error", e);
      toast.error("Failed to load - check internet / Supabase keys");
    } finally {
      setLoading(false); // ALWAYS stops spinner
    }
  };

  const handleLogout = () => { setAdminSession(false); navigate('/admin'); };

  const loadReferralTree = async (userId: string) => {
    if (referralTrees[userId]) return;
    const l1 = users.filter(u => u.referredBy === userId);
    const l2: User[] = [];
    const l3: User[] = [];
    for (const l1User of l1) {
      const l2Users = users.filter(u => u.referredBy === l1User.id);
      l2.push(...l2Users);
      for (const l2User of l2Users) l3.push(...users.filter(u => u.referredBy === l2User.id));
    }
    setReferralTrees(prev => ({...prev, [userId]: { l1, l2, l3 } }));
  };

  const toggleExpandUser = async (userId: string) => {
    if (expandedUser === userId) setExpandedUser(null);
    else { setExpandedUser(userId); await loadReferralTree(userId); }
  };

  const handleAdjustBalance = async () => {
    if (!adjustModalUser ||!adjustAmount) return;
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) { toast.error('Enter valid amount'); return; }
    const newBalance = Math.max(0, adjustModalUser.balance + (adjustType === 'add'? amt : -amt));
    await updateUser(adjustModalUser.id, { balance: newBalance });
    await addNotification({ userId: adjustModalUser.id, type: 'income', title: adjustType === 'add'? 'Balance Added' : 'Balance Deducted', message: `Admin ${adjustType} ${fmt(amt)} ${adjustReason}`, isRead: false } as any);
    toast.success('Balance updated'); setAdjustModalUser(null); setAdjustAmount(''); setAdjustReason(''); await loadAll();
  };

  const handleToggleFreeze = async (user: User) => { await updateUser(user.id, { frozen:!user.frozen }); toast.success(user.frozen? 'Unfrozen' : 'Frozen'); await loadAll(); };
  const handleDeleteUser = async (user: User) => { if (!confirm(`Delete ${user.name}?`)) return; await deleteUserById(user.id); toast.success('Deleted'); await loadAll(); };

  const handleRechargeApprove = async (r: Recharge) => {
    await updateRecharge(r.id, { status: 'approved', processedAt: new Date().toISOString() });
    const user = await getUserById(r.userId);
    if (user) { await updateUser(r.userId, { balance: user.balance + r.amount }); await addNotification({ userId: r.userId, type: 'income', title: 'Recharge Approved', message: `Your ${fmt(r.amount)} approved`, isRead: false } as any); }
    toast.success('Approved'); await loadAll();
  };
  const handleRechargeReject = async (r: Recharge) => { await updateRecharge(r.id, { status: 'rejected', processedAt: new Date().toISOString() }); toast.success('Rejected'); await loadAll(); };

  const handleWithdrawalApprove = async (w: Withdrawal) => { await updateWithdrawal(w.id, { status: 'approved', processedAt: new Date().toISOString() }); toast.success('Approved'); await loadAll(); };
  const handleWithdrawalReject = async (w: Withdrawal) => {
    const user = await getUserById(w.userId);
    if (user) await updateUser(w.userId, { balance: user.balance + w.amount });
    await updateWithdrawal(w.id, { status: 'rejected', processedAt: new Date().toISOString() }); toast.success('Rejected & refunded'); await loadAll();
  };

  const handleProductApprove = async (p: Product) => {
    const now = new Date(); const expiry = new Date(now); expiry.setDate(expiry.getDate() + p.duration);
    await updateProduct(p.id, { status: 'active', buyDate: now.toISOString(), expiryDate: expiry.toISOString() } as any);
    await addNotification({ userId: p.userId, type: 'income', title: 'Package Activated', message: `${p.packageName} activated`, isRead: false } as any);
    toast.success('Activated'); await loadAll();
  };
  const handleProductReject = async (p: Product) => {
    const user = await getUserById(p.userId);
    if (user) await updateUser(p.userId, { balance: user.balance + p.packagePrice });
    await updateProduct(p.id, { status: 'expired' } as any); toast.success('Rejected & refunded'); await loadAll();
  };

  const handleCreateRedeemCode = async () => {
    if (!newRedeemCode.trim() ||!newRedeemAmount ||!newRedeemExpiry) { toast.error('Fill all'); return; }
    const code: RedeemCode = { id: crypto.randomUUID(), code: newRedeemCode.trim().toUpperCase(), amount: parseFloat(newRedeemAmount), expiresAt: new Date(newRedeemExpiry).toISOString(), usedBy: [], isActive: true, createdAt: new Date().toISOString() } as any;
    await createRedeemCode(code); toast.success('Created'); setNewRedeemCode(''); setNewRedeemAmount(''); setNewRedeemExpiry(''); await loadAll();
  };
  const handleDeleteRedeemCode = async (id: string) => { await deleteRedeemCodeById(id); toast.success('Deleted'); await loadAll(); };
  const handleExportCSV = () => {
    const headers = ['Name','Phone','Balance','Earnings','Frozen','Joined'];
    const rows = users.map(u => [u.name,u.phone,u.balance,u.totalEarnings,u.frozen?'Yes':'No',new Date(u.createdAt).toLocaleDateString()]);
    const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='users.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const handleRunDailyIncome = async () => { toast.info('Running...'); const {processed,totalPaid}=await runDailyIncomeWithStats(); toast.success(`${processed} processed, ${fmt(totalPaid)} paid`); await loadAll(); };

  const revenueData = (()=>{const m:Record<string,number>={}; recharges.filter(r=>r.status==='approved').forEach(r=>{const d=new Date(r.createdAt).toLocaleDateString(); m[d]=(m[d]||0)+r.amount;}); return Object.entries(m).slice(-7).map(([date,amount])=>({date,amount}));})();
  const userGrowthData = (()=>{const m:Record<string,number>={}; users.forEach(u=>{const d=new Date(u.createdAt).toLocaleDateString(); m[d]=(m[d]||0)+1;}); return Object.entries(m).slice(-7).map(([date,count])=>({date,count}));})();
  const packageDistData = (()=>{const m:Record<string,number>={}; products.forEach(p=>{m[p.packageName]=(m[p.packageName]||0)+1;}); return Object.entries(m).map(([name,value])=>({name,value}));})();
  const PIE_COLORS=['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  const filteredUsers = users.filter(u=>{const s=u.name.toLowerCase().includes(userSearch.toLowerCase())||u.phone.includes(userSearch); const f=userFilter==='all'?true:userFilter==='frozen'?u.frozen:!u.frozen; return s&&f;});
  const TABS: {key: any; label: string}[] = [{key:'overview',label:'Overview'},{key:'users',label:'Users'},{key:'products',label:'Packages'},{key:'recharges',label:'Recharges'},{key:'withdrawals',label:'Withdrawals'},{key:'notifications',label:'Notifications'},{key:'redeem',label:'Redeem Codes'},{key:'analytics',label:'Analytics'}];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
          <button onClick={()=>setLoading(false)} className="mt-4 text-xs bg-white px-4 py-2 rounded-full shadow text-blue-600">Stuck? Click to open dashboard</button>
          <button onClick={()=>{localStorage.clear(); window.location.href='/admin';}} className="mt-2 block mx-auto text-xs text-gray-400">Clear cache & re-login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-9 h-9 bg-blue-400 rounded-full flex items-center justify-center">🌸</div><div><h1 className="font-bold">Admin Panel</h1><p className="text-blue-200 text-xs">Engle Investment Uganda</p></div></div>
        <button onClick={handleLogout} className="bg-blue-700 px-4 py-1.5 rounded-lg text-sm">Logout</button>
      </div>
      {pendingRecharges.length>0 && <div onClick={()=>setTab('recharges')} className="bg-yellow-400 text-yellow-900 px-4 py-2 text-sm font-semibold text-center cursor-pointer">⚠️ {pendingRecharges.length} pending recharge — Click to review</div>}
      <div className="bg-white border-b overflow-x-auto flex">{TABS.map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${tab===t.key?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`}>{t.label}{t.key==='recharges'&&pendingRecharges.length>0&&<span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{pendingRecharges.length}</span>}</button>))}</div>
      <div className="p-4 max-w-7xl mx-auto">
        {tab==='overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{label:'Total Users',value:users.length,color:'bg-blue-500'},{label:'Active Packages',value:products.filter(p=>p.status==='active').length,color:'bg-green-500'},{label:'Pending Recharges',value:pendingRecharges.length,color:'bg-yellow-500'},{label:'Pending Withdrawals',value:withdrawals.filter(w=>w.status==='pending').length,color:'bg-red-500'}].map(c=>(<div key={c.label} className={`${c.color} text-white rounded-xl p-4`}><div className="text-2xl font-bold">{c.value}</div><div className="text-sm">{c.label}</div></div>))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-sm">Total Revenue</div><div className="text-xl font-bold text-green-600">{fmt(recharges.filter(r=>r.status==='approved').reduce((s,r)=>s+r.amount,0))}</div></div>
              <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-sm">Total Withdrawals</div><div className="text-xl font-bold text-red-500">{fmt(withdrawals.filter(w=>w.status==='approved').reduce((s,w)=>s+w.netAmount,0))}</div></div>
              <div className="bg-white rounded-xl p-4 shadow"><div className="text-gray-500 text-sm">Daily Income Paid</div><div className="text-xl font-bold text-blue-600">{fmt(products.reduce((s,p)=>s+p.totalIncomeEarned,0))}</div></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow"><h3 className="font-semibold mb-3">Manual Daily Income</h3><button onClick={handleRunDailyIncome} className="bg-blue-600 text-white px-6 py-2 rounded-lg">▶ Run Daily Income Now</button></div>
          </div>
        )}
        {tab==='users' && (
          <div className="space-y-4">
            <div className="flex gap-2"><input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search..." className="flex-1 border rounded-lg px-3 py-2 text-sm"/><select value={userFilter} onChange={e=>setUserFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm"><option value="all">All</option><option value="active">Active</option><option value="frozen">Frozen</option></select><button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">CSV</button></div>
            {filteredUsers.map(user=>(
              <div key={user.id} className={`bg-white rounded-xl shadow p-4 ${user.frozen?'border-l-4 border-red-400':''}`}>
                <div className="flex justify-between"><div><div className="font-semibold">{user.name} {user.frozen&&<span className="bg-red-100 text-red-600 text-xs px-2 rounded-full">Frozen</span>}</div><div className="text-sm text-gray-500">{user.phone}</div><div className="text-sm">Bal: <span className="font-semibold text-blue-600">{fmt(user.balance)}</span> · Earn: <span className="font-semibold text-green-600">{fmt(user.totalEarnings)}</span></div></div><div className="flex flex-col gap-1"><button onClick={()=>setAdjustModalUser(user)} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Adjust</button><button onClick={()=>handleToggleFreeze(user)} className="text-xs bg-yellow-50 px-2 py-1 rounded">{user.frozen?'Unfreeze':'Freeze'}</button><button onClick={()=>handleDeleteUser(user)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">Delete</button><button onClick={()=>toggleExpandUser(user.id)} className="text-xs bg-gray-50 px-2 py-1 rounded">{expandedUser===user.id?'Hide':'Tree'}</button></div></div>
              </div>
            ))}
          </div>
        )}
        {tab==='products' && <div className="space-y-3">{products.map(p=>{const o=users.find(u=>u.id===p.userId); return <div key={p.id} className="bg-white rounded-xl p-4 shadow flex justify-between"><div><div className="font-semibold">{p.packageName}</div><div className="text-sm text-gray-500">{o?.name} {o?.phone}</div><div className="text-sm">{fmt(p.packagePrice)} · {fmt(p.dailyIncome)}</div><span className={`text-xs px-2 rounded-full ${p.status==='active'?'bg-green-100 text-green-700':p.status==='pending'?'bg-yellow-100':'bg-gray-100'}`}>{p.status}</span></div>{p.status==='pending'&&<div className="flex flex-col gap-1"><button onClick={()=>handleProductApprove(p)} className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded">Approve</button><button onClick={()=>handleProductReject(p)} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded">Reject</button></div>}</div>})}</div>}
        {tab==='recharges' && <div className="space-y-3">{recharges.map(r=><div key={r.id} className={`bg-white rounded-xl p-4 shadow ${r.status==='pending'?'border-l-4 border-yellow-400':''}`}><div className="flex justify-between"><div><div className="font-semibold">{fmt(r.amount)}</div><div className="text-sm">{r.userName} {r.userPhone} · {r.network}</div><span className="text-xs px-2 rounded-full bg-yellow-100">{r.status}</span></div>{r.status==='pending'&&<div className="flex flex-col gap-1"><button onClick={()=>handleRechargeApprove(r)} className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded">Approve</button><button onClick={()=>handleRechargeReject(r)} className="text-xs bg-red-50 px-3 py-1 rounded">Reject</button></div>}</div></div>)}</div>}
        {tab==='withdrawals' && <div className="space-y-3">{withdrawals.map(w=><div key={w.id} className="bg-white rounded-xl p-4 shadow"><div className="flex justify-between"><div><div className="font-semibold">{fmt(w.amount)} (net {fmt(w.netAmount)})</div><div className="text-sm">{w.walletType} {w.walletPhone}</div><span className="text-xs px-2 rounded-full bg-yellow-100">{w.status}</span></div>{w.status==='pending'&&<div className="flex flex-col gap-1"><button onClick={()=>handleWithdrawalApprove(w)} className="text-xs bg-green-50 px-3 py-1 rounded">Approve</button><button onClick={()=>handleWithdrawalReject(w)} className="text-xs bg-red-50 px-3 py-1 rounded">Reject</button></div>}</div></div>)}</div>}
        {tab==='redeem' && <div className="space-y-4"><div className="bg-white rounded-xl p-4 shadow"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><input value={newRedeemCode} onChange={e=>setNewRedeemCode(e.target.value)} placeholder="CODE" className="border rounded-lg px-3 py-2"/><input type="number" value={newRedeemAmount} onChange={e=>setNewRedeemAmount(e.target.value)} placeholder="Amount" className="border rounded-lg px-3 py-2"/><input type="datetime-local" value={newRedeemExpiry} onChange={e=>setNewRedeemExpiry(e.target.value)} className="border rounded-lg px-3 py-2"/></div><button onClick={handleCreateRedeemCode} className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg">Create</button></div>{redeemCodes.map(c=><div key={c.id} className="bg-white rounded-xl p-4 shadow flex justify-between"><div><div className="font-mono font-bold">{c.code}</div><div className="text-sm">{fmt(c.amount)} Used {c.usedBy.length}</div></div><button onClick={()=>handleDeleteRedeemCode(c.id)} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded">Delete</button></div>)}</div>}
      </div>
      {adjustModalUser && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl p-6 w-full max-w-sm"><h3 className="font-bold">Adjust {adjustModalUser.name}</h3><div className="flex gap-2 my-3"><button onClick={()=>setAdjustType('add')} className={`flex-1 py-2 rounded-lg ${adjustType==='add'?'bg-green-600 text-white':'bg-gray-100'}`}>Add</button><button onClick={()=>setAdjustType('deduct')} className={`flex-1 py-2 rounded-lg ${adjustType==='deduct'?'bg-red-600 text-white':'bg-gray-100'}`}>Deduct</button></div><input type="number" value={adjustAmount} onChange={e=>setAdjustAmount(e.target.value)} placeholder="Amount" className="w-full border rounded-lg px-3 py-2 mb-2"/><input value={adjustReason} onChange={e=>setAdjustReason(e.target.value)} placeholder="Reason" className="w-full border rounded-lg px-3 py-2 mb-4"/><div className="flex gap-2"><button onClick={()=>setAdjustModalUser(null)} className="flex-1 border rounded-lg py-2">Cancel</button><button onClick={handleAdjustBalance} className="flex-1 bg-blue-600 text-white rounded-lg py-2">Confirm</button></div></div></div>}
    </div>
  );
};

export default AdminDashboard;
