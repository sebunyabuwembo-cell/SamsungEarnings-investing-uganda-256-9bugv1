import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { getCurrentUser, refreshCurrentUser, getUserProducts } from '@/lib/storage';
import { formatUGX, formatDate, daysLeft } from '@/lib/utils';
import { UserProduct } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
};

const MyProduct = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'expired'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        let u = getCurrentUser();
        if (!u) u = await refreshCurrentUser();
        if (!u) { navigate('/login'); return; }

        console.log('Loading products for user:', u.id);
        const prods = await getUserProducts(u.id);
        console.log('Products found:', prods.length, prods);
        setProducts([...prods].reverse());
      } catch (e) {
        console.error('Load products error:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const filtered = filter === 'all'? products : products.filter((p) => p.status === filter);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading your products...</div>;

  return (
    <div className="app-container min-h-screen bg-gray-50 pb-24">
      <div className="flex items-center px-4 py-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
        <h1 className="text-gray-800 font-bold text-lg">My Products</h1>
        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">{products.length}</span>
      </div>

      <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {['all', 'pending', 'active', 'expired'].map((f) => (
          <button key={f} onClick={() => setFilter(f as typeof filter)} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filter === f? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{f} {f!== 'all' && `(${products.filter(p=>p.status===f).length})`}</button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4">
        {filtered.length === 0? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <div className="text-gray-500 font-medium">No {filter!== 'all'? filter : ''} products found</div>
            <div className="text-gray-400 text-xs mt-2">Total products in account: {products.length}</div>
            {products.length === 0 && <div className="text-amber-600 text-xs mt-3 px-4">If you just bought, check admin panel → approve pending product</div>}
            <button onClick={() => navigate('/product')} className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Buy a Package</button>
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-800 font-bold text-base">{p.packageName}</div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${statusColors[p.status] || 'bg-gray-100'}`}>{p.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-xl p-2.5"><div className="text-gray-400 text-xs">Investment</div><div className="text-gray-800 font-bold text-sm">{formatUGX(p.packagePrice)}</div></div>
                <div className="bg-gray-50 rounded-xl p-2.5"><div className="text-gray-400 text-xs">Daily Income</div><div className="text-green-600 font-bold text-sm">{formatUGX(p.dailyIncome)}</div></div>
                <div className="bg-gray-50 rounded-xl p-2.5"><div className="text-gray-400 text-xs">Buy Date</div><div className="text-gray-700 font-medium text-xs">{p.buyDate? formatDate(p.buyDate) : 'Pending'}</div></div>
                <div className="bg-gray-50 rounded-xl p-2.5"><div className="text-gray-400 text-xs">Expiry Date</div><div className="text-gray-700 font-medium text-xs">{p.expiryDate? formatDate(p.expiryDate) : 'After approval'}</div></div>
              </div>
              {p.status === 'active' && p.expiryDate && (
                <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-green-600" /><span className="text-green-700 text-sm font-medium">{daysLeft(p.expiryDate)} days left</span></div>
                  <div className="text-green-700 text-sm font-bold">Earned: {formatUGX(p.totalIncomeEarned || 0)}</div>
                </div>
              )}
              {p.status === 'pending' && (
                <div className="bg-amber-50 rounded-xl px-3 py-2 text-center"><p className="text-amber-700 text-xs">⏳ Awaiting admin approval to start earning</p></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyProduct;
