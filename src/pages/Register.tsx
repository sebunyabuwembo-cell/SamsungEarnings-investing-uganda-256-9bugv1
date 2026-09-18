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

  const refFromUrl = searchParams.get('ref') || searchParams.get('code') || searchParams.get('r');

  useEffect(() => {
    if (refFromUrl) {
      setReferralCode(decodeURIComponent(refFromUrl).trim().toUpperCase());
    }
  }, [refFromUrl]);

  const generateReferralCode = (phone: string) => {
    return 'EAGLE' + phone.slice(-4) + Math.random().toString(36).substring(2, 5).toUpperCase();
  };

  const handleRegister = async () => {
    if (!name.trim() ||!phone.trim() ||!password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password!== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!/^\d{10,15}$/.test(phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.trim();
      const existing = await getUserByPhone(cleanPhone);
      if (existing) {
        toast.error('Phone number already registered');
        setLoading(false);
        return;
      }

      let referredById: string | null = null;
      if (referralCode.trim()) {
        const referrer = await getUserByReferralCode(referralCode.trim());
        if (referrer) {
          referredById = referrer.id;
        } else {
          toast.error('Invalid referral code');
          setLoading(false);
          return;
        }
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        name: name.trim(),
        phone: cleanPhone,
        password,
        balance: 7000,
        totalEarnings: 0,
        dailyEarnings: 0,
        referralEarnings: 0,
        totalWithdrawal: 0,
        referralCode: generateReferralCode(cleanPhone),
        referredBy: referredById,
        frozen: false,
        claimedMissions: [],
        lastCheckIn: null,
        registrationBonus: 7000,
        createdAt: new Date().toISOString(),
      };

      await createUser(newUser);

      await addNotification({
        userId: newUser.id,
        type: 'welcome',
        title: 'Welcome to Eagle Investment!',
        message: `Hello ${newUser.name}! Your account has been created. You received UGX 7,000 as a registration bonus. Start investing to earn daily income!`,
        isRead: false,
      });

      setCurrentUser(newUser);
      toast.success('Account created successfully!');
      navigate('/home');
    } catch (err) {
      console.error(err);
      toast.error('Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-blue-800 font-bold text-2xl">E</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Eagle Investment</h1>
          <p className="text-blue-200 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-gray-800 text-xl font-semibold mb-6 text-center">Register</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>

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
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Code {refFromUrl? <span className="text-green-600">✓ Auto-applied</span> : <span className="text-gray-400 font-normal">(optional)</span>}
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                readOnly={!!refFromUrl}
                placeholder="Enter referral code"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 ${refFromUrl? 'bg-green-50 border-green-300 font-bold' : 'border-gray-300'}`}
              />
            </div>

            {referralCode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">🎉 Referral code applied! You'll get UGX 7,000 bonus.</p>
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors mt-2"
            >
              {loading? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          By registering, you agree to our Terms & Conditions
        </p>

        {/* SECRET ADMIN FLOWER 🌺 */}
        <div className="flex justify-center mt-6">
          <Link to="/admin" className="opacity-40 hover:opacity-100 transition-opacity p-2">
            <span className="text-2xl">🌺</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
