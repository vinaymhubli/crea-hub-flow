import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  User,
  FolderOpen,
  Calendar,
  Clock,
  DollarSign,
  History,
  Settings,
  MessageSquare,
  Eye,
  Star,
  TrendingUp,
  CalendarClock,
  Bell,
  LogOut,
  Package,
  Power,
  Home,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { useDesignerProfile } from "@/hooks/useDesignerProfile";
import { RealtimeSessionIndicator } from "@/components/RealtimeSessionIndicator";
import LiveSessionNotification from "@/components/LiveSessionNotification";
import { ScreenShareModal } from "@/components/ScreenShareModal";
import { useDesignerActivity } from "@/hooks/useDesignerActivity";
import { Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DesignerSidebar } from "@/components/DesignerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RingingBell } from "@/components/RingingBell";
import NotificationBell from "@/components/NotificationBell";
import { DesignerOnboarding } from "@/components/DesignerOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function DesignerDashboard() {
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const { activeSession, getUpcomingBookings, getCompletedBookings, loading } =
    useRealtimeBookings();
  const { designerProfile, calculateTotalEarnings } = useDesignerProfile();
  const { activity } = useDesignerActivity();
  const { toast } = useToast();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [totalCompletedSessions, setTotalCompletedSessions] = useState(0);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionCustomerName, setSessionCustomerName] =
    useState<string>("Customer");
  const [showOnboarding, setShowOnboarding] = useState(false);

  const upcomingBookings = getUpcomingBookings();
  const completedBookings = getCompletedBookings();

  useEffect(() => {
    if (designerProfile && user) {
      fetchTotalEarnings();
      fetchWeeklyEarnings();
      fetchRatingAndCompletionRate();
      // Automatically set designer online when they access dashboard
      setDesignerOnline();
      
      // Check if onboarding is needed
      const status = (designerProfile as any)?.verification_status;
      const isVerified = ['approved', 'verified'].includes(status as any);
      // Show onboarding ONLY for new + not yet approved designers
      if (!designerProfile.onboarding_completed && !isVerified) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    }
  }, [designerProfile, user]);

  const fetchWeeklyEarnings = async () => {
    if (!designerProfile?.id || !user?.id) return;

    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch earnings from wallet_transactions (deposit type) for the designer
      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('transaction_type', 'deposit')
        .eq('status', 'completed')
        .gte('created_at', weekAgo.toISOString());

      if (error) throw error;

      const weeklyTotal = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
      setWeeklyEarnings(weeklyTotal);
    } catch (error) {
      console.error('Error fetching weekly earnings:', error);
    }
  };

  const fetchTotalEarnings = async () => {
    if (!user?.id) return;

    try {
      // Fetch total earnings from wallet_transactions (deposit type)
      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('transaction_type', 'deposit')
        .eq('status', 'completed');

      if (error) throw error;

      const total = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
      setTotalEarnings(total);
    } catch (error) {
      console.error('Error fetching total earnings:', error);
      // Fallback to calculateTotalEarnings if wallet_transactions fails
      calculateTotalEarnings().then(setTotalEarnings).catch(() => setTotalEarnings(0));
    }
  };

  const fetchRatingAndCompletionRate = async () => {
    if (!designerProfile?.id) return;

    try {
      // Fetch all bookings to calculate completion rate
      const { data: allBookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('designer_id', designerProfile.id);

      if (bookingsError) throw bookingsError;

      // Also fetch live sessions (active_sessions)
      const { data: liveSessionsData, error: liveSessionsError } = await supabase
        .from('active_sessions')
        .select('id, status')
        .eq('designer_id', designerProfile.id);

      // Combine bookings and live sessions for completion rate calculation
      const allBookings = allBookingsData || [];
      const allLiveSessions = liveSessionsData || [];
      
      const completedBookings = allBookings.filter(b => b.status === 'completed').length;
      const completedLiveSessions = allLiveSessions.filter(s => s.status === 'ended' || s.status === 'completed').length;
      
      const totalBookings = allBookings.length;
      const totalLiveSessions = allLiveSessions.length;
      const total = totalBookings + totalLiveSessions;
      const completed = completedBookings + completedLiveSessions;

      // Calculate completion rate - if no sessions, rate should be 0%, not 100%
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setCompletionRate(rate);
      
      // Set total completed sessions (bookings + live sessions)
      setTotalCompletedSessions(completed);

      // Calculate average rating from session_reviews (same logic as session history page)
      try {
        // Get session IDs from active_sessions for this designer
        const { data: designerSessions } = await supabase
          .from('active_sessions')
          .select('session_id')
          .eq('designer_id', designerProfile.id);
        
        const sessionIds = (designerSessions || []).map(s => s.session_id);
        
        // Get ratings via session linkage
        let ratings: number[] = [];
        if (sessionIds.length > 0) {
          const { data: ratingsData } = await supabase
            .from('session_reviews')
            .select('rating')
            .in('session_id', sessionIds);
          ratings = (ratingsData || []).map(r => Number((r as any).rating) || 0).filter(r => r > 0);
        }
        
        // Fallback: ratings matched by designer_name text
        let byNameRatings: number[] = [];
        if (profile?.first_name || profile?.last_name) {
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          if (fullName) {
            const { data: nameReviews } = await supabase
              .from('session_reviews')
              .select('rating')
              .eq('designer_name', fullName);
            byNameRatings = (nameReviews || []).map(r => Number((r as any).rating) || 0).filter(r => r > 0);
          }
        }
        
        // Combine all ratings and calculate average
        const allRatings = [...ratings, ...byNameRatings];
        if (allRatings.length > 0) {
          const avgRaw = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
          const avg = Math.round(avgRaw * 10) / 10; // Round to 1 decimal place
          setAvgRating(avg);
        } else {
          // Fallback to designer profile rating if no reviews found
          setAvgRating(designerProfile.rating ? Number(designerProfile.rating) : 0);
        }
      } catch (ratingError) {
        console.error('Error calculating rating from session_reviews:', ratingError);
        // Fallback to designer profile rating
        setAvgRating(designerProfile.rating ? Number(designerProfile.rating) : 0);
      }
    } catch (error) {
      console.error('Error fetching rating and completion rate:', error);
      // Use designer profile rating as fallback
      setAvgRating(designerProfile?.rating ? Number(designerProfile.rating) : 0);
      setCompletionRate(0); // Default to 0 if error
    }
  };

  const setDesignerOnline = async () => {
    if (!designerProfile?.id) return;

    try {
      const { error } = await supabase
        .from("designers")
        .update({ is_online: true })
        .eq("id", designerProfile.id);

      if (error) {
        console.error("Error setting designer online:", error);
      } else {
        console.log("Designer set to online");
      }
    } catch (error) {
      console.error("Error setting designer online:", error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "D";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    }
    return user?.email?.split("@")[0] || "Designer";
  };

  const calculateProfileCompletion = () => {
    if (!designerProfile || !profile) return 0;

    const fields = [
      profile.first_name,
      profile.last_name,
      designerProfile.bio,
      designerProfile.specialty,
      designerProfile.hourly_rate > 0,
      designerProfile.skills?.length > 0,
      designerProfile.portfolio_images?.length > 0,
      designerProfile.location,
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  // Calculate unique clients from both bookings and live sessions
  const [uniqueClients, setUniqueClients] = useState(0);
  
  useEffect(() => {
    const fetchUniqueClients = async () => {
      if (!designerProfile?.id) return;
      
      try {
        // Get unique clients from completed bookings
        const bookingClients = new Set(
    completedBookings.map((booking) => booking.customer_id)
        );
        
        // Get unique clients from completed live sessions
        const { data: liveSessions } = await supabase
          .from('active_sessions')
          .select('customer_id')
          .eq('designer_id', designerProfile.id)
          .in('status', ['ended', 'completed']);
        
        liveSessions?.forEach((session) => {
          if (session.customer_id) {
            bookingClients.add(session.customer_id);
          }
        });
        
        setUniqueClients(bookingClients.size);
      } catch (error) {
        console.error('Error fetching unique clients:', error);
        // Fallback to just bookings
        setUniqueClients(new Set(completedBookings.map((b) => b.customer_id)).size);
      }
    };
    
    if (designerProfile && completedBookings) {
      fetchUniqueClients();
    }
  }, [designerProfile, completedBookings]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSessionStart = async (sessionId: string) => {
    // Redirect designer to full Meet-style session page
    navigate(`/live-session/${sessionId}`, {
      state: { hideGlobalChrome: true },
    });

    // Fetch customer name from active_sessions
    try {
      const { data: sessionData } = await supabase
        .from("active_sessions")
        .select(
          "customer_id, profiles!active_sessions_customer_id_fkey(first_name, last_name)"
        )
        .eq("session_id", sessionId)
        .single();

      if (sessionData?.profiles) {
        const customerName =
          `${sessionData.profiles.first_name || ""} ${
            sessionData.profiles.last_name || ""
          }`.trim() || "Customer";
        setSessionCustomerName(customerName);
      }
    } catch (error) {
      console.warn("Could not fetch customer name for session:", error);
      setSessionCustomerName("Customer");
    }
  };

  const handleCloseScreenShare = () => {
    setShowScreenShare(false);
    setCurrentSessionId(null);
    setSessionCustomerName("Customer");
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh designer profile to get updated onboarding status
    window.location.reload();
  };

  // Set designer offline when component unmounts
  useEffect(() => {
    return () => {
      if (designerProfile?.id) {
        setDesignerOffline();
      }
    };
  }, [designerProfile?.id]);

  const setDesignerOffline = async () => {
    if (!designerProfile?.id) return;

    try {
      const { error } = await supabase
        .from("designers")
        .update({ is_online: false })
        .eq("id", designerProfile.id);

      if (error) {
        console.error("Error setting designer offline:", error);
      } else {
        console.log("Designer set to offline");
      }
    } catch (error) {
      console.error("Error setting designer offline:", error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!designerProfile?.id) return;

    try {
      const newStatus = !designerProfile.is_online;

      console.log(
        `🔄 Toggling designer status to: ${newStatus ? "ONLINE" : "OFFLINE"}`
      );

      // Update both tables simultaneously
      const [designerResult, activityResult] = await Promise.allSettled([
        // Update designers table
        supabase
          .from("designers")
          .update({
            is_online: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", designerProfile.id),

        // Update designer_activity table
        supabase.from("designer_activity").upsert(
          {
            designer_id: user?.id,
            last_seen: new Date().toISOString(),
            activity_status: newStatus ? "active" : "offline",
            is_online: newStatus,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "designer_id",
          }
        ),
      ]);

      // Check for errors
      if (designerResult.status === "rejected") {
        console.error("Error updating designers table:", designerResult.reason);
        throw new Error("Failed to update designer status");
      }

      if (activityResult.status === "rejected") {
        console.error(
          "Error updating designer_activity table:",
          activityResult.reason
        );
        // Don't throw here, activity table is secondary
        console.warn("Activity table update failed, but continuing...");
      }

      // If going offline, end any active sessions immediately
      if (!newStatus) {
        console.log("🚫 Going offline, ending any active sessions...");

        const { error: endSessionsError } = await supabase
          .from("active_sessions")
          .update({
            status: "ended",
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("designer_id", designerProfile.id)
          .eq("status", "active");

        if (endSessionsError) {
          console.warn("Error ending active sessions:", endSessionsError);
        } else {
          console.log("✅ Ended all active sessions for offline designer");
        }

        // Also reject any pending live session requests
        const { error: rejectRequestsError } = await supabase
          .from("live_session_requests")
          .update({
            status: "rejected",
            rejection_reason: "Designer went offline",
            updated_at: new Date().toISOString(),
          })
          .eq("designer_id", designerProfile.id)
          .eq("status", "pending");

        if (rejectRequestsError) {
          console.warn(
            "Error rejecting pending requests:",
            rejectRequestsError
          );
        } else {
          console.log("✅ Rejected all pending live session requests");
        }
      }

      console.log(
        `✅ Designer successfully set to ${newStatus ? "ONLINE" : "OFFLINE"}`
      );

      toast({
        title: newStatus ? "Now Online" : "Now Offline",
        description: newStatus
          ? "You are now available for live sessions"
          : "You are now offline. All active sessions and pending requests have been ended.",
      });

      // Refresh the page to update all status indicators
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error toggling online status:", error);
      toast({
        title: "Error",
        description: "Failed to update online status",
        variant: "destructive",
      });
    }
  };

  // Show onboarding if needed
  if (showOnboarding) {
    return <DesignerOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DesignerSidebar />

        <main className="flex-1">
          <DashboardHeader
            title="Designer Dashboard"
            subtitle="Manage your design business and showcase your talent"
            userInitials={getInitials(profile?.first_name, profile?.last_name)}
            isOnline={activity?.is_online}
            showHomeButton={true}
            additionalInfo={
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Status Indicator */}
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                      activity?.is_online
                          ? "bg-green-400 animate-pulse"
                        : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-white/80 text-xs sm:text-sm font-medium hidden sm:inline">
                    {activity?.is_online ? "Active Now" : "Offline"}
                  </span>
                  {activity?.is_in_schedule && (
                    <span className="text-xs text-white/60 hidden md:inline">(Scheduled)</span>
                  )}
                </div>

                {/* Online/Offline Toggle */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-white/20">
                  <Power className="w-3 h-3 sm:w-4 sm:h-4 text-white/80 flex-shrink-0" />
                  <Switch
                    checked={activity?.is_online || false}
                    onCheckedChange={toggleOnlineStatus}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-500 scale-75 sm:scale-100"
                  />
                  <span className="text-white/80 text-xs font-medium hidden sm:inline">
                    {activity?.is_online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            }
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-4">
                <NotificationBell />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {getInitials(profile?.first_name, profile?.last_name)}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-64 w-fit p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {getInitials(
                              profile?.first_name,
                              profile?.last_name
                            )}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {getDisplayName()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link
                          to="/designer-dashboard"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          to="/designer-dashboard/services"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Package className="w-4 h-4 mr-3" />
                          Services
                        </Link>
                        <Link
                          to="/designer-dashboard/earnings"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <DollarSign className="w-4 h-4 mr-3" />
                          Earnings
                        </Link>
                        <Link
                          to="/designer-dashboard/profile"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            }
          />

          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Link to="/designer-dashboard/services" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 h-24 sm:h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in">
                  <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <Package className="w-5 h-5 sm:w-8 sm:h-8 mb-1 sm:mb-2" />
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg">Manage Services</h3>
                      <p className="text-white/80 text-xs sm:text-sm hidden sm:block">
                        Create & edit offerings
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/designer-dashboard/bookings" className="group">
                <div
                  className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 h-24 sm:h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <Calendar className="w-5 h-5 sm:w-8 sm:h-8 mb-1 sm:mb-2" />
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg">Manage Bookings</h3>
                      <p className="text-white/80 text-xs sm:text-sm hidden sm:block">
                        View & organize sessions
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/designer-dashboard/portfolio" className="group">
                <div
                  className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 h-24 sm:h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <FolderOpen className="w-5 h-5 sm:w-8 sm:h-8 mb-1 sm:mb-2" />
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg">Update Portfolio</h3>
                      <p className="text-white/80 text-xs sm:text-sm hidden sm:block">
                        Showcase your work
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/designer-dashboard/earnings" className="group">
                <div
                  className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 h-24 sm:h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in"
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <DollarSign className="w-5 h-5 sm:w-8 sm:h-8 mb-1 sm:mb-2" />
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg">View Earnings</h3>
                      <p className="text-white/80 text-xs sm:text-sm hidden sm:block">Track your income</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Active Design Sessions */}
            <Card
              className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-100 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl flex items-center">
                  <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  <span className="hidden sm:inline">Active Design Sessions</span>
                  <span className="sm:hidden">Active Sessions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {activeSession ? (
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 sm:p-6 border border-green-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-green-800 text-sm sm:text-base">
                          Live Session
                        </span>
                      </div>
                      <Link
                        to={`/session/${activeSession.id}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base text-center"
                      >
                        Join Session
                      </Link>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 truncate">
                      {activeSession.service}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      with {activeSession.customer?.first_name}{" "}
                      {activeSession.customer?.last_name}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <CalendarClock className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                      No Active Sessions
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">
                      You don't have any active design sessions at the moment.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      When customers start a session with you, they will appear
                      here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "0.5s" }}
              >
                <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">
                        Total Earnings
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ₹{totalEarnings.toFixed(2)}
                      </p>
                      <Link
                        to="/designer-dashboard/earnings"
                        className="text-xs sm:text-sm text-green-600 hover:text-green-700 flex items-center mt-2 sm:mt-3 font-medium group"
                      >
                        <span className="hidden sm:inline">View earnings report</span>
                        <span className="sm:hidden">View report</span>
                        <TrendingUp className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "0.6s" }}
              >
                <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">
                        Total Clients
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {uniqueClients}
                      </p>
                      <p className="text-xs sm:text-sm text-blue-600 mt-2 sm:mt-3 font-medium">
                        {upcomingBookings.length} upcoming bookings
                      </p>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {avgRating > 0 && (
              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "0.7s" }}
              >
                <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">
                        Avg. Rating
                      </p>
                      <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                            {avgRating.toFixed(1)}
                        </p>
                        <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
                      </div>
                      <p className="text-xs sm:text-sm text-yellow-600 font-medium">
                          From {totalCompletedSessions} completed
                        sessions
                      </p>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "0.8s" }}
              >
                <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">
                        Completion Rate
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {completionRate}%
                      </p>
                      <p className="text-xs sm:text-sm text-purple-600 mt-2 sm:mt-3 font-medium">
                        {totalCompletedSessions} completed sessions
                      </p>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Weekly Earnings Chart */}
              <Card
                className="overflow-hidden border-0 shadow-lg animate-fade-in"
                style={{ animationDelay: "0.9s" }}
              >
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    Weekly Earnings
                  </CardTitle>
                  <CardDescription className="text-indigo-100 text-xs sm:text-sm">
                    Your earnings for the current week
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {weeklyEarnings > 0 ? (
                    <div className="h-48 sm:h-64 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-2xl sm:text-3xl mb-2">
                          ₹{weeklyEarnings.toFixed(2)}
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base px-4">
                          Earnings this week
                        </p>
                      </div>
                    </div>
                  ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                    <div className="text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                        No Earnings Data
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base px-4">
                        Start taking sessions to see your weekly progress
                      </p>
                    </div>
                  </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Sessions */}
              <Card
                className="overflow-hidden border-0 shadow-lg animate-fade-in"
                style={{ animationDelay: "1.0s" }}
              >
                <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    Upcoming Sessions
                  </CardTitle>
                  <CardDescription className="text-teal-100 text-xs sm:text-sm">
                    Your scheduled design sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {upcomingBookings.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {upcomingBookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3 sm:p-4 border border-teal-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                {booking.service}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                with {booking.customer?.first_name}{" "}
                                {booking.customer?.last_name}
                              </p>
                              <p className="text-xs text-teal-600 mt-1">
                                {new Date(
                                  booking.scheduled_date
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  booking.scheduled_date
                                ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-teal-200 text-teal-600 self-start sm:self-center"
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {upcomingBookings.length > 3 && (
                        <Link
                          to="/designer-dashboard/bookings"
                          className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium block text-center"
                        >
                          View all {upcomingBookings.length} upcoming sessions
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <CalendarClock className="w-6 h-6 sm:w-8 sm:h-8 text-teal-500" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                        No Upcoming Sessions
                      </h3>
                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                        You don't have any design sessions scheduled.
                      </p>
                      <Link to="/designer-dashboard/availability">
                        <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                          Update Availability
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "1.1s" }}
              >
                <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-yellow-50">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-800 text-sm sm:text-base">Response Time</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        Average response to bookings
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                    {designerProfile?.response_time || "1 hour"}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-600 font-medium">
                    Respond faster to get more bookings
                  </p>
                </CardContent>
              </Card>

              {/* <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "1.2s" }}
              >
                <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-rose-50 to-pink-50">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                        Portfolio Views
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        Times clients viewed your work
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    0
                  </p>
                  <p className="text-xs sm:text-sm text-rose-600 font-medium">
                    Update your portfolio to attract clients
                  </p>
                </CardContent>
              </Card> */}

              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "1.3s" }}
              >
                <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-green-50">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                        Profile Completion
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        Complete to attract more clients
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
                    {calculateProfileCompletion()}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 mb-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-green-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProfileCompletion()}%` }}
                    ></div>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-600 font-medium">
                    {calculateProfileCompletion() === 100
                      ? "Profile Complete!"
                      : "Almost there! Complete your profile"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <RealtimeSessionIndicator />

        {/* Live Session Notifications */}
        {designerProfile?.id && (
          <LiveSessionNotification
            designerId={designerProfile.id}
            onSessionStart={handleSessionStart}
          />
        )}

        {/* Screen Share Modal */}
        {currentSessionId && (
          <ScreenShareModal
            isOpen={showScreenShare}
            onClose={handleCloseScreenShare}
            roomId={currentSessionId}
            isHost={true} // Designer is always the host in live sessions
            participantName="Designer"
            designerName={
              profile
                ? `${profile.first_name} ${profile.last_name}`
                : "Designer"
            }
            customerName={sessionCustomerName}
            bookingId={undefined} // Live sessions don't have booking IDs
          />
        )}
        
      </div>
    </SidebarProvider>
  );
}
