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

    if (!user) {
      toast.error('Phone number not registered');
      setLoading(false);
      return;
    }

    if (user.password !== password) {
      toast.error('Incorrect password');
      setLoading(false);
      return;
    }

    if (user.frozen) {
      toast.error('Your account has been frozen. Contact support.');
      setLoading(false);
      return;
    }

    setCurrentUser(user);
    toast.success(`Welcome back, ${user.name}!`);
    navigate('/home');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-blue-800 font-bold text-2xl">SE</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Samsung Earnings</h1>
          <p className="text-blue-200 text-sm mt-1">Sign in to your account</p>
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

          {/* Admin link */}
          <div className="mt-4 text-center">
            <Link to="/admin" className="text-gray-400 text-xs hover:text-gray-600 transition">
              🌸 Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
