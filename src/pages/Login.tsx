import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getUserByPhone, setCurrentUser } from '@/lib/storage';

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      toast.error('Please enter your phone number and password');
      return;
    }

    setLoading(true);
    const user = await getUserByPhone(phone.trim());

    if (!user) {
      toast.error('Account not found. Please register first.');
      setLoading(false);
      return;
    }

    if (user.password !== password) {
      toast.error('Incorrect password. Please try again.');
      setLoading(false);
      return;
    }

    setCurrentUser(user);
    toast.success(`Welcome back, ${user.name}!`);
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0a0f2e 0%, #1d4ed8 60%, #3b82f6 100%)' }}>
      {/* Top decorative area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-4">
        <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-4 shadow-xl">
          <span className="text-4xl">📱</span>
        </div>
        <h1 className="text-white font-black text-3xl tracking-tight">Samsung Earnings</h1>
        <p className="text-blue-200 text-sm mt-1">Investment Platform Uganda</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-t-3xl shadow-2xl px-6 pt-8 pb-10">
        <h2 className="text-gray-800 font-bold text-xl mb-1">Sign In</h2>
        <p className="text-gray-400 text-sm mb-6">Welcome back! Enter your credentials.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Phone Number</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📞</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0780123456"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Register link */}
        <div className="mt-6 text-center">
          <span className="text-gray-400 text-sm">Don't have an account? </span>
          <Link to="/register" className="text-blue-600 font-semibold text-sm hover:underline">
            Register Now
          </Link>
        </div>

        {/* Admin link (hidden — flower icon only) */}
        <div className="mt-4 flex justify-center">
          <Link
            to="/admin"
            className="text-gray-200 text-xs hover:text-gray-400 transition select-none"
            aria-label="Admin"
          >
            🌸
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
