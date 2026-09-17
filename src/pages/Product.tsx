
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { refreshCurrentUser, getCurrentUser, getUsers, createProduct, addNotification, updateUser, getUserById, setCurrentUser, getUserRecharges } from '@/lib/storage';
import { PACKAGES } from '@/constants/packages';
import { formatUGX, generateId, addDays } from '@/lib/utils';
import { UserProduct, User } from '@/types';
import { BRAND } from '@/constants/brand';

const Product = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRechargeTotal, setPendingRechargeTotal] = useState(0);

  useEffect(() => {
    const init = async () => {
      const cached = getCurrentUser();
      if (!cached) { navigate('/login'); return; }
      const fresh = await refreshCurrentUser();
      if (!fresh) { navigate('/login'); return; }
      setUser(fresh);
      const recharges = await getUserRecharges(fresh.id);
      setPendingRechargeTotal(recharges.filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0));
      setLoading(false);
    };
    init();
  }, [navigate]);

  const filtered = selectedGroup? PACKAGES.filter((p) => p.group === selectedGroup) : PACKAGES;

  const handleBuy = async (packageId: string) => {
    if (!user) return navigate('/login');
    if (user.frozen) { toast.error('Account frozen. Contact support.'); return; }
    const pkg = PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;
    const freshUser = await getUserById(user.id);
    if (!freshUser) { toast.error('Could not load account.'); return; }
    if (freshUser.balance < pkg.price) { toast.error(`Insufficient. You have ${formatUGX(freshUser.balance)} — need ${formatUGX(pkg.price)}`); setUser(freshUser); setCurrentUser(freshUser); return; }
    setBuying(packageId);
    await updateUser({...freshUser, balance: freshUser.balance - pkg.price });
    const product: UserProduct = { id: generateId(), userId: freshUser.id, packageId: pkg.id, packageName: pkg.name.replace(/Samsung|Engle/gi, BRAND.short), packagePrice: pkg.price, dailyIncome: pkg.dailyIncome, duration: pkg.duration, buyDate: new Date().toISOString(), expiryDate: addDays(new Date(), pkg.duration).toISOString(), status: 'pending', lastIncomeDate: null, totalIncomeEarned: 0, paymentProof: 'Balance Payment' };
    await createProduct(product);
    await addNotification({ userId: freshUser.id, type: 'package_approved', title: 'Purchase Submitted', message: `Your ${product.packageName} (${formatUGX(pkg.price)}) is pending approval.`, isRead: false });
    const allUsers = await getUsers();
    if (freshUser.referredBy) {
      const l1 = allUsers.find((u) => u.id === freshUser.referredBy);
      if (l1) { await addNotification({ userId: l1.id, type: 'referral_bonus', title: '🎉 Referral Investment Pending!', message: `${freshUser.name} purchased ${product.packageName} (${formatUGX(pkg.price)}). You will earn UGX ${Math.round(pkg.price*0.30).toLocaleString()} (30%) once approved.`, isRead: false }); if (l1.referredBy) { const l2 = allUsers.find((u) => u.id === l1.referredBy); if (l2) { await addNotification({ userId: l2.id, type: 'referral_bonus', title: '📣 L2 Pending', message: `L2 member ${freshUser.name} purchased ${product.packageName}. Earn ${Math.round(pkg.price*0.02).toLocaleString()} on approval.`, isRead: false }); if (l2.referredBy) { const l3 = allUsers.find((u) => u.id === l2.referredBy); if (l3) { await addNotification({ userId: l3.id, type: 'referral_bonus', title: '📣 L3 Pending', message: `L3 member purchased package. Earn ${Math.round(pkg.price*0.01).toLocaleString()} on approval.`, isRead: false }); } } } }
    }
    setCurrentUser({...freshUser, balance: freshUser.balance - pkg.price });
    setUser({...freshUser, balance: freshUser.balance - pkg.price } as any);
    toast.success(`${product.packageName} purchased! Awaiting approval.`); setBuying(null);
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading {BRAND.short}...</div></AppLayout>;

  return (
    <AppLayout>
      {pendingRechargeTotal > 0 && (<div className="mx-4 mt-4 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex gap-3"><span className="text-xl">⏳</span><div><div className="text-amber-800 font-bold text-sm">Recharge Pending</div><div className="text-amber-700 text-xs mt-0.5">Pending {formatUGX(pendingRechargeTotal)} awaiting approval.</div></div></div>)}
      <div className="mx-4 mt-4 mb-2 flex items-center justify-between rounded-2xl px-4 py-3 border" style={{background: `${BRAND.color}10`, borderColor: `${BRAND.color}20`}}><div><div className="text-xs font-medium" style={{color: BRAND.color}}>Available Balance</div><div className="font-black text-lg" style={{color: BRAND.color}}>{user? formatUGX(user.balance) : '...'}</div></div><div className="text-xs text-right text-gray-500"><div>Use balance to</div><div className="font-semibold">buy packages</div></div></div>
      <div className="px-4 pt-2 pb-2"><h1 className="text-gray-900 text-xl font-bold">{BRAND.packagesTitle}</h1><p className="text-gray-500 text-sm mt-1">{BRAND.packagesSubtitle}</p></div>
      <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">{[null,1,2,3].map((g) => (<button key={String(g)} onClick={() => setSelectedGroup(g)} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${selectedGroup===g? 'text-white' : 'bg-gray-100 text-gray-600'}`} style={selectedGroup===g? {background: BRAND.color} : {}}>{g===null? 'All' : `Group ${g}`}</button>))}</div>
      <div className="px-4 mt-3 space-y-4 pb-6">
        {filtered.map((pkg) => {
          const canAfford = user? user.balance >= pkg.price : false;
          const displayName = pkg.name.replace(/Samsung|Engle/gi, BRAND.short);
          return (
            <div key={pkg.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border">
              <div className="relative"><img src={pkg.image} alt={displayName} className="w-full h-44 object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><div className="absolute bottom-3 left-4 text-white"><div className="text-lg font-bold">{displayName}</div><div className="text-xs text-gray-200">Group {pkg.group} • {pkg.duration} Days</div></div><div className="absolute top-3 right-3 text-white text-xs px-2 py-1 rounded-full font-semibold" style={{background: BRAND.color}}>G{pkg.group}</div>{!canAfford && (<div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] px-2 py-1 rounded-full font-bold">Need {formatUGX(pkg.price-(user?.balance??0))} more</div>)}</div>
              <div className="p-4"><div className="grid grid-cols-3 gap-3 mb-4"><div className="text-center"><div className={`font-bold text-sm ${canAfford? '' : 'text-red-500'}`} style={{color: canAfford? BRAND.color:''}}>{formatUGX(pkg.price)}</div><div className="text-gray-400 text-xs">Invest</div></div><div className="text-center"><div className="text-green-600 font-bold text-sm">{formatUGX(pkg.dailyIncome)}</div><div className="text-gray-400 text-xs">Daily</div></div><div className="text-center"><div className="text-amber-600 font-bold text-sm">{pkg.duration}d</div><div className="text-gray-400 text-xs">Duration</div></div></div><div className="rounded-xl p-3 mb-3" style={{background: `${BRAND.color}10`}}><div className="text-xs font-medium" style={{color: BRAND.color}}>Total: {formatUGX(pkg.dailyIncome*pkg.duration)}</div><div className="text-xs mt-0.5 opacity-70" style={{color: BRAND.color}}>ROI: {(((pkg.dailyIncome*pkg.duration)/pkg.price)*100).toFixed(0)}%</div></div><button onClick={()=>handleBuy(pkg.id)} disabled={buying===pkg.id ||!canAfford ||!!user?.frozen} className={`w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 ${!canAfford? 'bg-gray-400':''}`} style={canAfford &&!user?.frozen? {background: BRAND.gradient}:{}}>{buying===pkg.id? 'Processing...' :!canAfford? `Recharge ${formatUGX(pkg.price-(user?.balance??0))} more` : `Buy Now — ${formatUGX(pkg.price)}`}</button></div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};
export default Product;
