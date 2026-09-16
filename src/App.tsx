import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
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
  const isAdminLoggedIn = () => { try { return localStorage.getItem('adminLoggedIn') === 'true'; } catch { return false; } };
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={isAdminLoggedIn() ? <AdminDashboard /> : <Navigate to="/admin" replace />} />
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
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/regulation" element={<Regulation />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </HashRouter>
  );
}
export default App;
