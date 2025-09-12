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
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionCustomerName, setSessionCustomerName] =
    useState<string>("Customer");

  const upcomingBookings = getUpcomingBookings();
  const completedBookings = getCompletedBookings();

  useEffect(() => {
    if (designerProfile) {
      calculateTotalEarnings().then(setTotalEarnings);
      // Automatically set designer online when they access dashboard
      setDesignerOnline();
    }
  }, [designerProfile]);

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

  const uniqueClients = new Set(
    completedBookings.map((booking) => booking.customer_id)
  ).size;

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DesignerSidebar />

        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 to-blue-500 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20" />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Designer Dashboard
                  </h1>
                  <p className="text-white/80">
                    Manage your design business and showcase your talent
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4">
                  {/* Status Indicator */}
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        activity?.is_online
                          ? activity.activity_status === "active"
                            ? "bg-green-400 animate-pulse"
                            : "bg-yellow-400"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-white/80 text-sm font-medium">
                      {activity?.is_online
                        ? activity.activity_status === "active"
                          ? "Active Now"
                          : "Available"
                        : "Offline"}
                    </span>
                    {activity?.is_in_schedule && (
                      <span className="text-xs text-white/60">(Scheduled)</span>
                    )}
                  </div>

                  {/* Online/Offline Toggle */}
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                    <Power className="w-4 h-4 text-white/80" />
                    <Switch
                      checked={
                        activity?.is_online
                          ? activity.activity_status === "active"
                            ? true
                            : false
                          : false
                      }
                      onCheckedChange={toggleOnlineStatus}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-500"
                    />
                    <span className="text-white/80 text-xs font-medium">
                      {designerProfile?.is_online ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
                <Bell className="w-5 h-5 text-white/80" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <span className="text-white font-semibold text-sm">
                        {getInitials(profile?.first_name, profile?.last_name)}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
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
            </div>
          </header>

          <div className="p-6 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/designer-dashboard/services" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <Package className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">Manage Services</h3>
                      <p className="text-white/80 text-sm">
                        Create & edit offerings
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/designer-dashboard/bookings" className="group">
                <div
                  className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <Calendar className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">Manage Bookings</h3>
                      <p className="text-white/80 text-sm">
                        View & organize sessions
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/designer-dashboard/portfolio" className="group">
                <div
                  className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <FolderOpen className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">Update Portfolio</h3>
                      <p className="text-white/80 text-sm">
                        Showcase your work
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/designer-dashboard/earnings" className="group">
                <div
                  className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in"
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <DollarSign className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">View Earnings</h3>
                      <p className="text-white/80 text-sm">Track your income</p>
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
              <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white">
                <CardTitle className="text-xl flex items-center">
                  <CalendarClock className="w-6 h-6 mr-3" />
                  Active Design Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {activeSession ? (
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-green-800">
                          Live Session
                        </span>
                      </div>
                      <Link
                        to={`/session/${activeSession.id}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Join Session
                      </Link>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {activeSession.service}
                    </h3>
                    <p className="text-gray-600">
                      with {activeSession.customer?.first_name}{" "}
                      {activeSession.customer?.last_name}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarClock className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      No Active Sessions
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You don't have any active design sessions at the moment.
                    </p>
                    <p className="text-sm text-gray-500">
                      When customers start a session with you, they will appear
                      here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "0.5s" }}
              >
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        Total Earnings
                      </p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ${totalEarnings.toFixed(2)}
                      </p>
                      <Link
                        to="/designer-dashboard/earnings"
                        className="text-sm text-green-600 hover:text-green-700 flex items-center mt-3 font-medium group"
                      >
                        View earnings report
                        <TrendingUp className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "0.6s" }}
              >
                <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        Total Clients
                      </p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {uniqueClients}
                      </p>
                      <p className="text-sm text-blue-600 mt-3 font-medium">
                        {upcomingBookings.length} upcoming bookings
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "0.7s" }}
              >
                <CardContent className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        Avg. Rating
                      </p>
                      <div className="flex items-center space-x-2 mb-3">
                        <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                          {designerProfile?.rating?.toFixed(1) || "0.0"}
                        </p>
                        <Star className="w-6 h-6 text-yellow-400 fill-current" />
                      </div>
                      <p className="text-sm text-yellow-600 font-medium">
                        From {designerProfile?.reviews_count || 0} completed
                        sessions
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "0.8s" }}
              >
                <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        Completion Rate
                      </p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {designerProfile?.completion_rate || 0}%
                      </p>
                      <p className="text-sm text-purple-600 mt-3 font-medium">
                        {completedBookings.length} completed sessions
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Weekly Earnings Chart */}
              <Card
                className="overflow-hidden border-0 shadow-lg animate-fade-in"
                style={{ animationDelay: "0.9s" }}
              >
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-6 h-6 mr-3" />
                    Weekly Earnings
                  </CardTitle>
                  <CardDescription className="text-indigo-100">
                    Your earnings for the current week
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-2">
                        No Earnings Data
                      </h3>
                      <p className="text-gray-600">
                        Start taking sessions to see your weekly progress
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Sessions */}
              <Card
                className="overflow-hidden border-0 shadow-lg animate-fade-in"
                style={{ animationDelay: "1.0s" }}
              >
                <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                  <CardTitle className="flex items-center">
                    <CalendarClock className="w-6 h-6 mr-3" />
                    Upcoming Sessions
                  </CardTitle>
                  <CardDescription className="text-teal-100">
                    Your scheduled design sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingBookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {booking.service}
                              </h4>
                              <p className="text-sm text-gray-600">
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
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-teal-200 text-teal-600"
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {upcomingBookings.length > 3 && (
                        <Link
                          to="/designer-dashboard/bookings"
                          className="text-sm text-teal-600 hover:text-teal-700 font-medium block text-center"
                        >
                          View all {upcomingBookings.length} upcoming sessions
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarClock className="w-8 h-8 text-teal-500" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-2">
                        No Upcoming Sessions
                      </h3>
                      <p className="text-gray-600 mb-6">
                        You don't have any design sessions scheduled.
                      </p>
                      <Link to="/designer-dashboard/availability">
                        <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 transition-all duration-300 hover:scale-105">
                          Update Availability
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "1.1s" }}
              >
                <CardContent className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Response Time</h3>
                      <p className="text-sm text-gray-600">
                        Average response to bookings
                      </p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                    {designerProfile?.response_time || "1 hour"}
                  </p>
                  <p className="text-sm text-amber-600 font-medium">
                    Respond faster to get more bookings
                  </p>
                </CardContent>
              </Card>

              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "1.2s" }}
              >
                <CardContent className="p-6 bg-gradient-to-br from-rose-50 to-pink-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        Portfolio Views
                      </h3>
                      <p className="text-sm text-gray-600">
                        Times clients viewed your work
                      </p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    0
                  </p>
                  <p className="text-sm text-rose-600 font-medium">
                    Update your portfolio to attract clients
                  </p>
                </CardContent>
              </Card>

              <Card
                className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
                style={{ animationDelay: "1.3s" }}
              >
                <CardContent className="p-6 bg-gradient-to-br from-emerald-50 to-green-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        Profile Completion
                      </h3>
                      <p className="text-sm text-gray-600">
                        Complete to attract more clients
                      </p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
                    {calculateProfileCompletion()}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProfileCompletion()}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-emerald-600 font-medium">
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
