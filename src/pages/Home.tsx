import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, Copy, Users, Package, TrendingUp, Gift } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import {
  getCurrentUser, refreshCurrentUser, getUserNotifications,
  markNotificationRead,
} from '@/lib/storage';
import { formatUGX, formatDateTime } from '@/lib/utils';
import { User, Notification } from '@/types';
import { REGISTRATION_BONUS } from '@/constants/packages';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const cached = getCurrentUser();
      if (!cached) { navigate('/login'); return; }
      setUser(cached);
      const [fresh, notifs] = await Promise.all([
        refreshCurrentUser(),
        getUserNotifications(cached.id),
      ]);
      if (fresh) setUser(fresh);
      setNotifications([...notifs].reverse());
      setLoading(false);
    };
    init();
  }, [navigate]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const copyReferralCode = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.referralCode);
    toast.success('Referral code copied!');
  };

  const getReferralLink = () => {
    if (!user) return '';
    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    return `${window.location.origin}${base}/register?ref=${user.referralCode}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(getReferralLink());
    toast.success('Referral link copied!');
  };

  if (!user) return null;

  return (
    <AppLayout>
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white/70 text-sm">Welcome back,</div>
            <div className="text-white font-bold text-lg">{user.name}</div>
          </div>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 bg-white/10 rounded-full"
          >
            <Bell className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-white/10 rounded-2xl p-4 mb-3">
          <div className="text-white/70 text-xs mb-1">Account Balance</div>
          <div className="text-white font-black text-3xl">{formatUGX(user.balance)}</div>
          <div className="flex gap-4 mt-2">
            <div>
              <div className="text-white/60 text-xs">Total Earnings</div>
              <div className="text-white font-semibold text-sm">{formatUGX(user.totalEarnings)}</div>
            </div>
            <div>
              <div className="text-white/60 text-xs">Withdrawn</div>
              <div className="text-white font-semibold text-sm">{formatUGX(user.totalWithdrawal)}</div>
            </div>
          </div>
        </div>

        {/* Referral Banner */}
        <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-amber-200 text-xs">Your Referral Code</div>
            <div className="text-amber-300 font-black text-xl tracking-widest">{user.referralCode}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyReferralCode}
              className="bg-amber-400 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Code
            </button>
            <button
              onClick={() => navigate('/team')}
              className="bg-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
            >
              <Users className="w-3 h-3" /> Team
            </button>
          </div>
        </div>
      </div>

      {/* Frozen Banner */}
      {user.frozen && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-300 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔒</span>
            <span className="text-red-700 font-bold text-sm">Account Frozen</span>
          </div>
          <p className="text-red-600 text-xs">Your account is frozen. Withdrawals and purchases are disabled. Contact support to resolve this.</p>
          <a
            href="https://t.me/+adk1usHyKF4yYzQ0"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Contact Support
          </a>
        </div>
      )}

      {/* Notification Drawer */}
      {showNotifications && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800">Notifications</span>
            <button onClick={() => setShowNotifications(false)} className="text-blue-600 text-xs">Close</button>
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No notifications yet</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`w-full px-4 py-3 border-b border-gray-50 text-left ${!n.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-gray-800 text-sm font-medium">{n.title}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{n.message}</div>
                      <div className="text-gray-300 text-xs mt-1">{formatDateTime(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow p-4">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '💰', label: 'Recharge', path: '/recharge', color: 'bg-blue-50' },
            { icon: '💸', label: 'Withdraw', path: '/withdraw', color: 'bg-green-50' },
            { icon: '📦', label: 'Products', path: '/product', color: 'bg-purple-50' },
            { icon: '📋', label: 'Records', path: '/records', color: 'bg-amber-50' },
          ].map(({ icon, label, path, color }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`${color} flex flex-col items-center py-3 rounded-xl`}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs text-gray-600 font-medium mt-1">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-4 text-white">
          <TrendingUp className="w-5 h-5 mb-1 opacity-80" />
          <div className="text-white/80 text-xs">Daily Earnings</div>
          <div className="font-bold text-lg">{formatUGX(user.dailyEarnings)}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-4 text-white">
          <Gift className="w-5 h-5 mb-1 opacity-80" />
          <div className="text-white/80 text-xs">Referral Earnings</div>
          <div className="font-bold text-lg">{formatUGX(user.referralEarnings)}</div>
        </div>
      </div>

      {/* Share Referral Link */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-700 text-sm">Invite & Earn</h2>
          <span className="text-xs text-green-600 font-semibold">30% commission</span>
        </div>
        <p className="text-gray-500 text-xs mb-3">Share your link and earn commission from your team's daily income.</p>
        <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono truncate mb-2">
          {getReferralLink()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyReferralLink}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Link
          </button>
          <button
            onClick={() => {
              const text = `Join Eagle Investment and earn daily income! Use my referral link: ${getReferralLink()}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <span>WhatsApp</span>
          </button>
          <button
            onClick={() => {
              const text = `Join Eagle Investment and earn daily income! Use my referral link: ${getReferralLink()}`;
              window.open(`https://t.me/share/url?url=${encodeURIComponent(getReferralLink())}&text=${encodeURIComponent('Join Eagle Investment and earn daily income!')}`, '_blank');
            }}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <span>Telegram</span>
          </button>
        </div>
      </div>

      {/* Navigation to Mine */}
      <div className="mx-4 mt-3 mb-4">
        <button
          onClick={() => navigate('/mine')}
          className="w-full bg-white rounded-2xl shadow p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 text-sm">{user.name}</div>
              <div className="text-gray-400 text-xs">{user.phone}</div>
            </div>
          </div>
          <Package className="w-5 h-5 text-gray-300" />
        </button>
      </div>
    </AppLayout>
  );
};

export default Home;
