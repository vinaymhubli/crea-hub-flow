import { useState, useEffect } from "react";
import {
  useNavigate,
  Link,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  Palette,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Logo {
  id: string;
  logo_type: string;
  logo_url: string;
  alt_text: string | null;
  is_active: boolean;
}

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [platformName, setPlatformName] = useState<string>("meetmydesigners");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Get role from URL parameter
  const roleFromUrl = searchParams.get("role") as "designer" | "client" | null;
  const mode = searchParams.get("mode");

  // Determine default tab based on route
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (location.pathname === "/signup") {
      return "signup";
    } else if (location.pathname === "/login") {
      return "signin";
    }
    return "signin";
  });

  // Update active tab when route changes
  useEffect(() => {
    if (location.pathname === "/signup") {
      setActiveTab("signup");
    } else if (location.pathname === "/login") {
      setActiveTab("signin");
    } else {
      setActiveTab("signin");
    }
  }, [location.pathname]);

  // Fetch logo and platform name
  useEffect(() => {
    fetchLogoAndPlatformName();
  }, []);

  const fetchLogoAndPlatformName = async () => {
    try {
      // Fetch logo
      const { data: logos, error: logoError } = await supabase
        .from("logo_management")
        .select("*")
        .eq("is_active", true)
        .eq("logo_type", "header_logo")
        .maybeSingle();

      if (!logoError && logos) {
        setLogoUrl(logos.logo_url);
      } else {
        // Fallback to default logo
        setLogoUrl(
          "https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png"
        );
      }

      // Fetch platform name
      const { data: settings, error: settingsError } = await (supabase as any)
        .from("platform_settings")
        .select("platform_name")
        .eq("singleton", true)
        .maybeSingle();

      if (!settingsError && settings?.platform_name) {
        setPlatformName(settings.platform_name);
      }
    } catch (error) {
      console.error("Error fetching logo and platform name:", error);
      // Use fallback values on error
      setLogoUrl(
        "https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png"
      );
    }
  };

  // Check if this is a password reset flow
  useEffect(() => {
    if (mode === "reset-password") {
      setIsPasswordReset(true);
    }
  }, [mode]);

  // Check if user is already logged in - but allow manual override
  useEffect(() => {
    // Check if this is a password reset flow
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");

    if (mode === "reset-password") {
      // Don't redirect if it's a password reset flow
      return;
    }

    // Only auto-redirect if coming from another page, not if directly visiting /auth
    if (
      window.location.pathname === "/auth" &&
      !document.referrer.includes(window.location.origin)
    ) {
      return; // Don't auto-redirect when directly visiting /auth
    }

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        console.log("User already logged in, redirecting...");
        // Redirect based on user role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, user_type, is_admin")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        // Check if user is admin first
        if (profile?.is_admin || profile?.user_type === "admin") {
          navigate("/admin-dashboard");
        } else if (
          profile?.role === "designer" ||
          profile?.user_type === "designer"
        ) {
          navigate("/designer-dashboard");
        } else {
          navigate("/customer-dashboard");
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
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const role = formData.get("role") as string;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    // Block common test/fake email domains that cause bounces
    const blockedDomains = ['test.com', 'example.com', 'fake.com', 'invalid.com', 'test.test'];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (emailDomain && blockedDomains.includes(emailDomain)) {
      setError("Please use a real email address. Test email addresses are not allowed.");
      setLoading(false);
      return;
    }

    // Combine first and last name for full_name
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing user:", checkError);
        // Continue with signup even if check fails
      }

      if (existingUser) {
        setError(
          "An account with this email already exists. Please use a different email or try signing in."
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            role: role,
            user_type: role === "designer" ? "designer" : "client",
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
        duration: 10000, // 10 seconds
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
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log("Auth page sign in attempt for:", email);

    try {
      // Clear any existing session first
      await supabase.auth.signOut({ scope: "global" });
      localStorage.removeItem("sb-tndeiiosfbtyzmcwllbx-auth-token");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        console.log("Sign in successful for:", data.user.email);
        // Get user role and redirect accordingly
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, user_type, is_admin")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile on signin:", profileError);
        }

        // Check if user is admin first
        if (profile?.is_admin || profile?.user_type === "admin") {
          navigate("/admin-dashboard", { replace: true });
        } else if (
          profile?.role === "designer" ||
          profile?.user_type === "designer"
        ) {
          navigate("/designer-dashboard", { replace: true });
        } else {
          navigate("/customer-dashboard", { replace: true });
        }
      }
    } catch (error: any) {
      console.error("Auth page sign in error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotPasswordEmail,
        {
          redirectTo: `${window.location.origin}/auth?mode=reset-password`,
        }
      );

      if (error) {
        if (
          error.message.includes("User not found") ||
          error.message.includes("Invalid email")
        ) {
          setError(
            "No account found with this email address. Please check your email or sign up for a new account."
          );
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });

      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated Successfully",
        description:
          "Your password has been updated. You can now sign in with your new password.",
      });

      // Reset the form and redirect to sign in
      setIsPasswordReset(false);
      setNewPassword("");
      setConfirmPassword("");
      navigate("/auth");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // If this is a password reset flow, only show the password reset form
  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600">Set your new password</p>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-gray-900">
                Set New Password
              </CardTitle>
              <CardDescription className="text-center">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="new-password"
                    className="flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="border-gray-200 focus:border-teal-400 focus:ring-teal-400/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className="flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="border-gray-200 focus:border-teal-400 focus:ring-teal-400/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    >
                      {showConfirmPassword ? (
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
                  {loading ? "Updating Password..." : "Update Password"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordReset(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setError(null);
                      navigate("/auth");
                    }}
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md py-10">
        <div className="text-center mb-8">
          <img
            src={logoUrl}
            alt={platformName || "Logo"}
            className="h-16 w-auto mx-auto mb-4 object-contain"
          />

          {/* <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {platformName}
          </h1> */}
          <p className="text-gray-600">
            Connect with talented designers or showcase your skills
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-gray-900">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
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
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-email"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 text-teal-600" />
                      Email Address
                    </Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      required
                      className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 transition-colors duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-password"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-teal-600" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 pr-10 transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:bg-gray-50 rounded-r-md transition-colors duration-200"
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
                    className="w-full h-12 bg-gradient-to-r from-green-500 via-teal-600 to-blue-600 hover:from-green-600 hover:via-teal-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </div>
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="signup-firstname"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-teal-600" />
                        First Name
                      </Label>
                      <Input
                        id="signup-firstname"
                        name="firstName"
                        placeholder="Enter your first name"
                        required
                        className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="signup-lastname"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-teal-600" />
                        Last Name
                      </Label>
                      <Input
                        id="signup-lastname"
                        name="lastName"
                        placeholder="Enter your last name"
                        required
                        className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 transition-colors duration-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-email"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 text-teal-600" />
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      required
                      className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 transition-colors duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-teal-600" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        required
                        minLength={6}
                        className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 pr-10 transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:bg-gray-50 rounded-r-md transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Must be at least 6 characters long
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-role"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Users className="w-4 h-4 text-teal-600" />I am a...
                    </Label>
                    <Select
                      name="role"
                      required
                      defaultValue={roleFromUrl || undefined}
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 transition-colors duration-200">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">
                          Customer - Looking for design services
                        </SelectItem>
                        <SelectItem value="designer">
                          Designer - Offering design services
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-500 via-teal-600 to-blue-600 hover:from-green-600 hover:via-teal-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Create Account
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Forgot Password Dialog */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">Reset Password</CardTitle>
                <CardDescription className="text-center">
                  Enter your email address and we'll send you a password reset
                  link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="forgot-email"
                      className="flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail("");
                        setError(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 hover:from-green-500 hover:via-teal-600 hover:to-blue-600 text-white"
                      disabled={forgotPasswordLoading}
                    >
                      {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
