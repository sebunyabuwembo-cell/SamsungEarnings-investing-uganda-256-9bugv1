import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getUsers,
  getProducts,
  getRecharges,
  getWithdrawals,
  getNotifications,
  getRedeemCodes,
  updateUser,
  updateRecharge,
  updateWithdrawal,
  deleteUserById,
  createRedeemCode,
  updateRedeemCode,
  deleteRedeemCodeById,
  addNotification,
  getAdminSession,
  setAdminSession,
  runDailyIncomeWithStats,
  getUserProducts,
} from '@/lib/storage';
import type { User, UserProduct, Recharge, Withdrawal, RedeemCode, Notification } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'users' | 'packages' | 'recharges' | 'withdrawals' | 'analytics' | 'redeems'>('overview');

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Users tab state
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'frozen' | 'active'>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [adjustModal, setAdjustModal] = useState<{ user: User } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [referralTreeData, setReferralTreeData] = useState<Record<string, { l1: User[]; l2: Record<string, User[]>; l3: Record<string, User[]> }>>({});

  // Redeems tab state
  const [newCode, setNewCode] = useState('');
  const [newCodeAmount, setNewCodeAmount] = useState('');
  const [newCodeExpiry, setNewCodeExpiry] = useState('');

  // Daily income state
  const [runningIncome, setRunningIncome] = useState(false);

  // Pending recharge count for badge
  const pendingRechargeCount = recharges.filter(r => r.status === 'pending').length;
  const pendingWithdrawalCount = withdrawals.filter(w => w.status === 'pending').length;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, p, r, w, n, rc] = await Promise.all([
        getUsers(), getProducts(), getRecharges(), getWithdrawals(), getNotifications(), getRedeemCodes(),
      ]);
      setUsers(u);
      setProducts(p);
      setRecharges(r);
      setWithdrawals(w);
      setNotifications(n);
      setRedeemCodes(rc);
    } catch (err) {
      console.error('Load error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAdminSession()) { navigate('/admin'); return; }
    loadAll();
  }, [navigate, loadAll]);

  // ── Referral tree loader ──────────────────────────────────────────────────

  const loadReferralTree = async (userId: string) => {
    if (referralTreeData[userId]) return;
    const l1 = users.filter(u => u.referredBy === userId);
    const l2Map: Record<string, User[]> = {};
    const l3Map: Record<string, User[]> = {};
    for (const l1u of l1) {
      const l2 = users.filter(u => u.referredBy === l1u.id);
      l2Map[l1u.id] = l2;
      for (const l2u of l2) {
        l3Map[l2u.id] = users.filter(u => u.referredBy === l2u.id);
      }
    }
    setReferralTreeData(prev => ({ ...prev, [userId]: { l1, l2: l2Map, l3: l3Map } }));
  };

  // ── Daily Income ──────────────────────────────────────────────────────────

  const handleRunDailyIncome = async () => {
    setRunningIncome(true);
    try {
      const { processed, totalPaid } = await runDailyIncomeWithStats();
      toast.success(`Daily income processed: ${processed} packages, UGX ${totalPaid.toLocaleString()} paid`);
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error('Failed to run daily income');
    } finally {
      setRunningIncome(false);
    }
  };

  // ── Users ─────────────────────────────────────────────────────────────────

  const filteredUsers = users.filter(u => {
    const matchSearch = !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);
    const matchFilter = userFilter === 'all' ||
      (userFilter === 'frozen' && u.frozen) ||
      (userFilter === 'active' && !u.frozen);
    return matchSearch && matchFilter;
  });

  const handleFreezeToggle = async (user: User) => {
    await updateUser(user.id, { frozen: !user.frozen });
    toast.success(`Account ${user.frozen ? 'unfrozen' : 'frozen'}`);
    await addNotification({
      userId: user.id,
      type: 'system',
      title: user.frozen ? 'Account Unfrozen' : 'Account Frozen',
      message: user.frozen
        ? 'Your account has been unfrozen. You can now make purchases and withdrawals.'
        : 'Your account has been frozen. Contact support for assistance.',
      isRead: false,
    });
    loadAll();
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Delete user ${user.name} (${user.phone})? This cannot be undone.`)) return;
    await deleteUserById(user.id);
    toast.success('User deleted');
    loadAll();
  };

  const handleAdjustBalance = async () => {
    if (!adjustModal) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    const user = adjustModal.user;
    const newBalance = adjustType === 'add'
      ? user.balance + amount
      : Math.max(0, user.balance - amount);
    await updateUser(user.id, { balance: newBalance });
    await addNotification({
      userId: user.id,
      type: 'system',
      title: adjustType === 'add' ? 'Balance Added' : 'Balance Deducted',
      message: `Admin ${adjustType === 'add' ? 'added' : 'deducted'} UGX ${amount.toLocaleString()} ${adjustType === 'add' ? 'to' : 'from'} your balance. Note: ${adjustNote || 'N/A'}`,
      isRead: false,
    });
    toast.success(`Balance ${adjustType === 'add' ? 'added' : 'deducted'}: UGX ${amount.toLocaleString()}`);
    setAdjustModal(null);
    setAdjustAmount('');
    setAdjustNote('');
    loadAll();
  };

  const exportCSV = () => {
    const header = ['Name', 'Phone', 'Balance', 'Total Earnings', 'Referral Earnings', 'Total Withdrawals', 'Referral Code', 'Frozen', 'Joined'];
    const rows = users.map(u => [
      u.name, u.phone, u.balance, u.totalEarnings, u.referralEarnings,
      u.totalWithdrawal, u.referralCode, u.frozen ? 'Yes' : 'No',
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // ── Recharges ─────────────────────────────────────────────────────────────

  const handleApproveRecharge = async (r: Recharge) => {
    const user = users.find(u => u.id === r.userId);
    if (!user) { toast.error('User not found'); return; }
    await updateRecharge(r.id, { status: 'approved', processedAt: new Date().toISOString() });
    await updateUser(user.id, { balance: user.balance + r.amount });
    await addNotification({
      userId: user.id,
      type: 'recharge',
      title: 'Recharge Approved',
      message: `Your recharge of UGX ${r.amount.toLocaleString()} has been approved and added to your balance.`,
      isRead: false,
    });
    toast.success(`Recharge approved: UGX ${r.amount.toLocaleString()}`);
    loadAll();
  };

  const handleRejectRecharge = async (r: Recharge) => {
    await updateRecharge(r.id, { status: 'rejected', processedAt: new Date().toISOString() });
    await addNotification({
      userId: r.userId,
      type: 'recharge',
      title: 'Recharge Rejected',
      message: `Your recharge of UGX ${r.amount.toLocaleString()} has been rejected. Contact support for assistance.`,
      isRead: false,
    });
    toast.success('Recharge rejected');
    loadAll();
  };

  // ── Withdrawals ───────────────────────────────────────────────────────────

  const handleApproveWithdrawal = async (w: Withdrawal) => {
    await updateWithdrawal(w.id, { status: 'approved', processedAt: new Date().toISOString() });
    await addNotification({
      userId: w.userId,
      type: 'withdrawal',
      title: 'Withdrawal Approved',
      message: `Your withdrawal of UGX ${w.netAmount.toLocaleString()} has been approved and sent to ${w.walletType.toUpperCase()} ${w.walletPhone}.`,
      isRead: false,
    });
    toast.success('Withdrawal approved');
    loadAll();
  };

  const handleRejectWithdrawal = async (w: Withdrawal) => {
    const user = users.find(u => u.id === w.userId);
    if (user) {
      await updateUser(user.id, {
        balance: user.balance + w.amount,
        totalWithdrawal: Math.max(0, user.totalWithdrawal - w.amount),
      });
    }
    await updateWithdrawal(w.id, { status: 'rejected', processedAt: new Date().toISOString() });
    await addNotification({
      userId: w.userId,
      type: 'withdrawal',
      title: 'Withdrawal Rejected',
      message: `Your withdrawal request of UGX ${w.amount.toLocaleString()} has been rejected. The amount has been refunded to your balance.`,
      isRead: false,
    });
    toast.success('Withdrawal rejected — balance refunded');
    loadAll();
  };

  // ── Redeem Codes ──────────────────────────────────────────────────────────

  const handleCreateRedeemCode = async () => {
    if (!newCode.trim()) { toast.error('Enter a code'); return; }
    if (!newCodeAmount || isNaN(Number(newCodeAmount))) { toast.error('Enter valid amount'); return; }
    if (!newCodeExpiry) { toast.error('Set expiry date'); return; }
    await createRedeemCode({
      id: crypto.randomUUID(),
      code: newCode.toUpperCase(),
      amount: Number(newCodeAmount),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(newCodeExpiry).toISOString(),
      usedBy: [],
      isActive: true,
    });
    toast.success('Redeem code created');
    setNewCode(''); setNewCodeAmount(''); setNewCodeExpiry('');
    loadAll();
  };

  const handleDeactivateCode = async (code: RedeemCode) => {
    await updateRedeemCode({ ...code, isActive: false });
    toast.success('Code deactivated');
    loadAll();
  };

  const handleDeleteCode = async (id: string) => {
    await deleteRedeemCodeById(id);
    toast.success('Code deleted');
    loadAll();
  };

  // ── Analytics data ────────────────────────────────────────────────────────

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const rechargeChartData = last7Days.map(day => ({
    day: day.slice(5),
    amount: recharges
      .filter(r => r.status === 'approved' && r.createdAt?.startsWith(day))
      .reduce((s, r) => s + r.amount, 0),
  }));

  const userGrowthData = last7Days.map(day => ({
    day: day.slice(5),
    users: users.filter(u => u.createdAt?.startsWith(day)).length,
  }));

  const totalRevenue = recharges.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + w.netAmount, 0);
  const activePackages = products.filter(p => p.status === 'active').length;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: `Users (${users.length})` },
    { id: 'packages', label: `Packages (${products.length})` },
    { id: 'recharges', label: `Recharges`, badge: pendingRechargeCount },
    { id: 'withdrawals', label: `Withdrawals`, badge: pendingWithdrawalCount },
    { id: 'analytics', label: 'Analytics' },
    { id: 'redeems', label: 'Redeem Codes' },
  ] as const;

  const handleLogout = () => {
    setAdminSession(false);
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-800 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          <p className="text-blue-200 text-xs">Samsung Earnings Platform</p>
        </div>
        <button onClick={handleLogout} className="text-blue-200 text-sm hover:text-white transition-colors">
          Logout
        </button>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-2 sticky top-[68px] z-20 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {'badge' in t && t.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 pb-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────── */}
            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Users', value: users.length, color: 'text-blue-600' },
                    { label: 'Active Packages', value: activePackages, color: 'text-green-600' },
                    { label: 'Total Revenue', value: `UGX ${totalRevenue.toLocaleString()}`, color: 'text-purple-600' },
                    { label: 'Total Withdrawn', value: `UGX ${totalWithdrawn.toLocaleString()}`, color: 'text-orange-600' },
                    { label: 'Pending Recharges', value: pendingRechargeCount, color: 'text-yellow-600' },
                    { label: 'Pending Withdrawals', value: pendingWithdrawalCount, color: 'text-red-600' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-400">{stat.label}</p>
                      <p className={`text-lg font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRunDailyIncome}
                  disabled={runningIncome}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-xl transition-colors"
                >
                  {runningIncome ? '⏳ Processing...' : '▶ Run Daily Income'}
                </button>

                {/* Recent notifications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
                  {notifications.slice(0, 8).map(n => (
                    <div key={n.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm mt-0.5">
                        {n.type === 'recharge' ? '💳' : n.type === 'withdrawal' ? '💸' : n.type === 'income' ? '💰' : '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{n.title}</p>
                        <p className="text-xs text-gray-400 truncate">{n.message}</p>
                      </div>
                      <span className="text-xs text-gray-300 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {notifications.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No activity yet</p>}
                </div>
              </div>
            )}

            {/* ── USERS ─────────────────────────────────────────────────── */}
            {tab === 'users' && (
              <div className="space-y-3">
                {/* Search & filter */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search name or phone..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={userFilter}
                    onChange={e => setUserFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>

                <button onClick={exportCSV} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                  📥 Export CSV
                </button>

                <p className="text-xs text-gray-400">{filteredUsers.length} users found</p>

                {filteredUsers.map(user => {
                  const userPkgs = products.filter(p => p.userId === user.id);
                  const isExpanded = expandedUserId === user.id;
                  const tree = referralTreeData[user.id];

                  return (
                    <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                              {user.frozen && (
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Frozen</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{user.phone}</p>
                            <p className="text-xs text-gray-400">Code: {user.referralCode}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">UGX {user.balance.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Pkgs: {userPkgs.length}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 mb-3 text-xs">
                          <div className="bg-gray-50 rounded p-1.5 text-center">
                            <p className="text-gray-400">Earned</p>
                            <p className="font-medium">{user.totalEarnings.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-50 rounded p-1.5 text-center">
                            <p className="text-gray-400">Referral</p>
                            <p className="font-medium">{user.referralEarnings.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-50 rounded p-1.5 text-center">
                            <p className="text-gray-400">Withdrawn</p>
                            <p className="font-medium">{user.totalWithdrawal.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleFreezeToggle(user)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              user.frozen
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            }`}
                          >
                            {user.frozen ? '🔓 Unfreeze' : '🔒 Freeze'}
                          </button>
                          <button
                            onClick={() => { setAdjustModal({ user }); setAdjustType('add'); }}
                            className="flex-1 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                          >
                            💰 Adjust
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="flex-1 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                          <button
                            onClick={() => {
                              if (!isExpanded) loadReferralTree(user.id);
                              setExpandedUserId(isExpanded ? null : user.id);
                            }}
                            className="flex-1 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
                          >
                            🌳 Referrals
                          </button>
                        </div>
                      </div>

                      {/* Expanded referral tree */}
                      {isExpanded && tree && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">Referral Tree</h4>
                          {tree.l1.length === 0 ? (
                            <p className="text-xs text-gray-400">No referrals yet</p>
                          ) : (
                            tree.l1.map(l1u => {
                              const l2List = tree.l2[l1u.id] || [];
                              const l1Pkgs = products.filter(p => p.userId === l1u.id);
                              const l1Invested = l1Pkgs.reduce((s, p) => s + p.packagePrice, 0);
                              return (
                                <div key={l1u.id} className="mb-3">
                                  <div className="flex items-center justify-between bg-blue-50 rounded-lg px-2 py-1.5 mb-1">
                                    <div>
                                      <span className="text-xs font-semibold text-blue-700">L1: {l1u.name}</span>
                                      <span className="text-xs text-blue-500 ml-1">({l1u.phone})</span>
                                    </div>
                                    <span className="text-xs text-blue-600">UGX {l1Invested.toLocaleString()}</span>
                                  </div>
                                  {l2List.map(l2u => {
                                    const l3List = tree.l3[l2u.id] || [];
                                    const l2Pkgs = products.filter(p => p.userId === l2u.id);
                                    const l2Invested = l2Pkgs.reduce((s, p) => s + p.packagePrice, 0);
                                    return (
                                      <div key={l2u.id} className="ml-4 mb-1">
                                        <div className="flex items-center justify-between bg-green-50 rounded px-2 py-1 mb-0.5">
                                          <div>
                                            <span className="text-xs text-green-700">L2: {l2u.name}</span>
                                            <span className="text-xs text-green-500 ml-1">({l2u.phone})</span>
                                          </div>
                                          <span className="text-xs text-green-600">UGX {l2Invested.toLocaleString()}</span>
                                        </div>
                                        {l3List.map(l3u => {
                                          const l3Pkgs = products.filter(p => p.userId === l3u.id);
                                          const l3Invested = l3Pkgs.reduce((s, p) => s + p.packagePrice, 0);
                                          return (
                                            <div key={l3u.id} className="ml-4 flex items-center justify-between bg-purple-50 rounded px-2 py-1 mb-0.5">
                                              <div>
                                                <span className="text-xs text-purple-700">L3: {l3u.name}</span>
                                                <span className="text-xs text-purple-500 ml-1">({l3u.phone})</span>
                                              </div>
                                              <span className="text-xs text-purple-600">UGX {l3Invested.toLocaleString()}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })
                          )}
                          <div className="mt-2 pt-2 border-t border-gray-200 flex gap-3 text-xs text-gray-500">
                            <span>L1: {tree.l1.length}</span>
                            <span>L2: {Object.values(tree.l2).flat().length}</span>
                            <span>L3: {Object.values(tree.l3).flat().length}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── PACKAGES ──────────────────────────────────────────────── */}
            {tab === 'packages' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-green-600">{products.filter(p => p.status === 'active').length}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400">Total Invested</p>
                    <p className="text-sm font-bold text-blue-600">
                      UGX {products.reduce((s, p) => s + p.packagePrice, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                {products.map(p => {
                  const owner = users.find(u => u.id === p.userId);
                  return (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{p.packageName}</p>
                          <p className="text-xs text-gray-400">{owner?.name} ({owner?.phone})</p>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                            p.status === 'active' ? 'bg-green-100 text-green-700' :
                            p.status === 'expired' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Invested</p>
                          <p className="text-sm font-bold text-gray-800">UGX {p.packagePrice.toLocaleString()}</p>
                          <p className="text-xs text-green-600">+{p.dailyIncome.toLocaleString()}/day</p>
                        </div>
                      </div>
                      {p.expiryDate && (
                        <p className="text-xs text-gray-400 mt-2">Expires: {new Date(p.expiryDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── RECHARGES ─────────────────────────────────────────────── */}
            {tab === 'recharges' && (
              <div className="space-y-3">
                {['pending', 'approved', 'rejected'].map(status => {
                  const filtered = recharges.filter(r => r.status === status);
                  if (filtered.length === 0) return null;
                  return (
                    <div key={status}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{status} ({filtered.length})</h3>
                      {filtered.map(r => (
                        <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-2">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{r.userName || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{r.userPhone}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{r.network?.toUpperCase()} • Sender: {r.senderPhone}</p>
                              {r.senderName && <p className="text-xs text-gray-500">Sender Name: {r.senderName}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-blue-600">UGX {r.amount.toLocaleString()}</p>
                              <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {r.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveRecharge(r)}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleRejectRecharge(r)}
                                className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          )}
                          {r.status !== 'pending' && r.processedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Processed: {new Date(r.processedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {recharges.length === 0 && <p className="text-center text-gray-400 py-8">No recharges yet</p>}
              </div>
            )}

            {/* ── WITHDRAWALS ───────────────────────────────────────────── */}
            {tab === 'withdrawals' && (
              <div className="space-y-3">
                {['pending', 'approved', 'rejected'].map(status => {
                  const filtered = withdrawals.filter(w => w.status === status);
                  if (filtered.length === 0) return null;
                  return (
                    <div key={status}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{status} ({filtered.length})</h3>
                      {filtered.map(w => (
                        <div key={w.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-2">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{w.userName || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{w.userPhone}</p>
                              <div className="mt-1 bg-blue-50 rounded-lg px-2 py-1.5">
                                <p className="text-xs font-semibold text-blue-700">{w.walletType?.toUpperCase()} Mobile Money</p>
                                <p className="text-xs text-blue-600">📱 {w.walletPhone}</p>
                                <p className="text-xs text-blue-600">👤 {w.walletName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Amount</p>
                              <p className="text-sm font-bold text-gray-800">UGX {w.amount.toLocaleString()}</p>
                              <p className="text-xs text-green-600">Net: UGX {w.netAmount.toLocaleString()}</p>
                              <p className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {w.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveWithdrawal(w)}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(w)}
                                className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                              >
                                ✗ Reject (Refund)
                              </button>
                            </div>
                          )}
                          {w.status !== 'pending' && w.processedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Processed: {new Date(w.processedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {withdrawals.length === 0 && <p className="text-center text-gray-400 py-8">No withdrawals yet</p>}
              </div>
            )}

            {/* ── ANALYTICS ─────────────────────────────────────────────── */}
            {tab === 'analytics' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4 text-sm">Recharge Revenue (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={rechargeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [`UGX ${v.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4 text-sm">New Users (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Revenue', value: `UGX ${totalRevenue.toLocaleString()}`, color: 'text-purple-600' },
                    { label: 'Total Withdrawn', value: `UGX ${totalWithdrawn.toLocaleString()}`, color: 'text-orange-600' },
                    { label: 'Active Packages', value: activePackages, color: 'text-green-600' },
                    { label: 'Total Users', value: users.length, color: 'text-blue-600' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-400">{stat.label}</p>
                      <p className={`text-base font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── REDEEM CODES ──────────────────────────────────────────── */}
            {tab === 'redeems' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Create New Code</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newCode}
                      onChange={e => setNewCode(e.target.value.toUpperCase())}
                      placeholder="Code (e.g. GIFT2024)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
                    />
                    <input
                      type="number"
                      value={newCodeAmount}
                      onChange={e => setNewCodeAmount(e.target.value)}
                      placeholder="Amount (UGX)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={newCodeExpiry}
                      onChange={e => setNewCodeExpiry(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleCreateRedeemCode}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                    >
                      Create Code
                    </button>
                  </div>
                </div>

                {redeemCodes.map(code => (
                  <div key={code.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">{code.code}</p>
                        <p className="text-sm text-green-600">UGX {code.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">
                          Expires: {new Date(code.expiresAt).toLocaleDateString()} • Used: {code.usedBy.length}x
                        </p>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                          code.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {code.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {code.isActive && (
                          <button
                            onClick={() => handleDeactivateCode(code)}
                            className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200"
                          >
                            Deactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCode(code.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {redeemCodes.length === 0 && <p className="text-center text-gray-400 py-8">No redeem codes yet</p>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Adjust Balance Modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-800 mb-1">Adjust Balance</h3>
            <p className="text-sm text-gray-500 mb-4">{adjustModal.user.name} — Current: UGX {adjustModal.user.balance.toLocaleString()}</p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setAdjustType('add')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${adjustType === 'add' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                + Add
              </button>
              <button
                onClick={() => setAdjustType('deduct')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${adjustType === 'deduct' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                − Deduct
              </button>
            </div>

            <input
              type="number"
              value={adjustAmount}
              onChange={e => setAdjustAmount(e.target.value)}
              placeholder="Amount (UGX)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
            />
            <input
              type="text"
              value={adjustNote}
              onChange={e => setAdjustNote(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setAdjustModal(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustBalance}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
