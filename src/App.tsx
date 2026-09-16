import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
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
import AdminDashboard from '@/pages/AdminDashboard';
import AdminLogin from '@/pages/AdminLogin';
import NotFound from '@/pages/NotFound';
import MigrationBanner from '@/components/features/MigrationBanner';

const App = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <MigrationBanner />
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/product" element={<Product />} />
        <Route path="/recharge" element={<Recharge />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/my-product" element={<MyProduct />} />
        <Route path="/records" element={<Records />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/mission-center" element={<MissionCenter />} />
        <Route path="/mine" element={<Mine />} />
        <Route path="/team" element={<Team />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/regulation" element={<Regulation />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
