import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { createUser, getUserByPhone, getUserByReferralCode, setCurrentUser, addNotification } from '@/lib/storage';
import { User } from '@/types';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  const generateReferralCode = (phone: string) =>
    'SAM' + phone.slice(-4).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name');
    if (!phone.trim()) return toast.error('Please enter your phone number');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const existing = await getUserByPhone(phone.trim());
      if (existing) {
        toast.error('Phone number already registered');
        setLoading(false);
        return;
      }

      let referrerId: string | null = null;
      if (referralCode.trim()) {
        const referrer = await getUserByReferralCode(referralCode.trim());
        if (referrer) {
          referrerId = referrer.id;
        } else {
          toast.error('Invalid referral code');
          setLoading(false);
          return;
        }
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        name: name.trim(),
        phone: phone.trim(),
        password,
        balance: 7000,
        totalEarnings: 0,
        dailyEarnings: 0,
        referralEarnings: 0,
        totalWithdrawal: 0,
        referralCode: generateReferralCode(phone.trim()),
        referredBy: referrerId,
        frozen: false,
        claimedMissions: [],
        lastCheckIn: null,
        registrationBonus: 7000,
        createdAt: new Date().toISOString(),
      };

      await createUser(newUser);
      setCurrentUser(newUser);

      await addNotification({
        userId: newUser.id,
        type: 'welcome',
        title: 'Welcome to Samsung Earnings!',
        message: `Welcome ${newUser.name}! Your account has been created with a bonus of UGX 7,000. Start by recharging and buying a package to earn daily income.`,
        isRead: false,
      });

      toast.success('Account created successfully!');
      navigate('/home');
    } catch (err) {
      console.error('Register error:', err);
      toast.error('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-blue-700">S</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Samsung Earnings</h1>
          <p className="text-blue-200 mt-1">Create your investment account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Register</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0701234567"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 uppercase"
              />
            </div>

            {/* Bonus Banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <span className="text-green-600 text-lg">🎁</span>
              <p className="text-green-700 text-sm font-medium">Get UGX 7,000 registration bonus on sign up!</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-md"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
