import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getUserByPhone, getUserByReferralCode, createUser, setCurrentUser } from '@/lib/storage';
import { REGISTRATION_BONUS } from '@/constants/packages';

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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

  const handleRegister = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!phone.trim()) { toast.error('Please enter your phone number'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);

    // Check phone already exists
    const existing = await getUserByPhone(phone.trim());
    if (existing) {
      toast.error('Phone number already registered. Please login.');
      setLoading(false);
      return;
    }

    // Resolve referrer
    let referredBy: string | null = null;
    if (referralCode.trim()) {
      const referrer = await getUserByReferralCode(referralCode.trim().toUpperCase());
      if (referrer) {
        referredBy = referrer.id;
      } else {
        toast.error('Invalid referral code. Please check and try again.');
        setLoading(false);
        return;
      }
    }

    const newUser = await createUser({
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      password,
      referralCode: generateReferralCode(),
      referredBy,
      balance: REGISTRATION_BONUS,
      totalEarnings: REGISTRATION_BONUS,
      totalWithdrawal: 0,
      referralEarnings: 0,
      dailyEarnings: 0,
      registrationBonus: REGISTRATION_BONUS,
      lastCheckIn: null,
      claimedMissions: [],
      frozen: false,
    });

    if (!newUser) {
      toast.error('Registration failed. Please try again.');
      setLoading(false);
      return;
    }

    setCurrentUser(newUser);
    toast.success(`Welcome, ${newUser.name}! You received UGX ${REGISTRATION_BONUS.toLocaleString()} bonus!`);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm">
            <span className="text-4xl">📱</span>
          </div>
          <h1 className="text-white font-black text-2xl">Samsung Earnings</h1>
          <p className="text-blue-200 text-sm mt-1">Create your account</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 0701234567"
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Referral Code (optional)</label>
            <input
              type="text"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Enter referral code"
              className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Bonus Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-amber-800 font-bold text-sm">Registration Bonus</p>
              <p className="text-amber-600 text-xs">Get UGX {REGISTRATION_BONUS.toLocaleString()} on sign up!</p>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-xl text-sm transition-all active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>

          <div className="text-center pt-2">
            <span className="text-gray-500 text-sm">Already have an account? </span>
            <Link to="/login" className="text-blue-600 font-semibold text-sm hover:underline">Login</Link>
          </div>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          By registering, you agree to our terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default Register;
