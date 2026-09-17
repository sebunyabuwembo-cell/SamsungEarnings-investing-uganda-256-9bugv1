import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getCurrentUser, refreshCurrentUser, getUserWallets, saveWallet, deleteWalletsByUser } from '@/lib/storage';
import { Wallet } from '@/types';

const WalletPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const [walletType, setWalletType] = useState<'mtn' | 'airtel'>('mtn');
  const [walletPhone, setWalletPhone] = useState('');
  const [walletName, setWalletName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    const freshUser = await refreshCurrentUser();
    if (!freshUser) { navigate('/login'); return; }
    setUser(freshUser);
    const w = await getUserWallets(freshUser.id);
    setWallets(w);
    setLoading(false);
  };

  const handleAddWallet = async () => {
    if (!walletPhone.trim() || !walletName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSaving(true);
    const wallet: Wallet = {
      id: crypto.randomUUID(),
      userId: user!.id,
      type: walletType,
      phone: walletPhone.trim(),
      name: walletName.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveWallet(wallet);
    toast.success('Wallet saved successfully');
    setWalletPhone('');
    setWalletName('');
    setSaving(false);
    await loadData();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-900 text-white px-4 py-4 flex items-center gap-3 shadow">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">My Wallets</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Add Wallet */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Add Payment Wallet</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setWalletType('mtn')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${walletType === 'mtn' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                MTN Mobile Money
              </button>
              <button
                onClick={() => setWalletType('airtel')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${walletType === 'airtel' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Airtel Money
              </button>
            </div>
            <input
              type="tel"
              value={walletPhone}
              onChange={e => setWalletPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={walletName}
              onChange={e => setWalletName(e.target.value)}
              placeholder="Account holder name"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddWallet}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-semibold transition"
            >
              {saving ? 'Saving...' : 'Save Wallet'}
            </button>
          </div>
        </div>

        {/* Wallet List */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Saved Wallets</h2>
          {loading ? (
            <div className="text-center text-gray-400 py-6 text-sm">Loading...</div>
          ) : wallets.length === 0 ? (
            <div className="text-center text-gray-400 py-6 text-sm">No wallets added yet.</div>
          ) : (
            <div className="space-y-3">
              {wallets.map(w => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${w.type === 'mtn' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {w.type === 'mtn' ? 'MTN' : 'AIR'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{w.name}</div>
                    <div className="text-gray-500 text-xs">{w.phone}</div>
                    <div className="text-gray-400 text-xs capitalize">{w.type === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
