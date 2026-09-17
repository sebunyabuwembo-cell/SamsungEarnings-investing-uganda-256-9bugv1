
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, getUserWallets, saveWallet } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { Wallet as WalletType } from '@/types';
import { supabase } from '@/lib/supabase';
import { BRAND } from '@/constants/brand';

const WalletPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [walletType, setWalletType] = useState<'mtn' | 'airtel'>('mtn');
  const [walletPhone, setWalletPhone] = useState('');
  const [walletName, setWalletName] = useState('');

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);
    getUserWallets(u.id).then(setWallets);
  }, [navigate]);

  const handleAdd = async () => {
    if (!walletPhone ||!walletName) { toast.error('Please fill all fields'); return; }
    if (walletPhone.length < 10) { toast.error('Enter valid number'); return; }
    const newWallet: WalletType = { id: generateId(), userId: user.id, type: walletType, phone: walletPhone, name: walletName, createdAt: new Date().toISOString() };
    await saveWallet(newWallet);
    setWallets((prev) => [...prev, newWallet]);
    setWalletPhone(''); setWalletName(''); setShowAdd(false);
    toast.success(`${BRAND.short} wallet added!`);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('samsung_wallets').delete().eq('id', id);
    setWallets((prev) => prev.filter((w) => w.id!== id));
    toast.success('Wallet removed');
  };

  return (
    <div className="app-container min-h-screen bg-[#f8faf8]">
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b sticky top-0 z-10">
        <div className="flex items-center"><button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft className="w-6 h-6" /></button><h1 className="font-bold text-lg">{BRAND.short} Wallets</h1></div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-white px-4 py-2 rounded-xl text-sm font-bold" style={{background: BRAND.color}}><Plus className="w-4 h-4" /> Add</button>
      </div>
      <div className="px-4 py-5">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-4"><ShieldCheck className="w-4 h-4 text-emerald-600" /><span className="text-emerald-700 text-xs font-medium">{BRAND.name} withdrawals only to verified wallets</span></div>
        {wallets.length === 0? (
          <div className="text-center py-16"><div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-3xl">💳</div><div className="font-bold">No wallets yet</div><div className="text-gray-400 text-sm mt-1">Add MTN or Airtel to withdraw {BRAND.short} profits</div><button onClick={() => setShowAdd(true)} className="mt-5 text-white px-8 py-3 rounded-xl text-sm font-bold" style={{background: BRAND.color}}>Add Wallet</button></div>
        ) : (
          <div className="space-y-3">{wallets.map((w) => (<div key={w.id} className="bg-white rounded-2xl p-4 flex items-center border"><div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 font-bold text-white ${w.type==='mtn'?'bg-yellow-500':'bg-red-500'}`}>{w.type==='mtn'?'M':'A'}</div><div className="flex-1"><div className="font-bold text-sm">{w.name}</div><div className="text-gray-600 text-xs">{w.phone}</div><div className="text-xs" style={{color: BRAND.color}}>{w.type==='mtn'?'MTN MoMo':'Airtel Money'}</div></div><button onClick={() => handleDelete(w.id)} className="text-red-400 p-2"><Trash2 className="w-5 h-5" /></button></div>))}</div>
        )}
      </div>
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={()=>setShowAdd(false)}><div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl px-5 py-6" onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-5"><h3 className="font-bold">Add {BRAND.short} Wallet</h3><button onClick={() => setShowAdd(false)} className="w-8 h-8 bg-gray-100 rounded-full">✕</button></div><div className="space-y-4"><div className="grid grid-cols-2 gap-3">{(['mtn','airtel'] as const).map((n)=>(<button key={n} onClick={()=>setWalletType(n)} className={`py-3.5 rounded-xl border-2 font-bold text-sm ${walletType===n?'bg-emerald-50':''}`} style={{borderColor: walletType===n? BRAND.color:'#e5e7eb', color: walletType===n? BRAND.color:''}}>{n==='mtn'?'MTN MoMo':'Airtel Money'}</button>))}</div><input type="text" value={walletName} onChange={(e)=>setWalletName(e.target.value)} placeholder="Account name" className="w-full border rounded-xl px-4 py-3.5 text-sm" /><input type="tel" value={walletPhone} onChange={(e)=>setWalletPhone(e.target.value)} placeholder="07XXXXXXXX" className="w-full border rounded-xl px-4 py-3.5 text-sm" /><button onClick={handleAdd} className="w-full py-4 rounded-xl text-white font-bold text-sm" style={{background: BRAND.gradient}}>Add to {BRAND.short}</button></div></div></div>
      )}
    </div>
  );
};
export default WalletPage;
