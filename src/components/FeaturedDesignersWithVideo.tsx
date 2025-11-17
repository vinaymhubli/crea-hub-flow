import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  Clock,
  MessageCircle,
  Calendar,
  Play,
  ChevronLeft,
  ChevronRight,
  Crown,
  Users,
  UserCircle,
  CheckCircle,
  Zap,
  Award,
  Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BookingDialog } from "@/components/BookingDialog";
import LiveSessionRequestDialog from "@/components/LiveSessionRequestDialog";
import { ScreenShareModal } from "@/components/ScreenShareModal";
import { cleanupStaleSessions } from "@/utils/sessionCleanup";
import { checkDesignerBookingAvailability } from "@/utils/availabilityUtilsSlots";

interface FeaturedDesigner {
  id: string;
  designer_id: string;
  designer_table_id?: string;
  designer_name: string;
  designer_avatar?: string;
  specialty: string;
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  bio?: string;
  location?: string;
  is_online?: boolean;
  position: number;
  verification_status: string;
  kyc_status?: string | null;
  response_time?: string;
  portfolio_items?: any[];
  social_media_links?: any[];
}

interface VideoContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  youtube_url: string;
  thumbnail_url?: string;
  is_published: boolean;
}

export function FeaturedDesignersWithVideo() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [featuredDesigners, setFeaturedDesigners] = useState<
    FeaturedDesigner[]
  >([]);
  const [videoContent, setVideoContent] = useState<VideoContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedDesigner, setSelectedDesigner] =
    useState<FeaturedDesigner | null>(null);
  const [showLiveSessionDialog, setShowLiveSessionDialog] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const fetchFeaturedDesigners = useCallback(async () => {
    try {
      setLoading(true);

      // First get featured designers from featured_designers table
      const { data: featuredData, error: featuredError } = await (
        supabase as any
      )
        .from("featured_designers")
        .select("designer_id, position")
        .eq("is_active", true)
        .order("position", { ascending: true })
        .limit(6);

      if (featuredError) throw featuredError;

      if (!featuredData || featuredData.length === 0) {
        setFeaturedDesigners([]);
        return;
      }

      // Get designer details from designers table
      const designerIds = featuredData.map((fd) => fd.designer_id);
      const { data: designersData, error: designersError } = await (supabase as any)
        .from("designers")
        .select(
          `
          id,
          user_id,
          specialty,
          rating,
          reviews_count,
          hourly_rate,
          response_time,
          bio,
          location,
          is_online,
          verification_status,
          kyc_status,
          portfolio_images,
          skills,
          user:profiles!user_id(user_type)
        `
        )
        .in("user_id", designerIds)
        .eq('user.user_type', 'designer') // Only show users with designer role
        .eq('verification_status', 'approved'); // Only show approved designers

      if (designersError) throw designersError;

      console.log("Featured data:", featuredData);
      console.log("Designers data:", designersData);

      // Get user profiles for names and avatars
      const userIds = designersData?.map((d) => d.user_id) || [];
      console.log("User IDs to fetch profiles for:", userIds);
      console.log("Unique User IDs:", [...new Set(userIds)]);

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      console.log("Profiles data:", profilesData);
      console.log("Profiles found:", profilesData?.length || 0);

      // Transform and map data
      const transformedDesigners = featuredData
        .map((featured, index) => {
          const designer = designersData?.find(
            (d) => d.user_id === featured.designer_id
          );

          if (!designer) return null;

          // Find profile using designer.user_id (which should match profiles.user_id)
          const profile = profilesData?.find(
            (p) => p.user_id === designer.user_id
          );

          console.log("Featured designer mapping:", {
            featured_designer_id: featured.designer_id,
            designer_user_id: designer.user_id,
            designer_id: designer.id,
            profile_id: profile?.id,
            profile_user_id: profile?.user_id,
            profile_first_name: profile?.first_name,
            profile_last_name: profile?.last_name,
            profile_avatar_url: profile?.avatar_url,
            profile_name: profile
              ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
              : "No profile found",
          });

          // Build designer name with fallbacks
          let designerName = "Unknown Designer";
          if (profile) {
            const firstName = profile.first_name || "";
            const lastName = profile.last_name || "";
            const fullName = `${firstName} ${lastName}`.trim();
            designerName = fullName || "Designer";
          }

          return {
            id: designer.id,
            designer_id: designer.user_id,
            designer_table_id: designer.id,
            designer_name: designerName,
            designer_avatar: profile?.avatar_url || null,
            specialty: designer.specialty || "Design",
            rating: designer.rating || 0,
            reviews_count: designer.reviews_count || 0,
            hourly_rate: designer.hourly_rate || 0,
            response_time: designer.response_time || "1 hour",
            bio:
              designer.bio ||
              "Professional designer ready to help with your projects.",
            location: designer.location,
            is_online: designer.is_online || false,
            position: featured.position,
            verification_status: designer.verification_status || "pending",
            kyc_status: designer.kyc_status || null,
            portfolio_items: designer.portfolio_images || [],
            social_media_links: designer.skills || [],
          };
        })
        .filter(Boolean);

      console.log("Final transformed designers:", transformedDesigners);
      setFeaturedDesigners(transformedDesigners);
    } catch (error) {
      console.error("Error fetching featured designers:", error);
      toast.error("Failed to load featured designers");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVideoContent = useCallback(async () => {
    try {
      // Fetch video from featured_designer_video table
      const { data, error } = await (supabase as any)
        .from("featured_designer_video")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      // Transform to VideoContent format
      const videoContent: VideoContent = {
        id: data.id,
        title: data.title || "Featured Designers Video",
        subtitle: "Meet our top designers",
        description: data.description || "Discover our featured designers",
        youtube_url: data.youtube_url,
        is_published: data.is_active,
      };

      setVideoContent(videoContent);
    } catch (error) {
      console.error("Error fetching featured designer video:", error);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedDesigners();
    fetchVideoContent();
  }, [fetchFeaturedDesigners, fetchVideoContent]);

  // Auto-play slideshow
  useEffect(() => {
    if (!isAutoPlaying || featuredDesigners.length <= 2) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) =>
        prev >= Math.ceil(featuredDesigners.length / 2) - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredDesigners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev >= Math.ceil(featuredDesigners.length / 2) - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev <= 0 ? Math.ceil(featuredDesigners.length / 2) - 1 : prev - 1
    );
  };

  const handleDesignerClick = (designer: FeaturedDesigner) => {
    if (designer.designer_table_id) {
      navigate(`/designer/${designer.designer_table_id}`);
    }
  };

  const handleMessage = (designer: FeaturedDesigner) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile?.user_type !== "client") {
      toast.error("Only clients can chat with designers");
      return;
    }

    navigate(
      `/customer-dashboard/messages?designer_id=${designer.designer_table_id}`
    );
  };

  const handleBook = (designer: FeaturedDesigner) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // BookingDialog will handle the booking logic
  };

  const checkDesignerAvailability = async (designer: FeaturedDesigner) => {
    try {
      // Check for any active sessions
      const { data: activeSessions, error: activeError } = await supabase
        .from("active_sessions")
        .select("id, session_type, status, session_id, created_at")
        .eq("designer_id", designer.id)
        .eq("status", "active");

      if (activeError) {
        console.warn("Error checking active sessions:", activeError);
      }

      // Check ongoing bookings
      const { data: ongoingBookings, error: bookingError } = await supabase
        .from("bookings")
        .select("id, status, scheduled_date, duration_hours")
        .eq("designer_id", designer.id)
        .eq("status", "in_progress");

      if (bookingError) {
        console.warn("Error checking ongoing bookings:", bookingError);
      }

      const hasActiveSessions =
        !activeError && activeSessions && activeSessions.length > 0;
      const hasOngoingBookings =
        !bookingError && ongoingBookings && ongoingBookings.length > 0;
      return !hasActiveSessions && !hasOngoingBookings;
    } catch (error) {
      console.error("Error checking designer availability:", error);
      return true; // Don't block due to errors
    }
  };

  const handleLiveSessionRequest = async (designer: FeaturedDesigner) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Prevent designers from booking sessions with other designers
    if (profile?.user_type === "designer") {
      toast.error("Designers cannot book sessions with other designers. Only clients can request live sessions.");
      return;
    }
    
    if (profile?.user_type !== "client") {
      toast.error("Only clients can request live sessions");
      return;
    }

    // Check designer online status (live sessions require designer to be online)
    // First check local state
    if (!designer.is_online) {
      toast.error("Designer is currently offline. Live sessions are only available when the designer is online.");
      return;
    }
    
    const availabilityResult = await checkDesignerBookingAvailability(
      designer.id
    );
    
    // Double-check with database (in case local state is stale)
    if (!availabilityResult.isOnline) {
      toast.error("Designer is currently offline. Live sessions are only available when the designer is online.");
      return;
    }

    // Check if designer is free (active sessions/bookings)
    const isAvailable = await checkDesignerAvailability(designer);
    if (!isAvailable) {
      const cleanupResult = await cleanupStaleSessions();
      if (cleanupResult.success && cleanupResult.cleaned.total > 0) {
        toast.success(
          `Cleaned up ${cleanupResult.cleaned.total} stale session(s). Retrying...`
        );
        const isAvailableAfterCleanup = await checkDesignerAvailability(
          designer
        );
        if (!isAvailableAfterCleanup) {
          toast.error("Designer is currently busy with another session");
          return;
        }
      } else {
        toast.error("Designer is currently busy with another session");
        return;
      }
    }

    setSelectedDesigner(designer);
    setShowLiveSessionDialog(true);
  };

  const handleSessionStart = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowScreenShare(true);
    setShowLiveSessionDialog(false);
  };

  const handleCloseScreenShare = () => {
    setShowScreenShare(false);
    setCurrentSessionId(null);
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-3 h-3 text-white" />;
      case 2:
        return <Award className="w-3 h-3 text-white" />;
      case 3:
        return <Zap className="w-3 h-3 text-white" />;
      default:
        return <span className="text-xs font-bold">{position}</span>;
    }
  };

  const extractVideoId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getThumbnailUrl = (youtubeUrl: string) => {
    const videoId = extractVideoId(youtubeUrl);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : null;
  };

  if (loading) {
    return (
      <div className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <div className="space-y-4 order-2 lg:order-1">
              <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-64 sm:h-80 lg:h-96 bg-gray-200 rounded-2xl sm:rounded-3xl animate-pulse"></div>
            </div>
            <div className="space-y-4 order-1 lg:order-2">
              <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-4">
                <div className="h-40 sm:h-48 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="h-40 sm:h-48 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Centered Section Heading */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Featured Designers
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4 mb-6">
            Meet some of our top-rated designers who consistently deliver
            exceptional results for clients worldwide.
          </p>
          <Link to="/featured-designers">
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105">
              View All Featured Designers
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* Left Side - Video Section */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Video/Illustration Section */}
            <div className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden aspect-square">
              {videoContent?.youtube_url ? (
                <div className="relative h-full w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractVideoId(
                      videoContent.youtube_url
                    )}?autoplay=0&rel=0&modestbranding=1`}
                    title={videoContent.title}
                    className="w-full h-full rounded-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-200 to-blue-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  {/* Illustration placeholder - you can replace this with actual illustration */}
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-white font-medium text-lg">
                      Featured Designers Video
                    </p>
                    <p className="text-white/80 text-sm mt-2">Coming Soon</p>
                  </div>
                </div>
              )}

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full animate-pulse"></div>
              <div
                className="absolute -bottom-6 -left-6 w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>

              {/* Stats Card */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  500+
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Active Designers
                </div>
                <div className="flex items-center mt-1 sm:mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">
                    Live Now
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Featured Designers Cards */}
          <div className="space-y-6 order-1 lg:order-2">
            {featuredDesigners.length === 0 ? (
              <Card className="p-8 sm:p-12 text-center">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  No Featured Designers
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Check back later for featured designers
                </p>
                <Link to="/designers">
                  <Button className="text-sm sm:text-base">
                    Find Designers
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="relative">
                {/* Designer Cards Container */}
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%` }}
                  >
                    {Array.from({
                      length: Math.ceil(featuredDesigners.length / 2),
                    }).map((_, slideIndex) => (
                      <div key={slideIndex} className="w-full flex-shrink-0">
                        <div className="space-y-4">
                          {featuredDesigners
                            .slice(slideIndex * 2, slideIndex * 2 + 2)
                            .map((designer) => (
                              <Card
                                key={designer.id}
                                className="group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white hover:border-green-200 overflow-hidden"
                              >
                                <CardContent className="p-4 sm:p-6">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    {/* Left Section - Profile */}
                                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                                      <div className="relative flex-shrink-0">
                                        {designer.designer_avatar &&
                                        designer.designer_avatar !== "null" ? (
                                          <img
                                            src={designer.designer_avatar}
                                            alt={designer.designer_name}
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                                            onError={(e) => {
                                              // Hide the image and show fallback if it fails to load
                                              e.currentTarget.style.display =
                                                "none";
                                              e.currentTarget.nextElementSibling?.classList.remove(
                                                "hidden"
                                              );
                                            }}
                                          />
                                        ) : null}
                                        <div
                                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-lg sm:text-xl ${
                                            designer.designer_avatar &&
                                            designer.designer_avatar !== "null"
                                              ? "hidden"
                                              : ""
                                          }`}
                                        >
                                          {(designer.designer_name || "D")
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()}
                                        </div>
                                        {designer.is_online && (
                                          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                        )}
                                        {designer.position <= 3 && (
                                          <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                          <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                                            {designer.designer_name ||
                                              "Unknown Designer"}
                                          </h4>
                                          {(designer.verification_status === "verified" || designer.kyc_status === "approved") && (
                                            <div className="flex items-center space-x-1 flex-shrink-0">
                                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                                              <span className="text-xs text-green-600 font-medium">
                                                {designer.kyc_status === "approved" ? "KYC Verified" : "Verified"}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base truncate">
                                          {designer.specialty || "Design"}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                                          {designer.rating && designer.rating > 0 && (
                                          <div className="flex items-center space-x-1">
                                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                                                {designer.rating}
                                            </span>
                                            {/* <span className="text-xs sm:text-sm text-gray-500">
                                              ({designer.reviews_count || 0})
                                            </span> */}
                                          </div>
                                          )}
                                          <span className="text-xs sm:text-sm text-green-600 font-medium">
                                            {designer.is_online
                                              ? "Active Now"
                                              : "Offline"}
                                          </span>
                                        </div>

                                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 !line-clamp-4 text-ellipsis hidden sm:block">
                                          {designer.bio ||
                                            "Professional designer ready to help with your projects."}
                                        </p>

                                        <div className="hidden sm:flex flex-wrap gap-1 mb-2 sm:mb-3">
                                          {(designer.social_media_links || [])
                                            .slice(0, 4)
                                            .map((skill, index) => (
                                              <Badge
                                                key={index}
                                                variant="secondary"
                                                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700"
                                              >
                                                {skill}
                                              </Badge>
                                            ))}
                                        </div>

                                        <div className="hidden sm:flex items-center space-x-3 sm:space-x-4 text-xs text-gray-500">
                                          <div className="flex items-center space-x-1">
                                            <Award className="w-3 h-3 text-yellow-500" />
                                            <span>Top Rated</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3 text-orange-500" />
                                            <span>Fast Responder</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right Section - Pricing and Actions */}
                                    <div className="sm:text-right sm:ml-4 flex-shrink-0 w-full sm:w-32">
                                      <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-end mb-3 sm:mb-4">
                                        <p className="font-bold text-gray-900 text-base sm:text-lg">
                                          ₹{designer.hourly_rate || 0}/min
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500 sm:mb-0">
                                          Responds in {designer.response_time}
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                                        <Button
                                          size="sm"
                                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs col-span-2 sm:col-span-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDesignerClick(designer);
                                          }}
                                        >
                                          View Profile
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMessage(designer);
                                          }}
                                        >
                                          <span className="sm:hidden">
                                            Chat
                                          </span>
                                          <span className="hidden sm:inline">
                                            Chat
                                          </span>
                                        </Button>
                                        <BookingDialog designer={designer}>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-xs"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!user) {
                                                navigate("/auth");
                                                return;
                                              }
                                              // BookingDialog will handle the booking logic
                                            }}
                                          >
                                            <span className="sm:hidden">
                                              Book
                                            </span>
                                            <span className="hidden sm:inline">
                                              Book Session
                                            </span>
                                          </Button>
                                        </BookingDialog>
                                        <Button
                                          size="sm"
                                          className={`w-full text-xs col-span-2 sm:col-span-1 ${
                                            designer.is_online
                                              ? "bg-background border border-purple-600 text-purple-600 hover:bg-purple-50"
                                              : "bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed"
                                          }`}
                                          variant={
                                            designer.is_online
                                              ? "outline"
                                              : "outline"
                                          }
                                          disabled={!designer.is_online}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleLiveSessionRequest(designer);
                                          }}
                                        >
                                          <Video className="w-4 h-4 mr-2" />
                                          <span className="sm:hidden">
                                            Live Session
                                          </span>
                                          <span className="hidden sm:inline">
                                            Live Session
                                          </span>
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {featuredDesigners.length > 2 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                      aria-label="Previous designers"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                      aria-label="Next designers"
                    >
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                {featuredDesigners.length > 2 && (
                  <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
                    {Array.from({
                      length: Math.ceil(featuredDesigners.length / 2),
                    }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                          index === currentSlide
                            ? "bg-green-600"
                            : "bg-gray-300"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Session Request Dialog */}
      {selectedDesigner && (
        <LiveSessionRequestDialog
          isOpen={showLiveSessionDialog}
          onClose={() => {
            setShowLiveSessionDialog(false);
            setSelectedDesigner(null);
          }}
          designer={selectedDesigner}
          onSessionStart={handleSessionStart}
        />
      )}

      {/* Screen Share Modal */}
      {currentSessionId && (
        <ScreenShareModal
          isOpen={showScreenShare}
          onClose={handleCloseScreenShare}
          roomId={currentSessionId}
          isHost={profile?.user_type === "designer"}
          participantName={
            profile?.user_type === "designer" ? "Designer" : "Customer"
          }
          designerName={selectedDesigner?.designer_name || "Designer"}
          customerName={
            profile ? `${profile.first_name} ${profile.last_name}` : "Customer"
          }
          bookingId={undefined}
        />
      )}
    </section>
  );
}
