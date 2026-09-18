import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { createUser, getUserByPhone, getUserByReferralCode, setCurrentUser, addNotification } from '@/lib/storage';
import { REGISTRATION_BONUS } from '@/constants/packages';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setRefCode(ref);
  }, [searchParams]);

  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleRegister = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!phone.trim()) { toast.error('Please enter your phone number'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const existing = await getUserByPhone(phone.trim());
      if (existing) {
        toast.error('Phone number already registered');
        setLoading(false);
        return;
      }

      let referredById: string | undefined;
      if (refCode.trim()) {
        const referrer = await getUserByReferralCode(refCode.trim().toUpperCase());
        if (referrer) {
          referredById = referrer.id;
        } else {
          toast.error('Invalid referral code');
          setLoading(false);
          return;
        }
      }

      const newUser = await createUser({
        name: name.trim(),
        phone: phone.trim(),
        password,
        balance: REGISTRATION_BONUS,
        total_earnings: 0,
        daily_earnings: 0,
        referral_earnings: 0,
        total_withdrawal: 0,
        referral_code: generateReferralCode(),
        referred_by: referredById,
        frozen: false,
        claimed_missions: [],
        registration_bonus: REGISTRATION_BONUS,
      });

      if (newUser) {
        await addNotification(newUser.id, 'system', 'Welcome Bonus', `Welcome to Samsung Earnings! You have received UGX ${REGISTRATION_BONUS.toLocaleString()} registration bonus.`);
        setCurrentUser(newUser);
        toast.success(`Account created! Welcome bonus: UGX ${REGISTRATION_BONUS.toLocaleString()}`);
        navigate('/home');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg">
            <span className="text-blue-700 font-bold text-2xl">SE</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Samsung Earnings</h1>
          <p className="text-blue-200 text-sm mt-1">Create your account</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-gray-800 text-xl font-semibold mb-5 text-center">Register</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0771234567"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">
                Referral Code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={refCode}
                onChange={e => setRefCode(e.target.value)}
                placeholder="Enter referral code"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm uppercase"
              />
            </div>
          </div>

          {/* Bonus banner */}
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-green-700 text-sm font-medium">
              🎁 Get UGX {REGISTRATION_BONUS.toLocaleString()} welcome bonus on registration!
            </p>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
