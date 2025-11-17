import { useState, useEffect } from 'react';
import { 
  Search,
  Users,
  Star,
  MapPin,
  MessageCircle,
  Calendar,
  Badge as BadgeIcon,
  Heart,
  Bell,
  LogOut,
  Video,
  LayoutDashboard,
  Wallet,
  User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import NotificationBell from '@/components/NotificationBell';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LiveSessionRequestDialog from "@/components/LiveSessionRequestDialog";
import { checkDesignerBookingAvailability } from "@/utils/availabilityUtilsSlots";
import { BookingDialog } from "@/components/BookingDialog";

interface RecentDesigner {
  id: string;
  user_id: string;
  specialty: string;
  hourly_rate: number;
  location: string;
  skills: string[];
  bio: string;
  is_online: boolean;
  completion_rate: number;
  reviews_count: number;
  rating: number;
  response_time: string;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  lastWorkedAt?: Date;
  projectsCompleted?: number;
  ongoingCount?: number;
  totalSpent?: number;
  latestBookingId?: string;
}

function DesignerCard({ designer, favorites, onToggleFavorite, onMessage, onLiveSession }: { 
  designer: RecentDesigner; 
  favorites: Set<string>;
  onToggleFavorite: (designerId: string) => void;
  onMessage: (designerId: string, bookingId?: string) => void;
  onLiveSession: (designer: RecentDesigner) => void;
}) {
  const designerName = designer.profile 
    ? `${designer.profile.first_name} ${designer.profile.last_name}`
    : 'Unknown Designer';

  const designerInitials = designer.profile 
    ? `${designer.profile.first_name?.[0] || ''}${designer.profile.last_name?.[0] || ''}`
    : 'UD';

  const isFavorite = favorites.has(designer.id);

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white via-gray-50 to-green-50/30 backdrop-blur-sm hover:scale-[1.02]">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-0">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="w-14 h-14 sm:w-16 sm:h-16">
                <AvatarImage src={designer.profile?.avatar_url} alt={designerName} />
                <AvatarFallback className="bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 text-white font-semibold text-base sm:text-lg">
                  {designerInitials}
                </AvatarFallback>
              </Avatar>
              {designer.is_online && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate flex items-center gap-2">{designerName}
                {(designer.verification_status === 'approved' || designer.kyc_status === 'approved') && (
                  <span className="inline-flex items-center text-green-700 text-[10px] sm:text-xs bg-green-100 px-1.5 py-0.5 rounded">
                    ✓ Verified
                  </span>
                )}
              </h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base truncate">{designer.specialty}</p>
              {designer.rating && designer.rating > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">{designer.rating}</span>
              </div>
              )}
            </div>
          </div>
          <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start flex-shrink-0">
            <p className="font-semibold text-gray-900 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent text-base sm:text-lg">₹{designer.hourly_rate}/min</p>
            {designer.location && (
              <div className="flex items-center space-x-1 mt-0 sm:mt-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-500">{designer.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3 mb-4">
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{designer.bio}</p>
          
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {designer.skills?.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {designer.skills?.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{designer.skills.length - 3} more
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <p className="text-gray-500">Last worked</p>
              <p className="font-medium text-gray-900 truncate">
                {designer.lastWorkedAt 
                  ? designer.lastWorkedAt.toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-gray-500 truncate">
                {(designer.projectsCompleted || 0) === 0 && (designer.ongoingCount || 0) > 0 
                  ? 'Ongoing projects' 
                  : 'Projects completed'
                }
              </p>
              <p className="font-medium text-gray-900">
                {(designer.projectsCompleted || 0) === 0 && (designer.ongoingCount || 0) > 0 
                  ? designer.ongoingCount 
                  : designer.projectsCompleted || 0
                }
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total spent</p>
              <p className="font-medium text-gray-900">₹{designer.totalSpent || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Response time</p>
              <p className="font-medium text-gray-900 truncate">{designer.response_time}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-1">
              <BadgeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
              <span className="text-gray-600">{designer.completion_rate}% completion</span>
            </div>
            {designer.is_online && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">Online now</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:space-x-3 gap-2 sm:gap-0">
          <Button 
            type="button"
            className="col-span-2 sm:col-span-1 sm:flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg text-xs sm:text-sm"
            onClick={() => onMessage(designer.id, designer.latestBookingId)}
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Message
          </Button>
          <BookingDialog
            designer={{
              id: designer.id,
              user_id: designer.user_id,
              hourly_rate: designer.hourly_rate,
              specialty: designer.specialty,
              first_name: designer.profile?.first_name || 'Unknown',
              last_name: designer.profile?.last_name || 'Designer',
              avatar_url: designer.profile?.avatar_url
            }}
          >
          <Button 
            type="button"
            variant="outline" 
            className="sm:flex-1 border-2 border-gradient-to-r from-green-400 to-blue-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 text-xs sm:text-sm"
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Book Again</span>
            <span className="sm:hidden">Book</span>
          </Button>
          </BookingDialog>
          <Button 
            type="button"
            variant="outline" 
            className="sm:flex-1 border-2 border-gradient-to-r from-purple-400 to-pink-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 text-xs sm:text-sm"
            onClick={() => onLiveSession(designer)}
          >
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Live Session</span>
            <span className="sm:hidden">Live</span>
          </Button>
          <Button 
            type="button"
            variant="outline" 
            size="icon" 
            className={`border-2 transition-all duration-200 h-9 w-9 sm:h-10 sm:w-10 ${
              isFavorite 
                ? 'border-red-400 bg-red-50 hover:bg-red-100' 
                : 'border-gradient-to-r from-green-400 to-blue-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50'
            }`}
            onClick={() => onToggleFavorite(designer.id)}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerRecentDesigners() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [recentDesigners, setRecentDesigners] = useState<RecentDesigner[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showLiveSessionDialog, setShowLiveSessionDialog] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState<RecentDesigner | null>(null);
  const { user, profile, signOut } = useAuth();

  const userDisplayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email || 'Customer';

  const userInitials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email ? user.email.substring(0, 2).toUpperCase()
    : 'CU';
  const navigate = useNavigate();

  // Load favorites from localStorage
  useEffect(() => {
    if (user?.id) {
      const storedFavorites = localStorage.getItem(`recent_favorites:${user.id}`);
      if (storedFavorites) {
        setFavorites(new Set(JSON.parse(storedFavorites)));
      }
    }
  }, [user?.id]);

  const toggleFavorite = (designerId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(designerId)) {
      newFavorites.delete(designerId);
    } else {
      newFavorites.add(designerId);
    }
    setFavorites(newFavorites);
    
    if (user?.id) {
      localStorage.setItem(`recent_favorites:${user.id}`, JSON.stringify(Array.from(newFavorites)));
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentDesigners();
    }
  }, [user]);

  const fetchRecentDesigners = async () => {
    try {
      setLoading(true);
      
      // Get distinct designers from user's bookings with proper profile data
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          designer_id,
          total_amount,
          created_at,
          status,
          designer:designers!inner(
            id,
            user_id,
            specialty,
            hourly_rate,
            location,
            skills,
            bio,
            is_online,
            completion_rate,
            reviews_count,
            rating,
            response_time,
            verification_status,
            kyc_status,
            user:profiles!user_id(
              first_name,
              last_name,
              avatar_url,
              user_type
            )
          )
        `)
        .eq('customer_id', user?.id)
        .eq('designer.user.user_type', 'designer') // Only show users with designer role
        .eq('designer.verification_status', 'approved') // Only show approved designers
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recent designers:', error);
        return;
      }

      // Process bookings to get unique designers with correct stats
      const designerMap = new Map<string, RecentDesigner>();
      
      bookings?.forEach(booking => {
        const designerId = booking.designer_id;
        const designer = booking.designer;
        const bookingDate = new Date(booking.created_at);
        
        if (!designerMap.has(designerId)) {
          designerMap.set(designerId, {
            ...designer,
            profile: designer.user, // Set profile from user data
            lastWorkedAt: bookingDate,
            projectsCompleted: 0,
            ongoingCount: 0,
            totalSpent: 0,
            latestBookingId: booking.id
          });
        }
        
        const existing = designerMap.get(designerId)!;
        
        // Count projects by status
        if (booking.status === 'completed') {
          existing.projectsCompleted = (existing.projectsCompleted || 0) + 1;
        } else {
          existing.ongoingCount = (existing.ongoingCount || 0) + 1;
        }
        
        existing.totalSpent = (existing.totalSpent || 0) + Number(booking.total_amount);
        
        // Update last worked to most recent and track latest booking
        if (bookingDate > existing.lastWorkedAt!) {
          existing.lastWorkedAt = bookingDate;
          existing.latestBookingId = booking.id;
        }
      });

      // Sort by most recent first
      const designersArray = Array.from(designerMap.values()).sort((a, b) => 
        (b.lastWorkedAt?.getTime() || 0) - (a.lastWorkedAt?.getTime() || 0)
      );

      setRecentDesigners(designersArray);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (designerId: string, bookingId?: string) => {
    const path = bookingId 
      ? `/customer-dashboard/messages?booking=${bookingId}`
      : '/customer-dashboard/messages';
    navigate(path);
  };


  const handleLiveSession = async (designer: RecentDesigner) => {
    try {
      // Check if designer is available based on their schedule
      const availabilityResult = await checkDesignerBookingAvailability(designer.id);
      
      if (!availabilityResult.isAvailable) {
        // Show error message
        return;
      }

      setSelectedDesigner(designer);
      setShowLiveSessionDialog(true);
    } catch (error) {
      console.error('Error checking designer availability:', error);
    }
  };

  const filteredDesigners = recentDesigners
    .filter(designer => {
      const designerName = designer.profile 
        ? `${designer.profile.first_name} ${designer.profile.last_name}`
        : '';
      return designerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             designer.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
             designer.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    })
    .filter(designer => {
      if (filterBy === 'online') return designer.is_online;
      if (filterBy === 'favorites') return favorites.has(designer.id);
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.hourly_rate - b.hourly_rate;
        case 'projects':
          return (b.projectsCompleted || 0) - (a.projectsCompleted || 0);
        case 'recent':
          return (b.lastWorkedAt?.getTime() || 0) - (a.lastWorkedAt?.getTime() || 0);
        default:
          return 0;
      }
    });

  // Limit to top 10 most recent after filters/sort
  const displayedDesigners = filteredDesigners.slice(0, 10);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <CustomerSidebar />
          <main className="flex-1">
            <DashboardHeader
              title="Recent Designers"
              subtitle="Designers you've worked with previously"
              icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
              userInitials={userInitials}
              isOnline={true}
              actionButton={
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <NotificationBell />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                        <span className="text-white font-semibold text-xs sm:text-sm">{userInitials}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-64 w-fit p-0" align="end">
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 min-w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">{userInitials}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{userDisplayName}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-1">
                          <Link 
                            to="/customer-dashboard" 
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 mr-3" />
                            Dashboard
                          </Link>
                          <Link 
                            to="/customer-dashboard/wallet" 
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <Wallet className="w-4 h-4 mr-3" />
                            Wallet
                          </Link>
                          <Link 
                            to="/customer-dashboard/profile" 
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <User className="w-4 h-4 mr-3" />
                            Profile
                          </Link>
                          <Separator className="my-2" />
                          <button 
                            onClick={async () => {
                              try {
                                await signOut();
                              } catch (error) {
                                console.error('Error signing out:', error);
                              }
                            }}
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
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading recent designers...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <CustomerSidebar />
        
        <main className="flex-1">
          <DashboardHeader
            title="Recent Designers"
            subtitle="Designers you've worked with previously"
            icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            userInitials={userInitials}
            isOnline={true}
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-4">
                <NotificationBell />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                      <span className="text-white font-semibold text-xs sm:text-sm">{userInitials}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-64 w-fit p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 min-w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">{userInitials}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{userDisplayName}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/customer-dashboard/wallet" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Wallet className="w-4 h-4 mr-3" />
                          Wallet
                        </Link>
                        <Link 
                          to="/customer-dashboard/profile" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button 
                          onClick={async () => {
                            try {
                              await signOut();
                            } catch (error) {
                              console.error('Error signing out:', error);
                            }
                          }}
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

          <div className="p-4 sm:p-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search designers, skills, or specialties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price">Lowest Price</SelectItem>
                    <SelectItem value="projects">Most Projects</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="favorites">Favorites</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                     <div>
                       <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Designers</p>
                       <p className="text-2xl sm:text-3xl font-bold text-green-600">{filteredDesigners.length}</p>
                     </div>
                     <Users className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
                   </div>
                 </CardContent>
               </Card>

               <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-lg">
                 <CardContent className="p-4 sm:p-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-xs sm:text-sm text-gray-600 mb-1">Online Now</p>
                       <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                         {filteredDesigners.filter(d => d.is_online).length}
                       </p>
                     </div>
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                       <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg">
                 <CardContent className="p-4 sm:p-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-xs sm:text-sm text-gray-600 mb-1">Avg Rating</p>
                       <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                         {displayedDesigners.length > 0 
                           ? (displayedDesigners.reduce((sum, d) => sum + (Number(d.rating) || 0), 0) / displayedDesigners.length).toFixed(1)
                           : '0.0'
                         }
                       </p>
                     </div>
                     <Star className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 fill-current" />
                   </div>
                 </CardContent>
              </Card>
            </div>

            {/* Designers Grid */}
            {filteredDesigners.length === 0 ? (
              <Card className="p-8 sm:p-12 text-center">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No recent designers</h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">Start working with designers to see them here</p>
                <Link to="/designers">
                  <Button className="text-sm sm:text-base">Find Designers</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                 {displayedDesigners.map((designer) => (
                   <DesignerCard 
                     key={designer.id} 
                     designer={designer} 
                     favorites={favorites}
                     onToggleFavorite={toggleFavorite}
                     onMessage={handleMessage}
                     onLiveSession={handleLiveSession}
                   />
                 ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Live Session Dialog */}
      {selectedDesigner && (
        <LiveSessionRequestDialog
          isOpen={showLiveSessionDialog}
          onClose={() => {
            setShowLiveSessionDialog(false);
            setSelectedDesigner(null);
          }}
          designer={selectedDesigner}
          onSessionStart={(sessionId) => {
            setShowLiveSessionDialog(false);
            setSelectedDesigner(null);
            navigate(`/live-call-session/${sessionId}`);
          }}
        />
      )}
    </SidebarProvider>
  );
}