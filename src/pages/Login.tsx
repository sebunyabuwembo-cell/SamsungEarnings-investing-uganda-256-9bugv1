import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getUserByPhone, setCurrentUser } from '@/lib/storage';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const user = await getUserByPhone(phone.trim());
      if (!user) {
        toast({ title: "Login Failed", description: "Number not registered. Please register first.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (user.password !== password) {
        toast({ title: "Login Failed", description: "Wrong password", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (user.frozen) {
        toast({ title: "Account Frozen", description: "Your account is frozen. Contact support.", variant: "destructive" });
        setLoading(false);
        return;
      }
      // FIXED: save FULL user object, not just ID
      setCurrentUser(user);
      toast({ title: "Success", description: "Welcome back!" });
      navigate('/home');
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Login failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600 p-4">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-blue-700">E</div>
        <h1 className="text-3xl font-bold text-white">Eagle Investment</h1>
        <p className="text-blue-200">Sign in to your account</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="e.g. 0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Don't have an account? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register</Link>
          </div>
        </CardContent>
      </Card>
      <p className="text-blue-200 text-xs mt-6">Eagle Investment Platform © 2024</p>
    </div>
  );
};

export default Login;
