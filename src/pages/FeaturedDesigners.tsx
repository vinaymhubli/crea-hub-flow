import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Calendar, 
  Crown,
  Users,
  CheckCircle,
  Award,
  Zap,
  Video,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BookingDialog } from '@/components/BookingDialog';
import LiveSessionRequestDialog from '@/components/LiveSessionRequestDialog';
import { ScreenShareModal } from '@/components/ScreenShareModal';
import { cleanupStaleSessions } from '@/utils/sessionCleanup';
import { checkDesignerBookingAvailability } from '@/utils/availabilityUtilsSlots';
import { DashboardHeader } from '@/components/DashboardHeader';

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
  portfolio_items?: any[];
  social_media_links?: any[];
}

export default function FeaturedDesigners() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [featuredDesigners, setFeaturedDesigners] = useState<FeaturedDesigner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesigner, setSelectedDesigner] = useState<FeaturedDesigner | null>(null);
  const [showLiveSessionDialog, setShowLiveSessionDialog] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const fetchFeaturedDesigners = useCallback(async () => {
    try {
      setLoading(true);
      
      // First get featured designers from featured_designers table
      const { data: featuredData, error: featuredError } = await (supabase as any)
        .from('featured_designers')
        .select('designer_id, position')
        .eq('is_active', true)
        .order('position', { ascending: true });
      
      if (featuredError) throw featuredError;
      
      if (!featuredData || featuredData.length === 0) {
        setFeaturedDesigners([]);
        return;
      }
      
      // Get designer details from designers table
      const designerIds = featuredData.map((fd: any) => fd.designer_id);
      const { data: designersData, error: designersError } = await (supabase as any)
        .from('designers')
        .select(`
          id,
          user_id,
          specialty,
          rating,
          reviews_count,
          hourly_rate,
          bio,
          location,
          is_online,
          verification_status,
          kyc_status,
          portfolio_images,
          skills,
          user:profiles!user_id(user_type)
        `)
        .in('user_id', designerIds)
        .eq('user.user_type', 'designer') // Only show users with designer role
        .eq('verification_status', 'approved'); // Only show approved designers
      
      if (designersError) throw designersError;
      
      // Get user profiles for names and avatars
      const userIds = designersData?.map((d: any) => d.user_id) || [];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      // Transform and map data
      const transformedDesigners = featuredData.map((featured: any) => {
        const designer = designersData?.find((d: any) => d.user_id === featured.designer_id);
        
        if (!designer) return null;
        
        // Find profile using designer.user_id (which should match profiles.user_id)
        const profile = profilesData?.find((p: any) => p.user_id === designer.user_id);
        
        // Build designer name with fallbacks
        let designerName = 'Unknown Designer';
        if (profile) {
          const firstName = profile.first_name || '';
          const lastName = profile.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          designerName = fullName || 'Designer';
        }
        
        return {
          id: designer.id,
          designer_id: designer.user_id,
          designer_table_id: designer.id,
          designer_name: designerName,
          designer_avatar: profile?.avatar_url || null,
          specialty: designer.specialty || 'Design',
          rating: designer.rating || 0,
          reviews_count: designer.reviews_count || 0,
          hourly_rate: designer.hourly_rate || 0,
          bio: designer.bio || 'Professional designer ready to help with your projects.',
          location: designer.location,
          is_online: designer.is_online || false,
          position: featured.position,
          verification_status: designer.verification_status || 'pending',
          kyc_status: (designer as any).kyc_status || null,
          portfolio_items: designer.portfolio_images || [],
          social_media_links: designer.skills || []
        };
      }).filter(Boolean);
      
      setFeaturedDesigners(transformedDesigners);
    } catch (error) {
      console.error("Error fetching featured designers:", error);
      toast.error("Failed to load featured designers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedDesigners();
  }, [fetchFeaturedDesigners]);

  const handleDesignerClick = (designer: FeaturedDesigner) => {
    if (designer.designer_table_id) {
      navigate(`/designer/${designer.designer_table_id}`);
    }
  };

  const handleMessage = (designer: FeaturedDesigner) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile?.user_type !== 'client') {
      toast.error("Only clients can chat with designers");
      return;
    }
    
    navigate(`/customer-dashboard/messages?designer_id=${designer.designer_table_id}`);
  };

  const checkDesignerAvailability = async (designer: FeaturedDesigner) => {
    try {
      // Check for any active sessions
      const { data: activeSessions, error: activeError } = await supabase
        .from('active_sessions')
        .select('id, session_type, status, session_id, created_at')
        .eq('designer_id', designer.id)
        .eq('status', 'active');

      if (activeError) {
        console.warn('Error checking active sessions:', activeError);
      }

      // Check ongoing bookings
      const { data: ongoingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, scheduled_date, duration_hours')
        .eq('designer_id', designer.id)
        .eq('status', 'in_progress');

      if (bookingError) {
        console.warn('Error checking ongoing bookings:', bookingError);
      }

      const hasActiveSessions = !activeError && activeSessions && activeSessions.length > 0;
      const hasOngoingBookings = !bookingError && ongoingBookings && ongoingBookings.length > 0;
      return !hasActiveSessions && !hasOngoingBookings;
    } catch (error) {
      console.error('Error checking designer availability:', error);
      return true; // Don't block due to errors
    }
  };

  const handleLiveSessionRequest = async (designer: FeaturedDesigner) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Prevent designers from booking sessions with other designers
    if (profile?.user_type === 'designer') {
      toast.error('Designers cannot book sessions with other designers. Only clients can request live sessions.');
      return;
    }
    
    if (profile?.user_type !== 'client') {
      toast.error('Only clients can request live sessions');
      return;
    }

    // Check designer online status (live sessions require designer to be online)
    // First check local state
    if (!designer.is_online) {
      toast.error('Designer is currently offline. Live sessions are only available when the designer is online.');
      return;
    }
    
    const availabilityResult = await checkDesignerBookingAvailability(designer.id);
    
    // Double-check with database (in case local state is stale)
    if (!availabilityResult.isOnline) {
      toast.error('Designer is currently offline. Live sessions are only available when the designer is online.');
      return;
    }

    // Check if designer is free
    const isAvailable = await checkDesignerAvailability(designer);
    if (!isAvailable) {
      const cleanupResult = await cleanupStaleSessions();
      if (cleanupResult.success && cleanupResult.cleaned.total > 0) {
        toast.success(`Cleaned up ${cleanupResult.cleaned.total} stale session(s). Retrying...`);
        const isAvailableAfterCleanup = await checkDesignerAvailability(designer);
        if (!isAvailableAfterCleanup) {
          toast.error('Designer is currently busy with another session');
          return;
        }
      } else {
        toast.error('Designer is currently busy with another session');
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
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Award className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Zap className="w-4 h-4 text-orange-500" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Featured Designers
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Meet our top-rated designers who consistently deliver exceptional results for clients worldwide.
            </p>
          </div>
        </div>

        {/* Designers Grid */}
        {featuredDesigners.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Featured Designers</h3>
            <p className="text-gray-600 mb-6">Check back later for featured designers</p>
            <Link to="/designers">
              <Button>Find All Designers</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDesigners.map((designer) => (
              <Card
                key={designer.id}
                className="group hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white hover:border-green-200 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    {/* Profile Section */}
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-shrink-0">
                        {designer.designer_avatar && designer.designer_avatar !== 'null' ? (
                          <img
                            src={designer.designer_avatar}
                            alt={designer.designer_name}
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-lg ${designer.designer_avatar && designer.designer_avatar !== 'null' ? 'hidden' : ''}`}>
                          {(designer.designer_name || 'D').split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        {designer.is_online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                        {designer.position <= 3 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            {getPositionIcon(designer.position)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold text-gray-900 text-lg truncate">
                            {designer.designer_name || 'Unknown Designer'}
                          </h3>
                          {(designer.verification_status === 'verified' || (designer as any).kyc_status === 'approved') && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600 font-medium">
                                {(designer as any).kyc_status === 'approved' ? 'Verified Profile' : 'Verified'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 font-medium mb-2 text-sm truncate">{designer.specialty || 'Design'}</p>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          {designer.rating && designer.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium text-gray-700">{designer.rating}</span>
                           
                          </div>
                          )}
                          <span className="text-sm text-green-600 font-medium">
                            {designer.is_online ? 'Active Now' : 'Offline'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {designer.bio || "Professional designer ready to help with your projects."}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(designer.social_media_links || []).slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Pricing and Actions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-gray-900">
                          ₹{designer.hourly_rate}<span className="text-base font-normal text-gray-500">/min</span>
                        </div>
                        <p className="text-sm text-gray-500">Responds in 1hr</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
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
                          className="w-full text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessage(designer);
                          }}
                        >
                          Chat
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <BookingDialog designer={designer}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) {
                                navigate('/auth');
                                return;
                              }
                            }}
                          >
                            Book Session
                          </Button>
                        </BookingDialog>
                        <Button
                          size="sm"
                          className={`w-full text-sm ${
                            designer.is_online
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!designer.is_online}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLiveSessionRequest(designer);
                          }}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Live Session
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
          isHost={profile?.user_type === 'designer'}
          participantName={profile?.user_type === 'designer' ? 'Designer' : 'Customer'}
          designerName={selectedDesigner?.designer_name || 'Designer'}
          customerName={profile ? `${profile.first_name} ${profile.last_name}` : 'Customer'}
          bookingId={undefined}
        />
      )}
    </div>
  );
}
