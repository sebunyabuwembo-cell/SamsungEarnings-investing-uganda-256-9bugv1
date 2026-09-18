import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getCurrentUser, refreshCurrentUser, createProduct, updateUser,
  getUserProducts, getUserRecharges,
} from '@/lib/storage';
import { PACKAGES } from '@/constants/packages';
import { UserProduct, Recharge } from '@/types';

const fmt = (n: number) => `UGX ${Number(n).toLocaleString()}`;

const Product = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [myProducts, setMyProducts] = useState<UserProduct[]>([]);
  const [pendingRecharges, setPendingRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<{ packageId: string; packageName: string; price: number } | null>(null);
  const [proofText, setProofText] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const freshUser = await refreshCurrentUser();
      const current = freshUser || getCurrentUser();
      if (!current) { navigate('/login'); return; }
      setUser(current);
      const [prods, recharges] = await Promise.all([
        getUserProducts(current.id),
        getUserRecharges(current.id),
      ]);
      setMyProducts(prods);
      setPendingRecharges(recharges.filter(r => r.status === 'pending'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false); // FIX: always stop loading so button becomes clickable
    }
  };

  const handleBuy = async (packageId: string, price: number, packageName: string) => {
    if (!user) return;
    if (user.frozen) { toast.error('Your account is frozen. Contact support.'); return; }
    if (user.balance < price) {
      toast.error(`Insufficient balance. You have ${fmt(user.balance)}, need ${fmt(price)}. Please deposit.`);
      navigate('/deposit'); // FIX: send to deposit
      return;
    }
    setProofModal({ packageId, packageName, price });
  };

  const confirmBuy = async () => {
    if (!user || !proofModal) return;
    setBuyingId(proofModal.packageId);

    const pkg = PACKAGES.find(p => p.id === proofModal.packageId);
    if (!pkg) { setBuyingId(null); return; }

    try {
      const product: UserProduct = {
        id: crypto.randomUUID(),
        userId: user.id,
        packageId: pkg.id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        dailyIncome: pkg.dailyIncome,
        duration: pkg.duration,
        status: 'pending',
        buyDate: new Date().toISOString(),
        expiryDate: null,
        lastIncomeDate: null,
        totalIncomeEarned: 0,
        paymentProof: proofText.trim(),
      };

      await createProduct(product);
      await updateUser(user.id, { balance: user.balance - pkg.price });

      toast.success(`${pkg.name} purchased! Awaiting admin activation.`);
      setProofModal(null);
      setProofText('');
      await loadData();
    } catch (e) {
      toast.error('Purchase failed');
    } finally {
      setBuyingId(null);
    }
  };

  const getActivePackage = (packageId: string) =>
    myProducts.find(p => p.packageId === packageId && (p.status === 'active' || p.status === 'pending'));

  if (!user && loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!user) return null;

  const totalPending = pendingRecharges.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-900 text-white px-4 py-4 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold">Investment Packages</h1>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-200">Balance</div>
            <div className="font-bold text-sm">{fmt(user.balance)}</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {pendingRecharges.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-yellow-500 text-lg">⏳</span>
              <div>
                <div className="font-semibold text-yellow-800 text-sm">Pending Recharge</div>
                <div className="text-yellow-700 text-xs mt-0.5">
                  You have pending <strong>{fmt(totalPending)}</strong> awaiting approval.
                </div>
              </div>
            </div>
          </div>
        )}

        {user.frozen && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-red-700 text-sm font-medium">
            ⚠️ Account frozen. Purchases disabled.
          </div>
        )}

        {[1, 2, 3].map(group => {
          const groupPackages = PACKAGES.filter(p => p.group === group);
          const groupNames = ['Starter Packages', 'Growth Packages', 'Premium Packages'];
          const groupColors = ['from-blue-500 to-blue-700', 'from-green-500 to-green-700', 'from-purple-600 to-purple-900'];
          return (
            <div key={group}>
              <div className={`bg-gradient-to-r ${groupColors[group - 1]} text-white rounded-xl px-4 py-2.5 mb-3`}>
                <h2 className="font-bold text-sm">{groupNames[group - 1]}</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {groupPackages.map(pkg => {
                  const owned = getActivePackage(pkg.id);
                  const canAfford = user.balance >= pkg.price;
                  return (
                    <div key={pkg.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                      <div className="relative h-36 overflow-hidden">
                        <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <div className="text-white font-bold text-lg leading-none">{pkg.name}</div>
                          <div className="text-white/80 text-xs">{pkg.duration} days</div>
                        </div>
                        {owned && (
                          <div className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-bold ${
                            owned.status === 'active' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'
                          }`}>
                            {owned.status === 'active' ? '✓ Active' : '⏳ Pending'}
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-blue-50 rounded-xl p-3 text-center">
                            <div className="text-xs text-blue-500 font-medium">Package Price</div>
                            <div className="font-bold text-blue-800 text-sm mt-0.5">{fmt(pkg.price)}</div>
                          </div>
                          <div className="bg-green-50 rounded-xl p-3 text-center">
                            <div className="text-xs text-green-500 font-medium">Daily Income</div>
                            <div className="font-bold text-green-700 text-sm mt-0.5">{fmt(pkg.dailyIncome)}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>Duration: <strong>{pkg.duration} days</strong></span>
                          <span>Total: <strong className="text-green-600">{fmt(pkg.dailyIncome * pkg.duration)}</strong></span>
                        </div>

                        {owned ? (
                          <div className="w-full bg-gray-100 text-gray-500 font-semibold py-2.5 rounded-xl text-center text-sm">
                            {owned.status === 'active' ? 'Package Active' : 'Awaiting Activation'}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBuy(pkg.id, pkg.price, pkg.name)}
                            disabled={!!buyingId || user.frozen}
                            className={`w-full font-semibold py-2.5 rounded-xl transition text-sm text-white ${
                              !canAfford ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
                            } disabled:bg-gray-300`}
                          >
                            {buyingId === pkg.id ? 'Processing...' : canAfford ? `Buy — ${fmt(pkg.price)}` : `Deposit to Buy — ${fmt(pkg.price)}`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {proofModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-1">Confirm Purchase</h3>
            <p className="text-sm text-gray-500 mb-4">{proofModal.packageName} — {fmt(proofModal.price)}</p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">
              <strong>{fmt(proofModal.price)}</strong> will be deducted from balance <strong>{fmt(user.balance)}</strong>.
            </div>
            <textarea
              value={proofText}
              onChange={e => setProofText(e.target.value)}
              placeholder="Payment reference (optional)"
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setProofModal(null); setProofText(''); }} className="flex-1 py-2.5 border rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={confirmBuy} disabled={!!buyingId} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">Confirm Buy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
