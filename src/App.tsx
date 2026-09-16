import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { getCurrentUser, getAdminSession } from '@/lib/storage';
import MigrationBanner from '@/components/features/MigrationBanner';

import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import Product from '@/pages/Product';
import Recharge from '@/pages/Recharge';
import Withdraw from '@/pages/Withdraw';
import Wallet from '@/pages/Wallet';
import MyProduct from '@/pages/MyProduct';
import Records from '@/pages/Records';
import ChangePassword from '@/pages/ChangePassword';
import MissionCenter from '@/pages/MissionCenter';
import Mine from '@/pages/Mine';
import Team from '@/pages/Team';
import AboutUs from '@/pages/AboutUs';
import Regulation from '@/pages/Regulation';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import NotFound from '@/pages/NotFound';

const RequireUser = ({ children }: { children: React.ReactNode }) => {
  const user = getCurrentUser();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const session = getAdminSession();
  return session ? <>{children}</> : <Navigate to="/admin" replace />;
};

const App = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <MigrationBanner />
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        {/* User (protected) */}
        <Route path="/home" element={<RequireUser><Home /></RequireUser>} />
        <Route path="/product" element={<RequireUser><Product /></RequireUser>} />
        <Route path="/recharge" element={<RequireUser><Recharge /></RequireUser>} />
        <Route path="/withdraw" element={<RequireUser><Withdraw /></RequireUser>} />
        <Route path="/wallet" element={<RequireUser><Wallet /></RequireUser>} />
        <Route path="/my-product" element={<RequireUser><MyProduct /></RequireUser>} />
        <Route path="/records" element={<RequireUser><Records /></RequireUser>} />
        <Route path="/change-password" element={<RequireUser><ChangePassword /></RequireUser>} />
        <Route path="/mission" element={<RequireUser><MissionCenter /></RequireUser>} />
        <Route path="/mine" element={<RequireUser><Mine /></RequireUser>} />
        <Route path="/team" element={<RequireUser><Team /></RequireUser>} />
        <Route path="/about" element={<RequireUser><AboutUs /></RequireUser>} />
        <Route path="/regulation" element={<RequireUser><Regulation /></RequireUser>} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
