import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getUserByPhone, setCurrentUser } from '@/lib/storage';

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      toast.error('Please enter your phone number and password');
      return;
    }
    setLoading(true);
    const user = await getUserByPhone(phone.trim());
    if (!user || user.password !== password) {
      toast.error('Invalid phone number or password');
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    toast.success(`Welcome back, ${user.name}!`);
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 to-blue-700">
      {/* Logo area */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-4xl">📱</span>
        </div>
        <h1 className="text-white font-black text-2xl tracking-wide">Samsung Earnings</h1>
        <p className="text-blue-200 text-sm mt-1">Uganda Investment Platform</p>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 py-8">
        <h2 className="text-gray-800 font-bold text-xl mb-1">Welcome Back</h2>
        <p className="text-gray-500 text-sm mb-6">Sign in to your account</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 0701234567"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <span className="text-gray-500 text-sm">Don&apos;t have an account? </span>
          <Link to="/register" className="text-blue-600 font-semibold text-sm hover:underline">
            Register
          </Link>
        </div>

        {/* Admin link */}
        <div className="mt-4 text-center">
          <Link to="/admin" className="text-gray-400 text-xs hover:text-gray-600 transition">
            🌸 Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
