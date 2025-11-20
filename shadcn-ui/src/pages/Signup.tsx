import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    voterId: '',
  });
  const [voterValid, setVoterValid] = useState<boolean | null>(null);
  const [checkingVoterId, setCheckingVoterId] = useState(false);

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateVoterId = (voterId: string): boolean => {
    const voterIdPattern = /^[A-Z]{3}[0-9]{7}$/;
    return voterIdPattern.test(voterId);
  };

  const checkVoterId = async (raw: string): Promise<boolean> => {
    const voterId = (raw || '').trim().toUpperCase(); // normalize
    // Local format check first
    if (!validateVoterId(voterId)) {
      setVoterValid(false);
      return false;
    }

    setCheckingVoterId(true);
    try {
      const resp = await fetch(
        `http://localhost:8081/api/voter/validate/${encodeURIComponent(voterId)}`,
        { method: 'GET' }
      );
      if (!resp.ok) {
        toast.error('Validation service error');
        setVoterValid(false);
        return false;
      }
      const data = await resp.json();
      // Accept boolean or string "true"
      const isValid = data && (data.valid === true || data.valid === 'true');
      setVoterValid(isValid);
      if (isValid) {
        toast.success('Valid voter ID');
      } else {
        toast.error('Invalid voter ID');
      }
      return isValid;
    } catch (err) {
      toast.error('Failed to validate voter ID');
      setVoterValid(false);
      return false;
    } finally {
      setCheckingVoterId(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const valid =
      voterValid === true ? true : await checkVoterId(formData.voterId);
    if (!valid) {
      toast.error('Invalid voter ID');
      return;
    }

    const success = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      dob: formData.dob,
      voterId: (formData.voterId || '').trim().toUpperCase(), // store normalized
    });
    if (success) {
      toast.success('Signup successful!');
      navigate('/dashboard');
    } else {
      toast.error('Signup failed, email may already be registered');
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
              Sign Up
            </CardTitle>
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
          <CardDescription>Create your account to start voting</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voterId">Voter ID</Label>
              <Input
                id="voterId"
                placeholder="ABC1234567"
                value={formData.voterId}
                onChange={(e) =>
                  setFormData({ ...formData, voterId: e.target.value.toUpperCase() })
                }
                onBlur={() => checkVoterId(formData.voterId)} // will trim+uppercase inside
                required
                maxLength={10}
              />
              {checkingVoterId && (
                <p className="text-xs text-blue-600">Checking voter ID…</p>
              )}
              {voterValid === true && (
                <p className="text-xs text-green-600">Valid voter ID</p>
              )}
              {voterValid === false && (
                <p className="text-xs text-red-600">Invalid voter ID</p>
              )}
              <p className="text-xs text-muted-foreground">Format: 3 letters + 7 digits (e.g., ABC1234567)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Sign Up
            </Button>

            <div className="text-center space-y-2">
              <Link to="/login">
                <Button variant="link" className="text-sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Already have an account? Login
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}