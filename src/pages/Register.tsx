import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { createUser, getUserByPhone, getUserByReferralCode, setCurrentUser, addNotification, getUserById } from '@/lib/storage';
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
    if (password!== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const existing = await getUserByPhone(phone.trim());
      if (existing) {
        toast.error('Phone number already registered');
        setLoading(false);
        return;
      }

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

      const userId = crypto.randomUUID();
      const myReferralCode = generateReferralCode();

      // FIXED to match storage.ts User type
      await createUser({
        id: userId,
        phone: phone.trim(),
        password: password,
        name: name.trim(),
        referralCode: myReferralCode,
        referredBy: referredById,
        balance: REGISTRATION_BONUS,
        totalEarnings: 0,
        totalWithdrawal: 0,
        referralEarnings: 0,
        dailyEarnings: 0,
        registrationBonus: REGISTRATION_BONUS,
        lastCheckIn: null,
        createdAt: new Date().toISOString(),
        frozen: false,
        claimedMissions: [],
      } as any);

      const newUser = await getUserById(userId);
      if (!newUser) throw new Error('User created but not found');

      await addNotification({
        userId: newUser.id,
        type: 'system',
        title: 'Welcome Bonus',
        message: `Welcome to Samsung Earnings! You have received UGX ${REGISTRATION_BONUS.toLocaleString()} registration bonus.`,
        isRead: false,
      });

      setCurrentUser(newUser);
      toast.success(`Account created! Welcome bonus: UGX ${REGISTRATION_BONUS.toLocaleString()}`);
      navigate('/home');

    } catch (err: any) {
      console.error('Registration error:', err);
      // Show REAL supabase error
      toast.error(`Registration failed: ${err?.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-600 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg">
            <span className="text-purple-700 font-bold text-2xl">SE</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Samsung Earnings</h1>
          <p className="text-purple-200 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-gray-800 text-xl font-semibold mb-5 text-center">Register</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0771234567" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Referral Code <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={refCode} onChange={e => setRefCode(e.target.value)} placeholder="Enter referral code" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm uppercase" />
            </div>
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-green-700 text-sm font-medium">🎁 Get UGX {REGISTRATION_BONUS.toLocaleString()} welcome bonus on registration!</p>
          </div>

          <button onClick={handleRegister} disabled={loading} className="mt-5 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 rounded-lg transition-colors text-sm">
            {loading? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 font-medium hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
