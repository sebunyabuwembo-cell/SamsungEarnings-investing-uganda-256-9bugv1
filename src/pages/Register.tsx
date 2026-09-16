import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Flower } from 'lucide-react';
import {
  createUser, getUserByPhone, getUserByReferralCode, setCurrentUser, addNotification
} from '@/lib/storage';
import { generateId, generateReferralCode } from '@/lib/utils';
import { REGISTRATION_BONUS } from '@/constants/packages';
import { User } from '@/types';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  const handleRegister = async () => {
    if (!name.trim()) { toast.error('Please enter your full name'); return; }
    if (!phone.trim() || phone.length < 9) { toast.error('Please enter a valid phone number'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setSubmitting(true);

    // Check if phone already registered
    const existing = await getUserByPhone(phone.trim());
    if (existing) {
      toast.error('This phone number is already registered');
      setSubmitting(false);
      return;
    }

    // Resolve referrer
    let referredBy: string | null = null;
    if (referralCode.trim()) {
      const referrer = await getUserByReferralCode(referralCode.trim());
      if (referrer) {
        referredBy = referrer.id;
      } else {
        toast.warning('Referral code not found — registering without referral');
      }
    }

    const newUser: User = {
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
      password,
      balance: REGISTRATION_BONUS,
      totalEarnings: REGISTRATION_BONUS,
      dailyEarnings: 0,
      referralEarnings: 0,
      totalWithdrawal: 0,
      referralCode: generateReferralCode(),
      referredBy,
      frozen: false,
      claimedMissions: [],
      lastCheckIn: null,
      registrationBonus: REGISTRATION_BONUS,
      createdAt: new Date().toISOString(),
    };

    await createUser(newUser);
    setCurrentUser(newUser);

    await addNotification({
      userId: newUser.id,
      type: 'package_approved',
      title: 'Welcome to Samsung Earnings! 🎉',
      message: `Your account is active with a UGX ${REGISTRATION_BONUS.toLocaleString()} registration bonus. Start earning today!`,
      isRead: false,
    });

    toast.success('Registration successful! Welcome aboard!');
    navigate('/home');
    setSubmitting(false);
  };

  return (
    <div className="app-container min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="relative px-4 pt-10 pb-8 text-center" style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}>
        <Link to="/admin" className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center bg-white/10">
          <Flower className="w-5 h-5 text-white/50" />
        </Link>
        <div className="text-4xl mb-2">📱</div>
        <h1 className="text-white font-bold text-2xl">Samsung Earnings</h1>
        <p className="text-blue-200 text-sm mt-1">Create your account</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-6 space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <div className="text-green-700 font-bold text-sm">🎁 Registration Bonus</div>
          <div className="text-green-600 text-xs mt-1">Get UGX {REGISTRATION_BONUS.toLocaleString()} instantly on sign-up!</div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none bg-white text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0712345678"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none bg-white text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-800 outline-none bg-white text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-800 outline-none bg-white text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Referral Code <span className="text-gray-400 font-normal">(Optional)</span></label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="Enter referral code"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none bg-white text-sm uppercase tracking-wider"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={submitting}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-60 mt-2"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
        >
          {submitting ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
