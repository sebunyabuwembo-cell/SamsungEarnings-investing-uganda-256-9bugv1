import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const FIX_DATA = [
  { id: 'pkg-s1', name: 'Engle Starter 15K', income: 600, price: 15000 },
  { id: 'pkg-s2', name: 'Engle Starter 30K', income: 1200, price: 30000 },
  { id: 'pkg-s3', name: 'Engle Starter 50K', income: 2000, price: 50000 },
  { id: 'pkg-s4', name: 'Engle Starter 100K', income: 4000, price: 100000 },
  { id: 'pkg-g1', name: 'Engle Growth 200K', income: 9000, price: 200000 },
  { id: 'pkg-g2', name: 'Engle Growth 500K', income: 22000, price: 500000 },
  { id: 'pkg-g3', name: 'Engle Growth 700K', income: 32000, price: 700000 },
  { id: 'pkg-p1', name: 'Engle Premium 1M', income: 50000, price: 1000000 },
  { id: 'pkg-p2', name: 'Engle Premium 1.3M', income: 500000, price: 1300000 },
  { id: 'pkg-p3', name: 'Engle Premium 2M', income: 700000, price: 2000000 },
  { id: 'pkg-p4', name: 'Engle Ultimate 5M', income: 250000, price: 5000000 },
];

export default function FixIncomes() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    setLoading(true);
    setLogs(['Starting Engle fix... Wait...']);
    for (const pkg of FIX_DATA) {
      const { error } = await supabase
        .from('engle_products')
        .update({ daily_income: pkg.income, package_price: pkg.price, package_name: pkg.name })
        .eq('package_id', pkg.id);
      
      if (error) {
        setLogs(p => [...p, `❌ ${pkg.name}: ${error.message}`]);
      } else {
        setLogs(p => [...p, `✅ ${pkg.name} -> ${pkg.income.toLocaleString()} UGX`]);
      }
    }
    setLogs(p => [...p, '🎉 DONE! All fixed to Engle rates! Now delete this page.']);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', background: 'white', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>Fix Engle Products</h1>
      <p style={{ marginTop: '8px', color: '#666' }}>This will fix all Engle products in DB to correct rates</p>
      <button
        onClick={handleFix}
        disabled={loading}
        style={{ marginTop: '20px', width: '100%', padding: '16px', background: '#2563eb', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}
      >
        {loading ? 'Fixing...' : '🔧 FIX NOW TO ENGLE'}
      </button>
      <div style={{ marginTop: '20px', background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
        {logs.map((l, i) => <div key={i} style={{ fontSize: '14px', marginBottom: '6px' }}>{l}</div>)}
      </div>
    </div>
  );
}
