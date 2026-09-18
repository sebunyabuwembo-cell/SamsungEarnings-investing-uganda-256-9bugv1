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
    if (!phone.trim()) { toast.error('Please enter your phone number'); return; }
    if (!password.trim()) { toast.error('Please enter your password'); return; }

    setLoading(true);
    try {
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
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex flex-col items-center justify-center px-4">
      {/* Admin flower icon - top left */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => navigate('/admin')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
          title="Admin Panel"
        >
          <span className="text-xl">🌸</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg">
            <span className="text-blue-700 font-bold text-2xl">SE</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Samsung Earnings</h1>
          <p className="text-blue-200 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-gray-800 text-xl font-semibold mb-5 text-center">Login</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0771234567"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Signing In...' : 'Login'}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
