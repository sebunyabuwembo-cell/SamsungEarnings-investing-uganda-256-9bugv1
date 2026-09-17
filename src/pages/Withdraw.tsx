import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getCurrentUser, refreshCurrentUser, getUserWallets, saveWallet,
  createWithdrawal, updateUser, getUserWithdrawals,
} from '@/lib/storage';
import { Wallet, Withdrawal } from '@/types';
import { WITHDRAWAL_TAX, MIN_WITHDRAWAL } from '@/constants/packages';

const fmt = (n: number) => `UGX ${Number(n).toLocaleString()}`;

const Withdraw = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [loading, setLoading] = useState(false);

  // Add wallet form
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [walletType, setWalletType] = useState<'mtn' | 'airtel'>('mtn');
  const [walletPhone, setWalletPhone] = useState('');
  const [walletName, setWalletName] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    const freshUser = await refreshCurrentUser();
    if (!freshUser) { navigate('/login'); return; }
    setUser(freshUser);

    const [w, wds] = await Promise.all([
      getUserWallets(freshUser.id),
      getUserWithdrawals(freshUser.id),
    ]);
    setWallets(w);
    setWithdrawals(wds);
    if (w.length > 0 && !selectedWalletId) setSelectedWalletId(w[0].id);
  };

  const handleAddWallet = async () => {
    if (!walletPhone.trim() || !walletName.trim()) {
      toast.error('Please fill in all wallet fields');
      return;
    }
    const wallet: Wallet = {
      id: crypto.randomUUID(),
      userId: user!.id,
      type: walletType,
      phone: walletPhone.trim(),
      name: walletName.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveWallet(wallet);
    toast.success('Wallet saved');
    setWalletPhone('');
    setWalletName('');
    setShowAddWallet(false);
    await loadData();
  };

  const handleWithdraw = async () => {
    if (!user) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt < MIN_WITHDRAWAL) { toast.error(`Minimum withdrawal is ${fmt(MIN_WITHDRAWAL)}`); return; }
    if (amt > user.balance) { toast.error('Insufficient balance'); return; }
    if (!selectedWalletId) { toast.error('Please select a wallet'); return; }

    if (user.frozen) { toast.error('Your account is frozen. Contact support.'); return; }

    const wallet = wallets.find(w => w.id === selectedWalletId);
    if (!wallet) { toast.error('Wallet not found'); return; }

    // Check if user has an active package
    setLoading(true);
    const tax = amt * WITHDRAWAL_TAX;
    const netAmount = amt - tax;

    const withdrawal: Withdrawal = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      amount: amt,
      netAmount,
      walletType: wallet.type,
      walletPhone: wallet.phone,
      walletName: wallet.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
      processedAt: null,
    };

    await createWithdrawal(withdrawal);
    await updateUser(user.id, {
      balance: user.balance - amt,
      totalWithdrawal: user.totalWithdrawal + amt,
    });

    toast.success(`Withdrawal of ${fmt(amt)} submitted! Net: ${fmt(netAmount)} after 18% tax.`);
    setAmount('');
    await loadData();
    setLoading(false);
  };

  if (!user) return null;

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const tax = parseFloat(amount) ? parseFloat(amount) * WITHDRAWAL_TAX : 0;
  const net = parseFloat(amount) ? parseFloat(amount) - tax : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-900 text-white px-4 py-4 flex items-center gap-3 shadow">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">Withdraw</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-blue-200 text-sm">Available Balance</p>
          <p className="text-3xl font-bold mt-1">{fmt(user.balance)}</p>
          <p className="text-blue-200 text-xs mt-2">Min withdrawal: {fmt(MIN_WITHDRAWAL)} · Tax: 18%</p>
        </div>

        {/* Frozen Warning */}
        {user.frozen && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-red-700 text-sm font-medium">
            ⚠️ Your account is frozen. Withdrawals are disabled. Contact support.
          </div>
        )}

        {/* Wallet Section */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Payment Wallet</h2>
            <button
              onClick={() => setShowAddWallet(!showAddWallet)}
              className="text-blue-600 text-sm font-medium"
            >
              {showAddWallet ? 'Cancel' : '+ Add Wallet'}
            </button>
          </div>

          {showAddWallet && (
            <div className="border border-blue-100 rounded-xl p-4 mb-3 bg-blue-50 space-y-3">
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
                placeholder="Wallet phone number"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                Save Wallet
              </button>
            </div>
          )}

          {wallets.length === 0 ? (
            <div className="text-center text-gray-400 py-4 text-sm">
              No wallets added yet. Add a wallet to withdraw.
            </div>
          ) : (
            <div className="space-y-2">
              {wallets.map(w => (
                <div
                  key={w.id}
                  onClick={() => setSelectedWalletId(w.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    selectedWalletId === w.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${w.type === 'mtn' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {w.type === 'mtn' ? 'MTN' : 'AIR'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{w.name}</div>
                    <div className="text-gray-500 text-xs">{w.phone}</div>
                  </div>
                  {selectedWalletId === w.id && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Withdrawal Amount</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">UGX</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full border rounded-lg pl-14 pr-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>

          {parseFloat(amount) > 0 && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Amount</span>
                <span>{fmt(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Tax (18%)</span>
                <span>- {fmt(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 border-t pt-1.5">
                <span>You receive</span>
                <span className="text-green-600">{fmt(net)}</span>
              </div>
            </div>
          )}

          {selectedWallet && (
            <div className="mt-3 text-xs text-gray-500 text-center">
              Sending to: <span className="font-medium text-gray-700">{selectedWallet.name}</span> · {selectedWallet.phone}
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={loading || user.frozen || wallets.length === 0}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? 'Processing...' : 'Submit Withdrawal'}
          </button>
        </div>

        {/* History */}
        {withdrawals.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Recent Withdrawals</h2>
            <div className="space-y-3">
              {withdrawals.slice(0, 10).map(w => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{fmt(w.amount)}</div>
                    <div className="text-xs text-gray-500">{w.walletType.toUpperCase()} · {w.walletPhone}</div>
                    <div className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      w.status === 'approved' ? 'bg-green-100 text-green-700'
                      : w.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}>{w.status}</span>
                    <div className="text-xs text-green-600 font-medium mt-1">Net: {fmt(w.netAmount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
