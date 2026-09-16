import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
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

function App() {
  const isLoggedIn = () => {
    try {
      const user = localStorage.getItem('currentUser');
      return user !== null;
    } catch {
      return false;
    }
  };

  const isAdminLoggedIn = () => {
    try {
      return localStorage.getItem('adminLoggedIn') === 'true';
    } catch {
      return false;
    }
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <MigrationBanner />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={isAdminLoggedIn() ? <AdminDashboard /> : <Navigate to="/admin" replace />}
        />

        {/* Protected user routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/product" element={<Product />} />
        <Route path="/recharge" element={<Recharge />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/my-product" element={<MyProduct />} />
        <Route path="/records" element={<Records />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/mission" element={<MissionCenter />} />
        <Route path="/mine" element={<Mine />} />
        <Route path="/team" element={<Team />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/regulation" element={<Regulation />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
