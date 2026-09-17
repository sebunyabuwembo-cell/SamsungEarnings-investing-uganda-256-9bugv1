
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, createRecharge } from '@/lib/storage';
import { generateId, formatUGX } from '@/lib/utils';
import { MTN_NUMBER, MTN_NAME, AIRTEL_NUMBER, AIRTEL_NAME, MIN_DEPOSIT } from '@/constants/packages';
import { Recharge as RechargeType } from '@/types';
import { BRAND } from '@/constants/brand';

const Recharge = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState<'mtn' | 'airtel'>('mtn');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [proof, setProof] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { const u = getCurrentUser(); if (!u) navigate('/login'); else setUser(u); }, [navigate]);

  const targetNumber = network === 'mtn'? MTN_NUMBER : AIRTEL_NUMBER;
  const targetName = network === 'mtn'? MTN_NAME : AIRTEL_NAME;

  const handleNext = () => {
    if (!amount || parseInt(amount) < MIN_DEPOSIT) { toast.error(`Minimum deposit is ${formatUGX(MIN_DEPOSIT)}`); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!senderPhone ||!senderName ||!proof.trim()) { toast.error('Fill all fields including proof'); return; }
    setSubmitting(true);
    const recharge: RechargeType = { id: generateId(), userId: user.id, userName: user.name, userPhone: user.phone, amount: parseInt(amount), network, senderPhone, senderName, proof, status: 'pending', createdAt: new Date().toISOString(), processedAt: null };
    await createRecharge(recharge);
    toast.success(`${BRAND.short} recharge submitted! Waiting approval.`); setStep(3); setSubmitting(false);
  };

  return (
    <div className="app-container min-h-screen bg-gray-50">
      <div className="flex items-center px-4 py-4 bg-white border-b">
        <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Recharge {BRAND.short}</h1>
      </div>

      {step === 1 && (
        <div className="px-4 py-5 space-y-4">
          <div className="border rounded-2xl p-4" style={{background: `${BRAND.color}10`, borderColor: `${BRAND.color}20`}}>
            <p className="text-sm font-bold" style={{color: BRAND.color}}>📌 Minimum Deposit: UGX 15,000</p>
            <p className="text-xs mt-1 opacity-80" style={{color: BRAND.color}}>Funds credited to {BRAND.name} after admin approval.</p>
          </div>
          <div><label className="text-sm font-medium text-gray-600 mb-2 block">Amount (UGX)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Min 15,000" className="w-full border rounded-xl px-4 py-3 outline-none bg-white" /></div>
          <div><label className="text-sm font-medium text-gray-600 mb-2 block">Network</label><div className="grid grid-cols-2 gap-3">{(['mtn','airtel'] as const).map((n) => (<button key={n} onClick={() => setNetwork(n)} className={`py-3 rounded-xl border-2 font-semibold text-sm ${network===n? 'bg-emerald-50':''}`} style={{borderColor: network===n? BRAND.color:'#e5e7eb', color: network===n? BRAND.color:''}}>{n==='mtn'?'📲 MTN MoMo':'📱 Airtel Money'}</button>))}</div></div>
          <button onClick={handleNext} className="w-full py-4 rounded-xl text-white font-bold" style={{background: BRAND.gradient}}>Continue</button>
        </div>
      )}

      {step === 2 && (
        <div className="px-4 py-5 space-y-4">
          <div className="rounded-2xl p-5 text-white" style={{background: `linear-gradient(135deg, #052e16, ${BRAND.color})`}}>
            <div className="text-white/70 text-sm mb-3">Send {formatUGX(parseInt(amount))} to {BRAND.short}:</div>
            <div className="flex items-center justify-between mb-2"><div><div className="font-bold text-xl">{targetNumber}</div><div className="text-white/70 text-sm">{targetName}</div><div className="text-white/50 text-xs mt-1">{network==='mtn'?'MTN Mobile Money':'Airtel Money'}</div></div><button onClick={()=>{navigator.clipboard.writeText(targetNumber); toast.success('Number copied!');}} className="bg-white/20 rounded-xl px-3 py-2 flex items-center gap-1"><Copy className="w-4 h-4 text-white" /><span className="text-white text-xs">Copy</span></button></div>
            <div className="bg-white/10 rounded-xl p-3 mt-3"><p className="text-white/80 text-xs leading-relaxed">1. Send money to number above<br/>2. Copy M-Money SMS<br/>3. Paste below as proof<br/>4. Submit for {BRAND.short} approval</p></div>
          </div>
          <div><label className="text-sm font-medium text-gray-600 mb-2 block">Your Phone</label><input type="tel" value={senderPhone} onChange={(e)=>setSenderPhone(e.target.value)} placeholder="07XXXXXXXX" className="w-full border rounded-xl px-4 py-3 bg-white outline-none" /></div>
          <div><label className="text-sm font-medium text-gray-600 mb-2 block">Your Name</label><input type="text" value={senderName} onChange={(e)=>setSenderName(e.target.value)} placeholder="Name on account" className="w-full border rounded-xl px-4 py-3 bg-white outline-none" /></div>
          <div><label className="text-sm font-medium text-gray-600 mb-2 block">Payment Proof (SMS)</label><textarea value={proof} onChange={(e)=>setProof(e.target.value)} placeholder="Paste M-Money confirmation here..." className="w-full border rounded-xl px-4 py-3 text-sm bg-white h-24 resize-none outline-none" /></div>
          <div className="flex gap-3"><button onClick={()=>setStep(1)} className="flex-1 py-4 rounded-xl border text-gray-600 font-semibold">Back</button><button onClick={handleSubmit} disabled={submitting} className="flex-1 py-4 rounded-xl text-white font-bold disabled:opacity-60" style={{background: BRAND.gradient}}>{submitting? 'Submitting...' : 'Submit to '+BRAND.short}</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="px-4 py-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{background: `${BRAND.color}20`}}><span className="text-4xl">⏳</span></div>
          <h2 className="font-bold text-xl mb-2">Recharge Submitted!</h2>
          <p className="text-gray-500 text-sm text-center mb-6">Your recharge of <span className="font-bold" style={{color: BRAND.color}}>{formatUGX(parseInt(amount))}</span> to {BRAND.name} is pending admin approval.</p>
          <div className="w-full bg-white rounded-2xl p-5 shadow-sm mb-4 space-y-3"><div className="flex justify-between text-sm"><span className="text-gray-400">Amount</span><span className="font-bold">{formatUGX(parseInt(amount))}</span></div><div className="flex justify-between text-sm"><span className="text-gray-400">Network</span><span className="font-medium">{network==='mtn'?'📲 MTN':'📱 Airtel'}</span></div><div className="flex justify-between text-sm"><span className="text-gray-400">From</span><span className="font-medium">{senderPhone}</span></div><div className="flex justify-between text-sm"><span className="text-gray-400">Status</span><span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">⏳ Pending</span></div></div>
          <div className="w-full space-y-2"><button onClick={()=>navigate('/records')} className="w-full py-4 rounded-xl text-white font-bold" style={{background: BRAND.gradient}}>Check Status</button><button onClick={()=>navigate('/home')} className="w-full py-3 rounded-xl border text-gray-600 font-semibold text-sm">Back to Home</button></div>
        </div>
      )}
    </div>
  );
};
export default Recharge;
