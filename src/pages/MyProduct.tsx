import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserProducts } from '@/lib/storage';
import type { User, UserProduct } from '@/types';

const MyProduct = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'expired'>('active');

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);
    loadProducts(u.id);
  }, [navigate]);

  const loadProducts = async (userId: string) => {
    setLoading(true);
    try {
      const data = await getUserProducts(userId);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeProducts = products.filter(p => p.status === 'active');
  const expiredProducts = products.filter(p => p.status === 'expired');
  const displayProducts = tab === 'active' ? activeProducts : expiredProducts;

  const getProgressPercent = (product: UserProduct) => {
    if (!product.buyDate || !product.expiryDate) return 0;
    const total = new Date(product.expiryDate).getTime() - new Date(product.buyDate).getTime();
    const elapsed = Date.now() - new Date(product.buyDate).getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const getDaysLeft = (product: UserProduct) => {
    if (!product.expiryDate) return 0;
    const diff = new Date(product.expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
        <h1 className="text-lg font-semibold">My Packages</h1>
        <div className="ml-auto text-right">
          <p className="text-xs text-blue-200">Total Packages</p>
          <p className="text-sm font-bold">{products.length}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400">Active Packages</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeProducts.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400">Total Earned</p>
          <p className="text-lg font-bold text-blue-600 mt-1">
            UGX {products.reduce((sum, p) => sum + Number(p.totalIncomeEarned || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4 flex gap-2">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-500 border border-gray-200'
          }`}
        >
          Active ({activeProducts.length})
        </button>
        <button
          onClick={() => setTab('expired')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'expired'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-500 border border-gray-200'
          }`}
        >
          Expired ({expiredProducts.length})
        </button>
      </div>

      {/* Products list */}
      <div className="px-4 py-4 space-y-3 pb-24">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Loading packages...</p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">📦</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {tab === 'active' ? 'No active packages' : 'No expired packages'}
            </p>
            {tab === 'active' && (
              <button
                onClick={() => navigate('/product')}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                Browse Packages
              </button>
            )}
          </div>
        ) : (
          displayProducts.map(product => {
            const progress = getProgressPercent(product);
            const daysLeft = getDaysLeft(product);
            const isActive = product.status === 'active';

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Status bar */}
                <div className={`px-4 py-2 flex items-center justify-between ${isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isActive ? '● Active' : '✓ Expired'}
                  </span>
                  {isActive && (
                    <span className="text-xs text-gray-500">{daysLeft} days left</span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{product.packageName}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Purchased {product.buyDate ? new Date(product.buyDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Invested</p>
                      <p className="text-sm font-bold text-gray-800">UGX {Number(product.packagePrice).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Daily</p>
                      <p className="text-xs font-bold text-green-600">UGX {Number(product.dailyIncome).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Earned</p>
                      <p className="text-xs font-bold text-blue-600">UGX {Number(product.totalIncomeEarned || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Duration</p>
                      <p className="text-xs font-bold text-gray-700">{product.duration} days</p>
                    </div>
                  </div>

                  {isActive && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {product.expiryDate && (
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          Expires {new Date(product.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

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
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${item.path === '/my-product' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MyProduct;
