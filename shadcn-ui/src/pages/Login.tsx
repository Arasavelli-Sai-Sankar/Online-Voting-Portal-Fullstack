import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, Shield } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { loginStart, loginVerify } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = await loginStart(email, password);
    if (id) {
      setChallengeId(id);
      const newOtp = ''; // OTP will be sent via email by backend
      setGeneratedOTP(newOtp);
      setShowOTP(true);
      toast.success('OTP sent to your email. Please verify.');
    } else {
      toast.error('Invalid credentials or failed to start login');
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) {
      toast.error('Missing challenge. Please login again.');
      return;
    }
    const ok = await loginVerify(challengeId, otp);
    if (ok) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error('Invalid or expired OTP. Please try again.');
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
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {showOTP ? 'Verify OTP' : 'Login'}
            </CardTitle>
            {showOTP ? <Shield className="h-8 w-8 text-blue-600" /> : <LogIn className="h-8 w-8 text-blue-600" />}
          </div>
          <CardDescription>
            {showOTP ? 'Enter the 6-digit OTP sent to your email' : 'Enter your credentials to access your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showOTP ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password">
                  <Button variant="link" className="text-sm px-0">
                    Forgot password?
                  </Button>
                </Link>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Continue
              </Button>

              <div className="text-center space-y-2">
                <Link to="/signup">
                  <Button variant="link" className="text-sm">
                    Don't have an account? Sign up
                  </Button>
                </Link>
                <div className="pt-4 border-t">
                  <Link to="/admin/login">
                    <Button variant="outline" className="w-full">
                      Admin Login
                    </Button>
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOTPVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Verify & Login
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowOTP(false);
                  setOtp('');
                  setGeneratedOTP('');
                }}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}