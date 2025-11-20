import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await adminLogin(email, password);
    if (success) {
      toast.success('Admin login successful!');
      navigate('/admin/panel');
    } else {
      toast.error('Invalid admin credentials');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/pixelcut-export.jpeg_upscayl_4x_realesrgan-x4plus.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Admin Login
            </CardTitle>
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardDescription>Enter admin credentials to access the control panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@voting.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Demo credentials box removed */}

            <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
              Login as Admin
            </Button>

            <Link to="/login">
              <Button variant="link" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to User Login
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}