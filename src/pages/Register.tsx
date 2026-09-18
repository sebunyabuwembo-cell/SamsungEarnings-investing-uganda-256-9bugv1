import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { createUser, getUserByPhone, getUserByReferralCode, setCurrentUser, addNotification } from '@/lib/storage';
import { User } from '@/types';
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Check if phone already registered
    const existing = await getUserByPhone(phone.trim());
    if (existing) {
      toast.error('This phone number is already registered');
      setLoading(false);
      return;
    }

    // Look up referrer
    let referredById: string | null = null;
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

    const newUser: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      password,
      referralCode: generateReferralCode(),
      referredBy: referredById,
      balance: REGISTRATION_BONUS,
      totalEarnings: REGISTRATION_BONUS,
      totalWithdrawal: 0,
      referralEarnings: 0,
      dailyEarnings: 0,
      registrationBonus: REGISTRATION_BONUS,
      lastCheckIn: null,
      createdAt: new Date().toISOString(),
      frozen: false,
      claimedMissions: [],
    };

    await createUser(newUser);

    // Welcome notification
    await addNotification({
      userId: newUser.id,
      type: 'info',
      title: 'Welcome to Eagle Investment!',
      message: `You have received a registration bonus of UGX ${REGISTRATION_BONUS.toLocaleString()}. Start by recharging and buying a package to earn daily income.`,
      isRead: false,
    });

    setCurrentUser(newUser);
    toast.success(`Account created! Welcome bonus: UGX ${REGISTRATION_BONUS.toLocaleString()}`);
    navigate('/home');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600 p-4">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold text-blue-700">E</div>
        <h1 className="text-3xl font-bold text-white">Eagle Investment</h1>
        <p className="text-blue-200 text-sm">Create your account and start earning</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-5">Create Account</h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 0712345678"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Referral Code (optional)</label>
            <input
              type="text"
              value={refCode}
              onChange={e => setRefCode(e.target.value.toUpperCase())}
              placeholder="Enter referral code if you have one"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            🎁 Registration bonus: <strong>UGX {REGISTRATION_BONUS.toLocaleString()}</strong> — credited immediately on sign up!
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
        </div>
      </div>

      <p className="text-blue-200 text-xs mt-6">Eagle Investment Platform © 2024</p>
    </div>
  );
};

export default Register;
