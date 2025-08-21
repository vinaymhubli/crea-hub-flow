import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in as admin, redirect to admin panel
  if (user) {
    // Check if user is admin and redirect accordingly
    const checkAdminStatus = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.is_admin) {
        navigate('/secret-admin-panel');
      } else {
        navigate('/');
      }
    };
    checkAdminStatus();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Create demo admin account
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/secret-admin-panel`,
            data: {
              first_name: 'Demo',
              last_name: 'Admin',
              user_type: 'client'
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Make this user an admin
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('user_id', data.user.id);

          if (updateError) {
            console.error('Failed to set admin status:', updateError);
          }

          toast.success('Demo admin account created! You can now log in.');
          setIsSignUp(false);
        }
      } else {
        // Sign in with email and password
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Check if user is admin
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('user_id', data.user.id)
            .single();

          if (profileError) {
            throw new Error('Failed to verify admin status');
          }

          if (!profile?.is_admin) {
            // For demo emails, make them admin if they aren't already
            const demoEmails = ['admin@demo.com', 'viaan9885@gmail.com', 'lnvb200@gmail.com'];
            if (demoEmails.includes(email)) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ is_admin: true })
                .eq('user_id', data.user.id);

              if (!updateError) {
                toast.success('Welcome, Administrator');
                navigate('/secret-admin-panel');
                return;
              }
            }
            
            // Sign out non-admin users
            await supabase.auth.signOut();
            throw new Error('Access denied. Administrator privileges required.');
          }

          toast.success('Welcome, Administrator');
          navigate('/secret-admin-panel');
        }
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message || 'Operation failed');
      
      // Sign out on any error to ensure clean state
      if (!isSignUp) {
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Sign out error:', signOutError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-border/50 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isSignUp ? 'Create Admin Account' : 'Admin Access'}
            </CardTitle>
            <p className="text-muted-foreground">
              {isSignUp 
                ? 'Create demo administrator account' 
                : 'Restricted area - Administrator login required'
              }
            </p>
            
            {/* Demo credentials info */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
              <p className="font-medium text-primary mb-1">Demo Credentials:</p>
              <p className="text-muted-foreground">Email: admin@demo.com</p>
              <p className="text-muted-foreground">Password: admin123</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <Lock className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Administrator Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    {isSignUp ? 'Creating Account...' : 'Verifying Access...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {isSignUp ? 'Create Admin Account' : 'Access Admin Panel'}
                  </div>
                )}
              </Button>
              
              <div className="text-center mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={loading}
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need to create demo account? Sign Up'}
                </Button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Main Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}