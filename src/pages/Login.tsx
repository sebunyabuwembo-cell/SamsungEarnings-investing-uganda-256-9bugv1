import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getUserByPhone } from '@/lib/storage';

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Please enter phone and password');
      return;
    }
    setLoading(true);
    try {
      const user = await getUserByPhone(phone);
      if (!user) {
        toast.error('Account not found');
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
      localStorage.setItem('samsung_user_id', user.id);
      toast.success('Login successful!');
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-blue-800 font-bold text-2xl">S</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Samsung Earnings</h1>
          <p className="text-blue-200 text-sm mt-1">Uganda Investment Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-gray-800 text-xl font-semibold mb-5 text-center">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0756123456"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-700 font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>

        {/* Admin link */}
        <div className="text-center mt-4">
          <Link to="/admin" className="text-blue-200 text-xs hover:text-white">
            🌸 Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
