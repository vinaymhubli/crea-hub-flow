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
  Video
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
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

function DesignerCard({ designer, favorites, onToggleFavorite, onMessage, onBookAgain, onLiveSession }: { 
  designer: RecentDesigner; 
  favorites: Set<string>;
  onToggleFavorite: (designerId: string) => void;
  onMessage: (designerId: string, bookingId?: string) => void;
  onBookAgain: (designerId: string) => void;
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
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src={designer.profile?.avatar_url} alt={designerName} />
                <AvatarFallback className="bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 text-white font-semibold text-lg">
                  {designerInitials}
                </AvatarFallback>
              </Avatar>
              {designer.is_online && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{designerName}</h3>
              <p className="text-gray-600 font-medium">{designer.specialty}</p>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-700">{designer.rating}</span>
                <span className="text-sm text-gray-500">({designer.reviews_count} reviews)</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">₹{designer.hourly_rate}/min</p>
            {designer.location && (
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-sm text-gray-500">{designer.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-gray-600">{designer.bio}</p>
          
          <div className="flex flex-wrap gap-2">
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

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Last worked</p>
              <p className="font-medium text-gray-900">
                {designer.lastWorkedAt 
                  ? designer.lastWorkedAt.toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-gray-500">
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
              <p className="font-medium text-gray-900">{designer.response_time}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <BadgeIcon className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">{designer.completion_rate}% completion rate</span>
            </div>
            {designer.is_online && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">Online now</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            type="button"
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg"
            onClick={() => onMessage(designer.id, designer.latestBookingId)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button 
            type="button"
            variant="outline" 
            className="flex-1 border-2 border-gradient-to-r from-green-400 to-blue-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50"
            onClick={() => onBookAgain(designer.id)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book Again
          </Button>
          <Button 
            type="button"
            variant="outline" 
            className="flex-1 border-2 border-gradient-to-r from-purple-400 to-pink-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50"
            onClick={() => onLiveSession(designer)}
          >
            <Video className="w-4 h-4 mr-2" />
            Live Session
          </Button>
          <Button 
            type="button"
            variant="outline" 
            size="icon" 
            className={`border-2 transition-all duration-200 ${
              isFavorite 
                ? 'border-red-400 bg-red-50 hover:bg-red-100' 
                : 'border-gradient-to-r from-green-400 to-blue-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50'
            }`}
            onClick={() => onToggleFavorite(designer.id)}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
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
  const { user } = useAuth();
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
            user:profiles!user_id(
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('customer_id', user?.id)
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

  const handleBookAgain = (designerId: string) => {
    navigate(`/designer/${designerId}`);
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

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <CustomerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading recent designers...</p>
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
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 border-b-0 px-6 py-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Recent Designers</h1>
                  <p className="text-white/90">Designers you've worked with previously</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-white/80 hover:text-white cursor-pointer transition-colors" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 ring-2 ring-white/30">
                      <span className="text-white font-semibold text-sm">U</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">U</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">User</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 rounded-md transition-colors"
                        >
                          Dashboard
                        </Link>
                        <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-red-50 rounded-md transition-colors">
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

          <div className="p-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search designers, skills, or specialties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
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
                  <SelectTrigger className="w-32">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm text-gray-600 mb-1">Total Designers</p>
                       <p className="text-3xl font-bold text-green-600">{filteredDesigners.length}</p>
                     </div>
                     <Users className="w-12 h-12 text-green-500" />
                   </div>
                 </CardContent>
               </Card>

               <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-lg">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm text-gray-600 mb-1">Online Now</p>
                       <p className="text-3xl font-bold text-blue-600">
                         {filteredDesigners.filter(d => d.is_online).length}
                       </p>
                     </div>
                     <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                       <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                       <p className="text-3xl font-bold text-purple-600">
                         {filteredDesigners.length > 0 
                           ? (filteredDesigners.reduce((sum, d) => sum + d.rating, 0) / filteredDesigners.length).toFixed(1)
                           : '0.0'
                         }
                       </p>
                     </div>
                     <Star className="w-12 h-12 text-yellow-500 fill-current" />
                   </div>
                 </CardContent>
              </Card>
            </div>

            {/* Designers Grid */}
            {filteredDesigners.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent designers</h3>
                <p className="text-gray-600 mb-6">Start working with designers to see them here</p>
                <Link to="/designers">
                  <Button>Find Designers</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                 {filteredDesigners.map((designer) => (
                   <DesignerCard 
                     key={designer.id} 
                     designer={designer} 
                     favorites={favorites}
                     onToggleFavorite={toggleFavorite}
                     onMessage={handleMessage}
                     onBookAgain={handleBookAgain}
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