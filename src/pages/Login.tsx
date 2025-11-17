import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, user, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authLogo, setAuthLogo] = useState<string | null>(null);
  const [taglineText, setTaglineText] = useState<string>('Connect with talented designers or showcase your skills');

  // Fetch auth logo and tagline
  useEffect(() => {
    const fetchAuthLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('logo_management')
          .select('logo_url, tagline_text')
          .eq('logo_type', 'auth_logo')
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data) {
          setAuthLogo((data as any).logo_url);
          if ((data as any).tagline_text) {
            setTaglineText((data as any).tagline_text);
          }
        } else {
          // Fallback to default logo
          setAuthLogo('https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png');
        }
      } catch (error) {
        console.error('Error fetching auth logo:', error);
        setAuthLogo('https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png');
      }
    };

    fetchAuthLogo();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && profile) {
      // Check if user is admin first
      if (profile.is_admin || profile.user_type === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (profile.user_type === 'designer') {
        navigate('/designer-dashboard', { replace: true });
      } else {
        navigate('/customer-dashboard', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      // Success handled by auth state change
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {authLogo && (
              <div className="mb-6">
                <img
                  src={authLogo}
                  alt="Logo"
                  className="h-16 w-auto mx-auto mb-4 object-contain"
                />
                <p className="text-gray-600">{taglineText}</p>
              </div>
            )}
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    <i className={`ri-eye${showPassword ? '-off' : ''}-line text-gray-400 hover:text-gray-600`}></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>

              <Link to="/forgot-password" className="text-sm text-green-600 hover:text-green-500 cursor-pointer">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <i className="ri-loader-line animate-spin mr-2"></i>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                  <i className="ri-google-fill text-xl"></i>
                  <span className="ml-2">Google</span>
                </button>

                <button
                  type="button"
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                  <i className="ri-facebook-fill text-xl"></i>
                  <span className="ml-2">Facebook</span>
                </button>
              </div>
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-green-600 hover:text-green-500 cursor-pointer">
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}