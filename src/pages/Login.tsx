import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUserByPhone, setCurrentUser } from '@/lib/storage';
import { toast } from 'sonner';

const Login: React.FC = () => {
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
      const user = await getUserByPhone(phone.trim());
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
        toast.error('Your account has been frozen. Please contact support.');
        setLoading(false);
        return;
      }
      await setCurrentUser(user.id);
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
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-700" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Samsung Earnings</h1>
          <p className="text-blue-200 mt-1">Invest & Earn Daily</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0712345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200 mt-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/change-password"
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-blue-200 text-sm mt-6">
          © 2024 Samsung Earnings Uganda
        </p>
      </div>
    </div>
  );
};

export default Login;
