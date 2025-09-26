
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Lock, UserPlus, LogIn, Palette, Users, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Get role from URL parameter
  const roleFromUrl = searchParams.get('role') as 'designer' | 'client' | null;

  // Check if user is already logged in - but allow manual override
  useEffect(() => {
    // Only auto-redirect if coming from another page, not if directly visiting /auth
    if (window.location.pathname === '/auth' && !document.referrer.includes(window.location.origin)) {
      return; // Don't auto-redirect when directly visiting /auth
    }
    
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('User already logged in, redirecting...');
        // Redirect based on user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, user_type, is_admin')
          .eq('user_id', session.user.id)
          .single();
        
        // Check if user is admin first
        if (profile?.is_admin || profile?.user_type === 'admin') {
          navigate('/admin-dashboard');
        } else if (profile?.role === 'designer' || profile?.user_type === 'designer') {
          navigate('/designer-dashboard');
        } else {
          navigate('/customer-dashboard');
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const role = formData.get('role') as string;

    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        setError('An account with this email already exists. Please use a different email or try signing in.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: role,
            user_type: role === 'designer' ? 'designer' : 'client'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log('Auth page sign in attempt for:', email);

    try {
      // Clear any existing session first
      await supabase.auth.signOut({ scope: 'global' });
      localStorage.removeItem('sb-tndeiiosfbtyzmcwllbx-auth-token');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        console.log('Sign in successful for:', data.user.email);
        // Get user role and redirect accordingly
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, user_type, is_admin')
          .eq('user_id', data.user.id)
          .single();
        
        // Check if user is admin first
        if (profile?.is_admin || profile?.user_type === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else if (profile?.role === 'designer' || profile?.user_type === 'designer') {
          navigate('/designer-dashboard', { replace: true });
        } else {
          navigate('/customer-dashboard', { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Auth page sign in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DesignHub</h1>
          <p className="text-gray-600">Connect with talented designers or showcase your skills</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-gray-900">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        required
                        className="border-gray-200 focus:border-teal-400 focus:ring-teal-400/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 hover:from-green-500 hover:via-teal-600 hover:to-blue-600 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      placeholder="Enter your full name"
                      required
                      className="border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        required
                        minLength={6}
                        className="border-gray-200 focus:border-teal-400 focus:ring-teal-400/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      I am a...
                    </Label>
                    <Select name="role" required defaultValue={roleFromUrl || undefined}>
                      <SelectTrigger className="border-gray-200 focus:border-teal-400 focus:ring-teal-400/20">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer - Looking for design services</SelectItem>
                        <SelectItem value="designer">Designer - Offering design services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 hover:from-green-500 hover:via-teal-600 hover:to-blue-600 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-teal-600 hover:text-teal-700">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
