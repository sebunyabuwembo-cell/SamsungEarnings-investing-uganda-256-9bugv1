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
    if (user.frozen) {
      toast.error('Your account has been frozen. Please contact support.');
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    toast.success(`Welcome back, ${user.name}!`);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-blue-800 font-bold text-2xl">EI</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Engle Investments</h1>
          <p className="text-blue-200 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Admin shortcut */}
        <div className="flex justify-start mb-3">
          <Link
            to="/admin"
            className="w-9 h-9 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-lg hover:bg-white/20 transition"
            title="Admin Login"
          >
            🌸
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-gray-800 text-xl font-semibold mb-6 text-center">Login</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0700000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          Engle Investments Platform — Uganda
        </p>
      </div>
    </div>
  );
};

export default Login;
