import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getCurrentUser,
  createProduct,
  updateUser,
  addNotification,
  getUserRecharges,
  getUserById,
} from '@/lib/storage';
import { PACKAGES, PackageGroup } from '@/constants/packages';
import type { SamsungUser, SamsungRecharge } from '@/types';

const Product = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SamsungUser | null>(null);
  const [pendingRecharge, setPendingRecharge] = useState<SamsungRecharge | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [confirmPkg, setConfirmPkg] = useState<typeof PACKAGES[0] | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);
    loadPendingRecharge(u.id);
  }, [navigate]);

  const loadPendingRecharge = async (userId: string) => {
    const recharges = await getUserRecharges(userId);
    const pending = recharges.find(r => r.status === 'pending') || null;
    setPendingRecharge(pending);
  };

  const handleBuy = async (pkg: typeof PACKAGES[0]) => {
    if (!user) return;

    const freshUser = await getUserById(user.id);
    if (!freshUser) { toast.error('Session error. Please login again.'); return; }

    if (freshUser.frozen) {
      toast.error('Your account is frozen. Contact support.');
      return;
    }

    if (freshUser.balance < pkg.price) {
      toast.error(`Insufficient balance. Need UGX ${pkg.price.toLocaleString()}, have UGX ${freshUser.balance.toLocaleString()}`);
      return;
    }

    setBuying(pkg.id);
    try {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setDate(expiry.getDate() + pkg.duration);

      const newBalance = freshUser.balance - pkg.price;
      await updateUser(user.id, { balance: newBalance });

      await createProduct({
        user_id: user.id,
        package_id: pkg.id,
        package_name: pkg.name,
        package_price: pkg.price,
        daily_income: pkg.dailyIncome,
        duration: pkg.duration,
        status: 'active',
        buy_date: now.toISOString(),
        expiry_date: expiry.toISOString(),
        last_income_date: now.toISOString(),
        total_income_earned: 0,
        payment_proof: '',
      });

      await addNotification(
        user.id,
        'purchase',
        'Package Purchased',
        `You successfully purchased ${pkg.name} for UGX ${pkg.price.toLocaleString()}. Daily income: UGX ${pkg.dailyIncome.toLocaleString()} for ${pkg.duration} days.`
      );

      setUser({ ...freshUser, balance: newBalance });
      toast.success(`${pkg.name} purchased! Daily income: UGX ${pkg.dailyIncome.toLocaleString()}`);
      setConfirmPkg(null);
      navigate('/my-product');
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setBuying(null);
    }
  };

  const groupedPackages: Record<string, typeof PACKAGES> = {};
  PACKAGES.forEach(pkg => {
    if (!groupedPackages[pkg.group]) groupedPackages[pkg.group] = [];
    groupedPackages[pkg.group].push(pkg);
  });

  const groupColors: Record<string, { bg: string; badge: string; text: string }> = {
    [PackageGroup.Starter]: { bg: 'from-green-500 to-green-600', badge: 'bg-green-100 text-green-700', text: 'text-green-600' },
    [PackageGroup.Growth]: { bg: 'from-blue-500 to-blue-700', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-600' },
    [PackageGroup.Premium]: { bg: 'from-purple-600 to-purple-800', badge: 'bg-purple-100 text-purple-700', text: 'text-purple-600' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/home')} className="p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Investment Packages</h1>
        {user && (
          <div className="ml-auto text-right">
            <p className="text-xs text-blue-200">Balance</p>
            <p className="text-sm font-bold">UGX {user.balance.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Pending recharge banner */}
      {pendingRecharge && (
        <div className="mx-4 mt-4 bg-yellow-50 border border-yellow-300 rounded-xl p-3 flex items-start gap-2">
          <span className="text-yellow-500 text-lg mt-0.5">⏳</span>
          <div>
            <p className="text-yellow-800 font-semibold text-sm">Pending Recharge</p>
            <p className="text-yellow-700 text-xs mt-0.5">
              You have a pending recharge of UGX {Number(pendingRecharge.amount).toLocaleString()} awaiting admin approval. Your balance will update once approved.
            </p>
          </div>
        </div>
      )}

      {/* Frozen banner */}
      {user?.frozen && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-300 rounded-xl p-3 flex items-start gap-2">
          <span className="text-red-500 text-lg mt-0.5">🔒</span>
          <div>
            <p className="text-red-800 font-semibold text-sm">Account Frozen</p>
            <p className="text-red-700 text-xs mt-0.5">Your account is currently frozen. You cannot purchase packages. Contact support.</p>
          </div>
        </div>
      )}

      {/* Package groups */}
      <div className="px-4 py-4 space-y-6 pb-24">
        {Object.entries(groupedPackages).map(([group, pkgs]) => {
          const colors = groupColors[group] || groupColors[PackageGroup.Starter];
          return (
            <div key={group}>
              <div className={`bg-gradient-to-r ${colors.bg} text-white rounded-xl px-4 py-3 mb-3`}>
                <h2 className="font-bold text-lg">{group}</h2>
                <p className="text-xs text-white text-opacity-80 mt-0.5">
                  {group === PackageGroup.Premium ? '30-day duration' : group === PackageGroup.Growth ? '90-day duration' : '60-day duration'}
                </p>
              </div>

              <div className="space-y-3">
                {pkgs.map(pkg => (
                  <div key={pkg.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm">{pkg.name}</h3>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${colors.badge}`}>{group}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Price</p>
                          <p className={`font-bold text-base ${colors.text}`}>UGX {pkg.price.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Daily Income</p>
                          <p className="text-xs font-bold text-green-600">UGX {pkg.dailyIncome.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Duration</p>
                          <p className="text-xs font-bold text-gray-700">{pkg.duration} days</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Total Return</p>
                          <p className="text-xs font-bold text-blue-600">UGX {(pkg.dailyIncome * pkg.duration).toLocaleString()}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setConfirmPkg(pkg)}
                        disabled={!!buying || user?.frozen}
                        className={`mt-3 w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-colors bg-gradient-to-r ${colors.bg} disabled:opacity-50`}
                      >
                        {buying === pkg.id ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirmPkg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 text-center mb-1">Confirm Purchase</h3>
            <p className="text-gray-500 text-sm text-center mb-4">You are about to buy:</p>

            <div className="bg-blue-50 rounded-xl p-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Package</span>
                <span className="font-semibold text-gray-800">{confirmPkg.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Price</span>
                <span className="font-bold text-red-600">UGX {confirmPkg.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Daily Income</span>
                <span className="font-bold text-green-600">UGX {confirmPkg.dailyIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold text-gray-800">{confirmPkg.duration} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Your Balance</span>
                <span className={`font-semibold ${(user?.balance || 0) >= confirmPkg.price ? 'text-green-600' : 'text-red-600'}`}>
                  UGX {(user?.balance || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {(user?.balance || 0) < confirmPkg.price && (
              <p className="text-red-600 text-xs text-center mb-3">
                Insufficient balance. Please recharge first.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPkg(null)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBuy(confirmPkg)}
                disabled={!!buying || (user?.balance || 0) < confirmPkg.price}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm transition-colors"
              >
                {buying ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-40">
        {[
          { icon: '🏠', label: 'Home', path: '/home' },
          { icon: '📦', label: 'Product', path: '/product' },
          { icon: '💳', label: 'Recharge', path: '/recharge' },
          { icon: '💰', label: 'Withdraw', path: '/withdraw' },
          { icon: '👤', label: 'Mine', path: '/mine' },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${item.path === '/product' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Product;
