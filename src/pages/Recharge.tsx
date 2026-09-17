import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getCurrentUser, refreshCurrentUser, createRecharge, getUserRecharges,
} from '@/lib/storage';
import { Recharge } from '@/types';
import { MTN_NUMBER, MTN_NAME, AIRTEL_NUMBER, AIRTEL_NAME, MIN_DEPOSIT } from '@/constants/packages';

const fmt = (n: number) => `UGX ${Number(n).toLocaleString()}`;

const RechargePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [network, setNetwork] = useState<'mtn' | 'airtel'>('mtn');
  const [amount, setAmount] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [proof, setProof] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    const freshUser = await refreshCurrentUser();
    if (!freshUser) { navigate('/login'); return; }
    setUser(freshUser);
    const r = await getUserRecharges(freshUser.id);
    setRecharges(r);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < MIN_DEPOSIT) {
      toast.error(`Minimum recharge is ${fmt(MIN_DEPOSIT)}`);
      return;
    }
    if (!senderPhone.trim()) {
      toast.error('Enter the sender phone number');
      return;
    }
    if (!senderName.trim()) {
      toast.error('Enter the sender name');
      return;
    }

    setSubmitting(true);
    const recharge: Recharge = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      amount: amt,
      network,
      senderPhone: senderPhone.trim(),
      senderName: senderName.trim(),
      proof: proof.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      processedAt: null,
    };

    await createRecharge(recharge);
    toast.success('Recharge submitted! Awaiting admin approval.');
    setAmount('');
    setSenderPhone('');
    setSenderName('');
    setProof('');
    setSubmitting(false);
    await loadData();
  };

  if (!user) return null;

  const depositTarget = network === 'mtn'
    ? { number: MTN_NUMBER, name: MTN_NAME, label: 'MTN Mobile Money' }
    : { number: AIRTEL_NUMBER, name: AIRTEL_NAME, label: 'Airtel Money' };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-900 text-white px-4 py-4 flex items-center gap-3 shadow">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">Recharge Balance</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="font-semibold text-blue-800 text-sm mb-2">📱 How to Recharge</div>
          <ol className="text-blue-700 text-xs space-y-1 list-decimal list-inside">
            <li>Select your network (MTN or Airtel)</li>
            <li>Send money to the number shown below</li>
            <li>Fill in the form and submit for admin approval</li>
            <li>Your balance will be updated once approved</li>
          </ol>
        </div>

        {/* Network Selection */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Select Network</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setNetwork('mtn')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition border-2 ${
                network === 'mtn' ? 'border-yellow-400 bg-yellow-50 text-yellow-800' : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              <div className="text-lg mb-0.5">📲</div>
              MTN Mobile Money
            </button>
            <button
              onClick={() => setNetwork('airtel')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition border-2 ${
                network === 'airtel' ? 'border-red-400 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              <div className="text-lg mb-0.5">📲</div>
              Airtel Money
            </button>
          </div>
        </div>

        {/* Deposit Target */}
        <div className={`rounded-xl p-4 shadow ${network === 'mtn' ? 'bg-yellow-400' : 'bg-red-500'}`}>
          <div className="text-white text-xs font-medium mb-1">Send payment to:</div>
          <div className="text-white font-bold text-2xl tracking-wider">{depositTarget.number}</div>
          <div className="text-white/90 text-sm">{depositTarget.name}</div>
          <div className="text-white/70 text-xs mt-1">{depositTarget.label}</div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Recharge Details</h2>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Amount (UGX)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">UGX</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Min ${fmt(MIN_DEPOSIT)}`}
                className="w-full border rounded-lg pl-14 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Sender Phone Number</label>
            <input
              type="tel"
              value={senderPhone}
              onChange={e => setSenderPhone(e.target.value)}
              placeholder="Phone number used to send"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Sender Name</label>
            <input
              type="text"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              placeholder="Name on the mobile money account"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Transaction Reference (optional)</label>
            <input
              type="text"
              value={proof}
              onChange={e => setProof(e.target.value)}
              placeholder="Transaction ID or proof"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
          >
            {submitting ? 'Submitting...' : 'Submit Recharge'}
          </button>
        </div>

        {/* History */}
        {!loading && recharges.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Recharge History</h2>
            <div className="space-y-3">
              {recharges.slice(0, 10).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{fmt(r.amount)}</div>
                    <div className="text-xs text-gray-500 uppercase">{r.network} · {r.senderPhone}</div>
                    <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    r.status === 'approved' ? 'bg-green-100 text-green-700'
                    : r.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RechargePage;
