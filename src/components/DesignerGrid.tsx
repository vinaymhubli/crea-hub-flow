
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookingDialog } from './BookingDialog';
import LiveSessionRequestDialog from './LiveSessionRequestDialog';
import { ScreenShareModal } from './ScreenShareModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cleanupStaleSessions } from '@/utils/sessionCleanup';
import { FilterState } from '../pages/Designers';
import { useAuth } from '@/hooks/useAuth';
import { Video, MessageCircle, Calendar, Eye, CheckCircle } from 'lucide-react';
import { checkDesignerBookingAvailability } from '@/utils/availabilityUtilsSlots';

interface DesignerGridProps {
  filters: FilterState;
}

const DesignerGrid: React.FC<DesignerGridProps> = ({ filters }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [sortBy, setSortBy] = useState('rating');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesigner, setSelectedDesigner] = useState<any>(null);
  const [showLiveSessionDialog, setShowLiveSessionDialog] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'hourly_rate', label: 'Price: Low to High' },
    { value: 'hourly_rate_desc', label: 'Price: High to Low' },
    { value: 'created_at', label: 'Newest' }
  ];

  // Debounced filter function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  };

  const fetchDesigners = useCallback(async () => {
    try {
      console.log('Fetching designers with filters:', filters);
      setLoading(true);
      
      // First, get featured designers with their positions
      const { data: featuredDesigners, error: featuredError } = await (supabase as any)
        .from('featured_designers')
        .select('designer_id, position')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (featuredError) {
        console.error('Error fetching featured designers:', featuredError);
      }

      // Create a map of featured designer IDs to their positions
      const featuredMap = new Map<string, number>();
      (featuredDesigners || []).forEach((fd: any) => {
        featuredMap.set(fd.designer_id, fd.position);
      });

      // If categories are selected, first get designers who have services in those categories
      let designerIds: string[] = [];
      if (filters.selectedCategories.length > 0) {
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('designer_id')
          .in('category', filters.selectedCategories)
          .eq('is_active', true);

        if (servicesError) throw servicesError;
        designerIds = [...new Set(services?.map(s => s.designer_id) || [])];
        
        // If no services found in selected categories, return empty results
        if (designerIds.length === 0) {
          setDesigners([]);
          return;
        }
      }

      let query = supabase
        .from('designers')
        .select(`
          *,
          user:profiles!user_id(blocked)
        `)
        .eq('user.blocked', false); // Only show non-blocked designers

      // Filter by designers who have services in selected categories
      if (designerIds.length > 0) {
        query = query.in('id', designerIds);
      }

      // Apply price filter
      if (filters.priceRange[1] < 200) {
        query = query.lte('hourly_rate', filters.priceRange[1]);
      }
      query = query.gte('hourly_rate', filters.priceRange[0]);

      // Apply rating filter
      if (filters.selectedRating) {
        query = query.gte('rating', filters.selectedRating);
      }

      // Apply sorting
      if (sortBy === 'hourly_rate') {
        query = query.order('hourly_rate', { ascending: true });
      } else if (sortBy === 'hourly_rate_desc') {
        query = query.order('hourly_rate', { ascending: false });
      } else if (sortBy === 'created_at') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('rating', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      console.log('Fetched designers:', data?.length || 0);
      
      // Fetch profiles and activity status for each designer
      const designersWithProfiles = await Promise.all(
        (data || []).map(async (designer) => {
          console.log('Processing designer:', designer.id, 'user_id:', designer.user_id);
          
          try {
            const [profileResult, activityResult] = await Promise.all([
              supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url, email')
                .eq('user_id', designer.user_id)
                .single(),
              supabase
                .from('designer_activity')
                .select('is_online, activity_status, last_seen')
                .eq('designer_id', designer.user_id)
                .maybeSingle() // Use maybeSingle to avoid errors if no record exists
            ]);
            
            if (activityResult.error && activityResult.error.code !== 'PGRST116') {
              console.warn('Activity query error for designer:', designer.user_id, activityResult.error);
            }
            
            return {
              ...designer,
              profiles: profileResult.data,
              activity: activityResult.data || {
                is_online: designer.is_online || false,
                activity_status: 'offline',
                last_seen: new Date().toISOString()
              }
            };
          } catch (error) {
            console.error('Error fetching data for designer:', designer.user_id, error);
            return {
              ...designer,
              profiles: null,
              activity: {
                is_online: designer.is_online || false,
                activity_status: 'offline',
                last_seen: new Date().toISOString()
              }
            };
          }
        })
      );
      
      // Apply client-side filters
      let filteredData = designersWithProfiles;
      
      // Apply availability filter based on activity status
      if (filters.availabilityStatus !== 'all') {
        filteredData = filteredData.filter(designer => {
          const isOnline = designer.activity?.is_online || designer.is_online;
          const activityStatus = designer.activity?.activity_status || 'offline';
          
          switch (filters.availabilityStatus) {
            case 'available':
              return isOnline && (activityStatus === 'available' || activityStatus === 'online');
            case 'active':
              return isOnline && activityStatus === 'active';
            case 'offline':
              return !isOnline || activityStatus === 'offline';
            default:
              return true;
          }
        });
      }
      
      // Keep the old isOnlineOnly filter for backward compatibility
      if (filters.isOnlineOnly) {
        filteredData = filteredData.filter(designer => 
          designer.activity?.is_online || designer.is_online
        );
      }
      
      // Apply search filter client-side with improved matching
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter(designer => {
          const fullName = `${designer.profiles?.first_name || ''} ${designer.profiles?.last_name || ''}`.toLowerCase();
          return (
            designer.specialty?.toLowerCase().includes(searchLower) ||
            designer.bio?.toLowerCase().includes(searchLower) ||
            fullName.includes(searchLower) ||
            designer.profiles?.email?.toLowerCase().includes(searchLower) ||
            designer.skills?.some(skill => skill.toLowerCase().includes(searchLower))
          );
        });
      }
      
      // Apply skills filter
      if (filters.selectedSkills.length > 0) {
        filteredData = filteredData.filter(designer => 
          designer.skills && filters.selectedSkills.some(skill => 
            designer.skills.includes(skill)
          )
        );
      }

      // Sort designers with featured ones first, then by the selected sort criteria
      const sortedData = filteredData.sort((a, b) => {
        const aFeaturedPosition = featuredMap.get(a.user_id);
        const bFeaturedPosition = featuredMap.get(b.user_id);
        
        // If both are featured, sort by their position (1-10)
        if (aFeaturedPosition && bFeaturedPosition) {
          return aFeaturedPosition - bFeaturedPosition;
        }
        
        // If only one is featured, it comes first
        if (aFeaturedPosition && !bFeaturedPosition) {
          return -1;
        }
        if (!aFeaturedPosition && bFeaturedPosition) {
          return 1;
        }
        
        // If neither is featured, apply the original sorting logic
        switch (sortBy) {
          case 'hourly_rate':
            return a.hourly_rate - b.hourly_rate;
          case 'hourly_rate_desc':
            return b.hourly_rate - a.hourly_rate;
          case 'created_at':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'rating':
          default:
            return b.rating - a.rating;
        }
      });

      console.log('Filtered designers:', sortedData.length);
      setDesigners(sortedData);
    } catch (error) {
      console.error('Error fetching designers:', error);
      toast.error('Failed to load designers');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy]);

  // Debounced version of fetchDesigners
  const debouncedFetchDesigners = useCallback(
    debounce(fetchDesigners, 300),
    [fetchDesigners]
  );

  // Initial load
  useEffect(() => {
    fetchDesigners();
  }, []);

  // Debounced updates for filter changes
  useEffect(() => {
    if (filters.searchTerm !== '') {
      debouncedFetchDesigners();
    } else {
      fetchDesigners();
    }
  }, [filters, debouncedFetchDesigners, fetchDesigners]);

  // Real-time updates
  useEffect(() => {
    console.log('Setting up real-time subscriptions...');
    
    const designersChannel = supabase
      .channel('designers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'designers'
        },
        (payload) => {
          console.log('Designers table changed:', payload);
          fetchDesigners();
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('Services table changed:', payload);
          fetchDesigners();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(designersChannel);
      supabase.removeChannel(servicesChannel);
    };
  }, [fetchDesigners]);

  const handleChat = (designerId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile?.user_type !== 'client') {
      toast.error('Only clients can chat with designers');
      return;
    }
    
    navigate(`/customer-dashboard/messages?designer_id=${designerId}`);
  };

  const checkDesignerAvailability = async (designer: any) => {
    try {
      console.log('🔍 Checking availability for designer:', designer.id, designer.name || designer.profiles?.first_name);

      // Check if designer has any active sessions in our new active_sessions table
      const { data: activeSessions, error: activeError } = await supabase
        .from('active_sessions')
        .select('id, session_type, status, session_id, created_at')
        .eq('designer_id', designer.id)
        .eq('status', 'active');

      if (activeError) {
        console.warn('Error checking active sessions:', activeError);
        // Don't block availability due to table errors - just continue
      } else {
        console.log('📋 Active sessions found:', activeSessions?.length || 0, activeSessions);
      }

      // Check if designer has any ongoing bookings
      const { data: ongoingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, scheduled_date, duration_hours')
        .eq('designer_id', designer.id)
        .eq('status', 'in_progress');

      if (bookingError) {
        console.warn('Error checking ongoing bookings:', bookingError);
        // Don't block availability due to table errors - just continue
      } else {
        console.log('📅 Ongoing bookings found:', ongoingBookings?.length || 0, ongoingBookings);
      }

      // Check ONLY active sessions - live_session_requests are just requests, not actual sessions
      // The important thing is whether designer has an ACTIVE session, not pending/accepted requests
      const hasActiveSessions = !activeError && activeSessions && activeSessions.length > 0;
      const hasOngoingBookings = !bookingError && ongoingBookings && ongoingBookings.length > 0;

      console.log('🎥 Checking ONLY active sessions and ongoing bookings for availability');
      console.log('📋 Active sessions:', hasActiveSessions ? activeSessions : 'None');
      console.log('📅 Ongoing bookings:', hasOngoingBookings ? ongoingBookings : 'None');
      
      // Designer is available if they have NO active sessions and NO ongoing bookings
      const isAvailable = !hasActiveSessions && !hasOngoingBookings;
      
      console.log('✅ Designer availability result:', {
        isAvailable,
        hasActiveSessions,
        hasOngoingBookings,
        designerId: designer.id
      });
      
      return isAvailable;
    } catch (error) {
      console.error('❌ Error checking designer availability:', error);
      // In case of errors, allow the session rather than blocking
      console.log('⚠️ Allowing session due to availability check error');
      return true;
    }
  };

  const handleLiveSessionRequest = async (designer: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile?.user_type !== 'client') {
      toast.error('Only clients can request live sessions');
      return;
    }

    // Check designer availability based on their schedule
    console.log('🔍 Designer object for availability check:', designer);
    console.log('🆔 Using designer ID:', designer.id);
    const availabilityResult = await checkDesignerBookingAvailability(designer.id);
    
    if (!availabilityResult.isAvailable) {
      toast.error(availabilityResult.reason || 'Designer is not available for live sessions');
      return;
    }

    console.log('✅ Designer is available, checking session availability...', {
      isInSchedule: availabilityResult.isInSchedule,
      isOnline: availabilityResult.isOnline,
      reason: availabilityResult.reason
    });

    // Check if designer is free
    const isAvailable = await checkDesignerAvailability(designer);
    if (!isAvailable) {
      // Try cleaning up stale sessions and check again
      console.log('🧹 Designer appears busy, attempting to clean up stale sessions...');
      const cleanupResult = await cleanupStaleSessions();
      
      if (cleanupResult.success && cleanupResult.cleaned.total > 0) {
        console.log('🧹 Found and cleaned up stale sessions, retrying availability check...');
        toast.success(`Cleaned up ${cleanupResult.cleaned.total} stale session(s). Retrying...`);
        
        // Check again after cleanup
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (designers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No designers found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <p className="text-muted-foreground font-medium">{designers.length} designers found</p>
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">
              {designers.filter(d => d.activity?.is_online || d.is_online).length} online now
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="relative">
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center space-x-2 bg-background border border-border px-4 py-2 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 min-w-[160px]"
            >
              <span className="text-sm font-medium">
                {sortOptions.find(option => option.value === sortBy)?.label}
              </span>
              <div className={`transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`}>
                ⌄
              </div>
            </button>
            
            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-lg z-10 py-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors ${
                      sortBy === option.value ? 'text-green-600 font-medium bg-green-50' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Designer Cards */}
      <div className="space-y-6">
        {designers.map((designer) => (
          <div key={designer.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 group">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Left Side - Profile Image */}
              <div className="flex-shrink-0">
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-xl group-hover:scale-105 transition-transform duration-300 shadow-lg">
                    {designer.profiles?.avatar_url ? (
                      <img 
                        src={designer.profiles.avatar_url} 
                        alt={`${designer.profiles?.first_name} ${designer.profiles?.last_name}`}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        {designer.profiles?.first_name?.[0]?.toUpperCase() || 'D'}
                        {designer.profiles?.last_name?.[0]?.toUpperCase() || 'E'}
                      </span>
                    )}
                  </div>
                  {(designer.activity?.is_online || designer.is_online) && (
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg z-10 ${
                      designer.activity?.activity_status === 'active' 
                        ? 'bg-green-400 animate-pulse' 
                        : designer.activity?.activity_status === 'idle'
                        ? 'bg-yellow-400'
                        : designer.is_online
                        ? 'bg-yellow-400' // Fallback to yellow for online designers without specific activity status
                        : 'bg-gray-400'
                    }`}>
                      <span className="text-xs sm:text-[10px] text-white font-bold">●</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle - Designer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-green-600 transition-colors duration-200">
                        {designer.profiles?.first_name && designer.profiles?.last_name 
                          ? `${designer.profiles.first_name} ${designer.profiles.last_name}` 
                          : designer.profiles?.email?.split('@')[0] || 'Designer'}
                      </h3>
                      {designer.kyc_status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          KYC Verified
                        </span>
                      )}
                    </div>
                    <p className="text-green-600 font-medium text-sm mb-1">{designer.specialty}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-lg font-semibold text-foreground ml-1">{designer.rating || 4.8}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (designer.activity?.is_online || designer.is_online)
                          ? (designer.activity?.activity_status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700')
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {designer.activity?.is_online || designer.is_online
                          ? (designer.activity?.activity_status === 'active' ? 'Active Now' : 'Available')
                          : 'Offline'
                        }
                      </span>
                    </div>

                    {/* Bio */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3 text-ellipsis">{designer.bio || 'Passionate designer ready to help you bring your vision to life.'}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                      {(designer.skills || []).map((skill, index) => (
                        <span key={index} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium hover:bg-green-100 hover:text-green-700 transition-colors duration-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Side - Price and Actions */}
                  <div className="flex-shrink-0 lg:text-right">
                    <div className="text-2xl font-bold text-foreground mb-1">
                    ₹{designer.hourly_rate}<span className="text-base font-normal text-muted-foreground">/min</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Usually responds in {designer.response_time || '1 hour'}</p>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 lg:w-48">
                      <Link 
                        to={`/designer/${designer.id}`} 
                        state={{ 
                          hideGlobalChrome: location.pathname.includes('/customer-dashboard'),
                          fromPath: location.pathname 
                        }}
                        className="bg-green-600 text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-green-700 transition-all duration-200 text-center flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Profile</span>
                      </Link>
                      {user ? (
                        <>
                          <button 
                            onClick={() => handleChat(designer.id)}
                            className="bg-background border border-green-600 text-green-600 py-2 px-4 rounded-xl text-sm font-medium hover:bg-green-50 transition-all duration-200 flex items-center justify-center space-x-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Chat</span>
                          </button>
                          <BookingDialog designer={designer}>
                            <Button className="bg-background border border-blue-600 text-blue-600 py-2 px-4 rounded-xl text-sm font-medium hover:bg-blue-50 transition-all duration-200 w-full flex items-center justify-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>Book Session</span>
                            </Button>
                          </BookingDialog>
                          <button 
                            onClick={() => handleLiveSessionRequest(designer)}
                            disabled={!(designer.activity?.is_online || designer.is_online)}
                            className={`py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                              (designer.activity?.is_online || designer.is_online)
                                ? 'bg-background border border-purple-600 text-purple-600 hover:bg-purple-50' 
                                : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Video className="w-4 h-4" />
                            <span>Live Design Session</span>
                          </button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <button 
                            onClick={() => navigate('/auth')}
                            className="bg-background border border-green-600 text-green-600 py-2 px-4 rounded-xl text-sm font-medium hover:bg-green-50 transition-all duration-200 flex items-center justify-center space-x-2 w-full"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Chat</span>
                          </button>
                          <button 
                            onClick={() => navigate('/auth')}
                            className="bg-background border border-blue-600 text-blue-600 py-2 px-4 rounded-xl text-sm font-medium hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2 w-full"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>Book Session</span>
                          </button>
                          <button 
                            onClick={() => navigate('/auth')}
                            className="bg-background border border-purple-600 text-purple-600 py-2 px-4 rounded-xl text-sm font-medium hover:bg-purple-50 transition-all duration-200 flex items-center justify-center space-x-2 w-full"
                          >
                            <Video className="w-4 h-4" />
                            <span>Live Session</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
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
          designerName={selectedDesigner?.profiles ? `${selectedDesigner.profiles.first_name} ${selectedDesigner.profiles.last_name}` : 'Designer'}
          customerName={profile ? `${profile.first_name} ${profile.last_name}` : 'Customer'}
          bookingId={undefined} // Live sessions don't have booking IDs
        />
      )}
    </div>
  );
};

export default DesignerGrid;
