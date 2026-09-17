import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getAdminSession, setAdminSession,
  getUsers, getUserById, updateUser, deleteUserById,
  getProducts, getUserProducts, updateProduct, deleteProduct,
  getRecharges, updateRecharge, createRecharge,
  getWithdrawals, updateWithdrawal,
  getNotifications, addNotification,
  getRedeemCodes, createRedeemCode, updateRedeemCode, deleteRedeemCodeById,
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

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);

  // User management
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'frozen' | 'active'>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [adjustModalUser, setAdjustModalUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustReason, setAdjustReason] = useState('');

  // Product management
  const [newRedeemCode, setNewRedeemCode] = useState('');
  const [newRedeemAmount, setNewRedeemAmount] = useState('');
  const [newRedeemExpiry, setNewRedeemExpiry] = useState('');

  // Referral tree state
  const [referralTrees, setReferralTrees] = useState<Record<string, { l1: User[]; l2: User[]; l3: User[] }>>({});

  const pendingRecharges = recharges.filter(r => r.status === 'pending');

  useEffect(() => {
    if (!getAdminSession()) {
      navigate('/admin');
      return;
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [u, p, r, w, n, rc] = await Promise.all([
      getUsers(), getProducts(), getRecharges(),
      getWithdrawals(), getNotifications(), getRedeemCodes(),
    ]);
    setUsers(u);
    setProducts(p);
    setRecharges(r);
    setWithdrawals(w);
    setNotifications(n);
    setRedeemCodes(rc);
    setLoading(false);
  };

  const handleLogout = () => {
    setAdminSession(false);
    navigate('/admin');
  };

  // ─── REFERRAL TREE ───────────────────────────────────────────────────────────
  const loadReferralTree = async (userId: string) => {
    if (referralTrees[userId]) return;
    const l1 = users.filter(u => u.referredBy === userId);
    const l2: User[] = [];
    const l3: User[] = [];
    for (const l1User of l1) {
      const l2Users = users.filter(u => u.referredBy === l1User.id);
      l2.push(...l2Users);
      for (const l2User of l2Users) {
        const l3Users = users.filter(u => u.referredBy === l2User.id);
        l3.push(...l3Users);
      }
    }
    setReferralTrees(prev => ({ ...prev, [userId]: { l1, l2, l3 } }));
  };

  const toggleExpandUser = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      await loadReferralTree(userId);
    }
  };

  // ─── BALANCE ADJUST ──────────────────────────────────────────────────────────
  const handleAdjustBalance = async () => {
    if (!adjustModalUser || !adjustAmount) return;
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }
    const delta = adjustType === 'add' ? amt : -amt;
    const newBalance = Math.max(0, adjustModalUser.balance + delta);
    await updateUser(adjustModalUser.id, { balance: newBalance });
    await addNotification({
      userId: adjustModalUser.id,
      type: 'income',
      title: adjustType === 'add' ? 'Balance Added' : 'Balance Deducted',
      message: `Admin ${adjustType === 'add' ? 'added' : 'deducted'} ${fmt(amt)} ${adjustReason ? `— ${adjustReason}` : ''}.`,
      isRead: false,
    });
    toast.success(`Balance ${adjustType === 'add' ? 'added' : 'deducted'} successfully`);
    setAdjustModalUser(null);
    setAdjustAmount('');
    setAdjustReason('');
    await loadAll();
  };

  // ─── FREEZE ──────────────────────────────────────────────────────────────────
  const handleToggleFreeze = async (user: User) => {
    await updateUser(user.id, { frozen: !user.frozen });
    toast.success(`User ${user.frozen ? 'unfrozen' : 'frozen'}`);
    await loadAll();
  };

  // ─── DELETE USER ─────────────────────────────────────────────────────────────
  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Delete user ${user.name}? This cannot be undone.`)) return;
    await deleteUserById(user.id);
    toast.success('User deleted');
    await loadAll();
  };

  // ─── RECHARGE APPROVE/REJECT ─────────────────────────────────────────────────
  const handleRechargeApprove = async (r: Recharge) => {
    await updateRecharge(r.id, { status: 'approved', processedAt: new Date().toISOString() });
    const user = await getUserById(r.userId);
    if (user) {
      await updateUser(r.userId, { balance: user.balance + r.amount });
      await addNotification({
        userId: r.userId,
        type: 'income',
        title: 'Recharge Approved',
        message: `Your recharge of ${fmt(r.amount)} has been approved.`,
        isRead: false,
      });
    }
    toast.success('Recharge approved');
    await loadAll();
  };

  const handleRechargeReject = async (r: Recharge) => {
    await updateRecharge(r.id, { status: 'rejected', processedAt: new Date().toISOString() });
    await addNotification({
      userId: r.userId,
      type: 'income',
      title: 'Recharge Rejected',
      message: `Your recharge of ${fmt(r.amount)} was rejected. Contact support.`,
      isRead: false,
    });
    toast.success('Recharge rejected');
    await loadAll();
  };

  // ─── WITHDRAWAL APPROVE/REJECT ───────────────────────────────────────────────
  const handleWithdrawalApprove = async (w: Withdrawal) => {
    await updateWithdrawal(w.id, { status: 'approved', processedAt: new Date().toISOString() });
    await addNotification({
      userId: w.userId,
      type: 'income',
      title: 'Withdrawal Approved',
      message: `Your withdrawal of ${fmt(w.netAmount)} has been sent to ${w.walletPhone}.`,
      isRead: false,
    });
    toast.success('Withdrawal approved');
    await loadAll();
  };

  const handleWithdrawalReject = async (w: Withdrawal) => {
    const user = await getUserById(w.userId);
    if (user) {
      await updateUser(w.userId, { balance: user.balance + w.amount });
    }
    await updateWithdrawal(w.id, { status: 'rejected', processedAt: new Date().toISOString() });
    await addNotification({
      userId: w.userId,
      type: 'income',
      title: 'Withdrawal Rejected',
      message: `Your withdrawal of ${fmt(w.amount)} was rejected. Balance has been refunded.`,
      isRead: false,
    });
    toast.success('Withdrawal rejected & balance refunded');
    await loadAll();
  };

  // ─── PRODUCT APPROVE/REJECT ──────────────────────────────────────────────────
  const handleProductApprove = async (p: Product) => {
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + p.duration);
    await updateProduct(p.id, {
      status: 'active',
      buyDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
    });
    await addNotification({
      userId: p.userId,
      type: 'income',
      title: 'Package Activated',
      message: `Your ${p.packageName} package has been activated. Daily income starts now.`,
      isRead: false,
    });
    toast.success('Package approved & activated');
    await loadAll();
  };

  const handleProductReject = async (p: Product) => {
    const user = await getUserById(p.userId);
    if (user) {
      await updateUser(p.userId, { balance: user.balance + p.packagePrice });
    }
    await updateProduct(p.id, { status: 'expired' });
    await addNotification({
      userId: p.userId,
      type: 'income',
      title: 'Package Rejected',
      message: `Your ${p.packageName} package was rejected. ${fmt(p.packagePrice)} has been refunded.`,
      isRead: false,
    });
    toast.success('Package rejected & refunded');
    await loadAll();
  };

  // ─── REDEEM CODE ─────────────────────────────────────────────────────────────
  const handleCreateRedeemCode = async () => {
    if (!newRedeemCode.trim() || !newRedeemAmount || !newRedeemExpiry) {
      toast.error('Fill all fields');
      return;
    }
    const code: RedeemCode = {
      id: crypto.randomUUID(),
      code: newRedeemCode.trim().toUpperCase(),
      amount: parseFloat(newRedeemAmount),
      expiresAt: new Date(newRedeemExpiry).toISOString(),
      usedBy: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await createRedeemCode(code);
    toast.success('Redeem code created');
    setNewRedeemCode(''); setNewRedeemAmount(''); setNewRedeemExpiry('');
    await loadAll();
  };

  const handleDeleteRedeemCode = async (id: string) => {
    await deleteRedeemCodeById(id);
    toast.success('Code deleted');
    await loadAll();
  };

  // ─── CSV EXPORT ──────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Balance', 'Total Earnings', 'Referral Earnings', 'Withdrawals', 'Frozen', 'Joined'];
    const rows = users.map(u => [
      u.name, u.phone, u.balance, u.totalEarnings, u.referralEarnings, u.totalWithdrawal,
      u.frozen ? 'Yes' : 'No', new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'users.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  // ─── RUN DAILY INCOME ────────────────────────────────────────────────────────
  const handleRunDailyIncome = async () => {
    toast.info('Running daily income...');
    const { processed, totalPaid } = await runDailyIncomeWithStats();
    toast.success(`Daily income complete: ${processed} packages processed, ${fmt(totalPaid)} paid out`);
    await loadAll();
  };

  // ─── ANALYTICS DATA ──────────────────────────────────────────────────────────
  const revenueData = (() => {
    const map: Record<string, number> = {};
    recharges.filter(r => r.status === 'approved').forEach(r => {
      const d = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map[d] = (map[d] || 0) + r.amount;
    });
    return Object.entries(map).slice(-7).map(([date, amount]) => ({ date, amount }));
  })();

  const userGrowthData = (() => {
    const map: Record<string, number> = {};
    users.forEach(u => {
      const d = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).slice(-7).map(([date, count]) => ({ date, count }));
  })();

  const packageDistData = (() => {
    const map: Record<string, number> = {};
    products.forEach(p => { map[p.packageName] = (map[p.packageName] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);
    const matchFilter = userFilter === 'all' ? true : userFilter === 'frozen' ? u.frozen : !u.frozen;
    return matchSearch && matchFilter;
  });

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'products', label: 'Packages' },
    { key: 'recharges', label: 'Recharges' },
    { key: 'withdrawals', label: 'Withdrawals' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'redeem', label: 'Redeem Codes' },
    { key: 'analytics', label: 'Analytics' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-400 rounded-full flex items-center justify-center text-lg">🌸</div>
          <div>
            <h1 className="font-bold text-lg leading-none">Admin Panel</h1>
            <p className="text-blue-200 text-xs">Samsung Earnings Uganda</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-blue-700 hover:bg-blue-600 px-4 py-1.5 rounded-lg text-sm font-medium transition">
          Logout
        </button>
      </div>

      {/* Pending recharge alert */}
      {pendingRecharges.length > 0 && (
        <div
          onClick={() => setTab('recharges')}
          className="bg-yellow-400 text-yellow-900 px-4 py-2 text-sm font-semibold text-center cursor-pointer hover:bg-yellow-300 transition"
        >
          ⚠️ {pendingRecharges.length} pending recharge{pendingRecharges.length > 1 ? 's' : ''} awaiting approval — Click to review
        </div>
      )}

      {/* Nav Tabs */}
      <div className="bg-white border-b overflow-x-auto flex">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.key === 'recharges' && pendingRecharges.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingRecharges.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-7xl mx-auto">

        {/* ─── OVERVIEW ─────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: users.length, color: 'bg-blue-500' },
                { label: 'Active Packages', value: products.filter(p => p.status === 'active').length, color: 'bg-green-500' },
                { label: 'Pending Recharges', value: pendingRecharges.length, color: 'bg-yellow-500' },
                { label: 'Pending Withdrawals', value: withdrawals.filter(w => w.status === 'pending').length, color: 'bg-red-500' },
              ].map(c => (
                <div key={c.label} className={`${c.color} text-white rounded-xl p-4 shadow`}>
                  <div className="text-2xl font-bold">{c.value}</div>
                  <div className="text-sm opacity-90">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="text-gray-500 text-sm">Total Recharge Revenue</div>
                <div className="text-xl font-bold text-green-600">{fmt(recharges.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0))}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="text-gray-500 text-sm">Total Withdrawals Paid</div>
                <div className="text-xl font-bold text-red-500">{fmt(withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + w.netAmount, 0))}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="text-gray-500 text-sm">Total Daily Income Paid</div>
                <div className="text-xl font-bold text-blue-600">{fmt(products.reduce((s, p) => s + p.totalIncomeEarned, 0))}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <h3 className="font-semibold text-gray-700 mb-3">Manual Daily Income</h3>
              <p className="text-sm text-gray-500 mb-3">Run the daily income engine manually for all active packages.</p>
              <button onClick={handleRunDailyIncome} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
                ▶ Run Daily Income Now
              </button>
            </div>
          </div>
        )}

        {/* ─── USERS ────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-1">
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={userFilter}
                  onChange={e => setUserFilter(e.target.value as 'all' | 'frozen' | 'active')}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="frozen">Frozen</option>
                </select>
              </div>
              <button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap">
                Export CSV
              </button>
            </div>

            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className={`bg-white rounded-xl shadow overflow-hidden ${user.frozen ? 'border-l-4 border-red-400' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{user.name}</span>
                          {user.frozen && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Frozen</span>}
                        </div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Balance: <span className="font-semibold text-blue-600">{fmt(user.balance)}</span>
                          {' · '}Earnings: <span className="font-semibold text-green-600">{fmt(user.totalEarnings)}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Ref: {user.referralCode} · Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <button onClick={() => setAdjustModalUser(user)} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition">Adjust Balance</button>
                        <button onClick={() => handleToggleFreeze(user)} className={`text-xs px-2 py-1 rounded transition ${user.frozen ? 'bg-green-50 hover:bg-green-100 text-green-700' : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'}`}>
                          {user.frozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                        <button onClick={() => handleDeleteUser(user)} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded transition">Delete</button>
                        <button onClick={() => toggleExpandUser(user.id)} className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-2 py-1 rounded transition">
                          {expandedUser === user.id ? 'Hide Tree ▲' : 'View Tree ▼'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Referral Tree */}
                  {expandedUser === user.id && referralTrees[user.id] && (
                    <div className="border-t bg-gray-50 p-4 space-y-3">
                      {(['l1', 'l2', 'l3'] as const).map((level, idx) => {
                        const members = referralTrees[user.id][level];
                        const label = `L${idx + 1} (${['30%', '2%', '1%'][idx]})`;
                        return (
                          <div key={level}>
                            <div className="text-xs font-semibold text-gray-500 mb-1">{label} — {members.length} member{members.length !== 1 ? 's' : ''}</div>
                            {members.length === 0 ? (
                              <div className="text-xs text-gray-400 italic">No members</div>
                            ) : (
                              <div className="space-y-1">
                                {members.map(m => {
                                  const invested = products.filter(p => p.userId === m.id && p.status !== 'expired').reduce((s, p) => s + p.packagePrice, 0);
                                  return (
                                    <div key={m.id} className="text-xs bg-white rounded-lg px-3 py-2 flex justify-between items-center shadow-sm">
                                      <span className="font-medium">{m.name}</span>
                                      <span className="text-gray-500">{m.phone}</span>
                                      <span className="text-green-600 font-medium">{fmt(invested)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="text-xs text-gray-500 pt-1 border-t">
                        Total team: {referralTrees[user.id].l1.length + referralTrees[user.id].l2.length + referralTrees[user.id].l3.length} members
                        {' '}(L1: {referralTrees[user.id].l1.length}, L2: {referralTrees[user.id].l2.length}, L3: {referralTrees[user.id].l3.length})
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center text-gray-400 py-8">No users found</div>
              )}
            </div>
          </div>
        )}

        {/* ─── PRODUCTS ─────────────────────────────────────────────── */}
        {tab === 'products' && (
          <div className="space-y-3">
            {products.map(p => {
              const owner = users.find(u => u.id === p.userId);
              return (
                <div key={p.id} className="bg-white rounded-xl shadow p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-800">{p.packageName}</div>
                      <div className="text-sm text-gray-500">{owner?.name || 'Unknown'} · {owner?.phone || ''}</div>
                      <div className="text-sm mt-1">
                        Price: <span className="font-medium text-blue-600">{fmt(p.packagePrice)}</span>
                        {' · '}Daily: <span className="font-medium text-green-600">{fmt(p.dailyIncome)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'active' ? 'bg-green-100 text-green-700'
                          : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-500'
                        }`}>{p.status}</span>
                        {p.status === 'active' && p.expiryDate && (
                          <span className="text-xs text-gray-400">Expires: {new Date(p.expiryDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      {p.paymentProof && (
                        <div className="text-xs text-blue-500 mt-1">Proof: {p.paymentProof}</div>
                      )}
                    </div>
                    {p.status === 'pending' && (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => handleProductApprove(p)} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded transition font-medium">Approve</button>
                        <button onClick={() => handleProductReject(p)} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded transition font-medium">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {products.length === 0 && <div className="text-center text-gray-400 py-8">No packages found</div>}
          </div>
        )}

        {/* ─── RECHARGES ────────────────────────────────────────────── */}
        {tab === 'recharges' && (
          <div className="space-y-3">
            {recharges.map(r => (
              <div key={r.id} className={`bg-white rounded-xl shadow p-4 ${r.status === 'pending' ? 'border-l-4 border-yellow-400' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-800">{fmt(r.amount)}</div>
                    <div className="text-sm text-gray-600">
                      User: <span className="font-medium">{r.userName || 'Unknown'}</span> · {r.userPhone}
                    </div>
                    <div className="text-sm text-gray-500">
                      Network: <span className="uppercase font-medium">{r.network}</span>
                      {' · '}Sender: {r.senderPhone} ({r.senderName})
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'approved' ? 'bg-green-100 text-green-700'
                        : r.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>{r.status}</span>
                      <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleRechargeApprove(r)} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded transition font-medium">Approve</button>
                      <button onClick={() => handleRechargeReject(r)} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded transition font-medium">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {recharges.length === 0 && <div className="text-center text-gray-400 py-8">No recharges found</div>}
          </div>
        )}

        {/* ─── WITHDRAWALS ──────────────────────────────────────────── */}
        {tab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.map(w => (
              <div key={w.id} className={`bg-white rounded-xl shadow p-4 ${w.status === 'pending' ? 'border-l-4 border-orange-400' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-800">{fmt(w.amount)} <span className="text-sm text-gray-400">(net: {fmt(w.netAmount)})</span></div>
                    <div className="text-sm text-gray-600">
                      User: <span className="font-medium">{w.userName || 'Unknown'}</span> · {w.userPhone}
                    </div>
                    <div className="text-sm mt-1 font-medium">
                      <span className={`uppercase ${w.walletType === 'mtn' ? 'text-yellow-600' : 'text-red-500'}`}>{w.walletType}</span>
                      {' — '}{w.walletPhone} · {w.walletName}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        w.status === 'approved' ? 'bg-green-100 text-green-700'
                        : w.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>{w.status}</span>
                      <span className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {w.status === 'pending' && (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleWithdrawalApprove(w)} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded transition font-medium">Approve</button>
                      <button onClick={() => handleWithdrawalReject(w)} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded transition font-medium">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {withdrawals.length === 0 && <div className="text-center text-gray-400 py-8">No withdrawals found</div>}
          </div>
        )}

        {/* ─── NOTIFICATIONS ────────────────────────────────────────── */}
        {tab === 'notifications' && (
          <div className="space-y-3">
            {notifications.map(n => {
              const owner = users.find(u => u.id === n.userId);
              return (
                <div key={n.id} className={`bg-white rounded-xl shadow p-4 ${!n.isRead ? 'border-l-4 border-blue-400' : ''}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{n.title}</div>
                      <div className="text-xs text-gray-500 mb-1">{owner?.name || 'Unknown'} · {owner?.phone || n.userId}</div>
                      <div className="text-sm text-gray-600">{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    {!n.isRead && <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">Unread</span>}
                  </div>
                </div>
              );
            })}
            {notifications.length === 0 && <div className="text-center text-gray-400 py-8">No notifications</div>}
          </div>
        )}

        {/* ─── REDEEM CODES ─────────────────────────────────────────── */}
        {tab === 'redeem' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Create New Redeem Code</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={newRedeemCode} onChange={e => setNewRedeemCode(e.target.value)} placeholder="Code (e.g. BONUS2024)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" value={newRedeemAmount} onChange={e => setNewRedeemAmount(e.target.value)} placeholder="Amount (UGX)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="datetime-local" value={newRedeemExpiry} onChange={e => setNewRedeemExpiry(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={handleCreateRedeemCode} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">Create Code</button>
            </div>

            <div className="space-y-3">
              {redeemCodes.map(c => (
                <div key={c.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-blue-700">{c.code}</div>
                    <div className="text-sm text-gray-600">{fmt(c.amount)} · Used {c.usedBy.length} time{c.usedBy.length !== 1 ? 's' : ''}</div>
                    <div className="text-xs text-gray-400">Expires: {new Date(c.expiresAt).toLocaleString()}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <button onClick={() => handleDeleteRedeemCode(c.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded transition">Delete</button>
                </div>
              ))}
              {redeemCodes.length === 0 && <div className="text-center text-gray-400 py-8">No redeem codes</div>}
            </div>
          </div>
        )}

        {/* ─── ANALYTICS ────────────────────────────────────────────── */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-4">Revenue (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-4">User Growth (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-4">Package Distribution</h3>
              {packageDistData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={packageDistData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {packageDistData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-8">No package data</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── ADJUST BALANCE MODAL ─────────────────────────────────── */}
      {adjustModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-1">Adjust Balance</h3>
            <p className="text-sm text-gray-500 mb-4">{adjustModalUser.name} · Current: {fmt(adjustModalUser.balance)}</p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setAdjustType('add')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${adjustType === 'add' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>+ Add</button>
                <button onClick={() => setAdjustType('deduct')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${adjustType === 'deduct' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>− Deduct</button>
              </div>
              <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="Amount (UGX)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Reason (optional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setAdjustModalUser(null)} className="flex-1 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleAdjustBalance} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
