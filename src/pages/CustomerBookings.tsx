import { useState, useEffect } from 'react';
import { 
  Calendar, 
  MessageCircle, 
  Bell,
  LogOut,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  History,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Booking {
  id: string;
  service: string;
  status: string;
  description: string;
  requirements: string;
  created_at: string;
  total_amount: number;
  scheduled_date: string;
  duration_hours: number;
  customer_id: string;
  designer_id: string;
  designer?: {
    user_id: string;
    specialty: string;
    hourly_rate: number;
    portfolio_images: string[];
    response_time: string;
    location: string;
    skills: string[];
    bio: string;
    is_online: boolean;
    completion_rate: number;
    reviews_count: number;
    rating: number;
    profile?: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  };
}

function BookingCard({ booking }: { booking: Booking }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-gradient-to-r from-green-100 to-teal-100 text-teal-700 border-teal-200">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-gradient-to-r from-teal-100 to-blue-100 text-blue-700 border-blue-200">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const designerName = booking.designer?.profile 
    ? `${booking.designer.profile.first_name} ${booking.designer.profile.last_name}`
    : 'Unknown Designer';

  const designerInitials = booking.designer?.profile 
    ? `${booking.designer.profile.first_name?.[0] || ''}${booking.designer.profile.last_name?.[0] || ''}`
    : 'UD';

  return (
    <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-sm">{designerInitials}</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{designerName}</h3>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-sm text-muted-foreground">{booking.designer?.rating || 0}</span>
              </div>
            </div>
          </div>
          {getStatusBadge(booking.status)}
        </div>

        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">{booking.service}</p>
            <p className="text-sm text-muted-foreground">{booking.duration_hours} hour session</p>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(booking.status)}
                <span>{new Date(booking.scheduled_date).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Video className="w-4 h-4" />
                <span>Video Call</span>
              </div>
            </div>
            <span className="font-semibold text-foreground">${booking.total_amount}</span>
          </div>

          <div className="flex space-x-3 pt-3 border-t">
            {booking.status === 'pending' && (
              <>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Designer
                </Button>
                <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                  Cancel
                </Button>
              </>
            )}
            {booking.status === 'upcoming' && (
              <>
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white hover:shadow-lg transition-all duration-300"
                  onClick={() => window.location.href = `/session/${booking.id}`}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </>
            )}
            {booking.status === 'completed' && (
              <>
                <Button variant="outline" className="flex-1">
                  <Star className="w-4 h-4 mr-2" />
                  Rate Designer
                </Button>
                <Button variant="outline" className="flex-1">
                  View Files
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerBookings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          designer:designers!inner(
            *,
            profile:profiles!designers_user_id_fkey(
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('customer_id', user?.id)
        .order('scheduled_date', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = (status: string) => {
    return bookings
      .filter(booking => {
        if (status === 'upcoming') {
          return booking.status === 'pending' || 
                 (booking.status === 'confirmed' && new Date(booking.scheduled_date) > new Date());
        }
        return booking.status === status;
      })
      .filter(booking => {
        const designerName = booking.designer?.profile 
          ? `${booking.designer.profile.first_name} ${booking.designer.profile.last_name}`
          : '';
        return designerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               booking.service.toLowerCase().includes(searchQuery.toLowerCase());
      });
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <CustomerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading bookings...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 to-blue-500 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20" />
                <div>
                  <h1 className="text-2xl font-bold text-white">My Bookings</h1>
                  <p className="text-white/80">Manage your design sessions and appointments</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-sm font-medium">Online</span>
                </div>
                <Bell className="w-5 h-5 text-white/80" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <span className="text-white font-semibold text-sm">U</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">U</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">User</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Dashboard
                        </Link>
                        <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
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
            {/* Quick Stats and Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in">
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Upcoming Sessions</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{filterBookings('upcoming').length}</p>
                      <Link to="/designers" className="text-sm text-green-600 hover:text-green-700 flex items-center mt-3 font-medium group">
                        Book new session
                        <Plus className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.1s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Total Sessions</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{bookings.length}</p>
                      <p className="text-sm text-blue-600 mt-3 font-medium">{filterBookings('completed').length} completed</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <History className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.2s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Total Spent</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        ${bookings.reduce((sum, booking) => sum + Number(booking.total_amount), 0)}
                      </p>
                      <p className="text-sm text-purple-600 mt-3 font-medium">This year</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">$</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.3s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Pending Reviews</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                        {filterBookings('completed').length}
                      </p>
                      <p className="text-sm text-orange-600 mt-3 font-medium">Rate designers</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Tabs */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search bookings by designer name or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All Bookings</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-6">
                  {bookings.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                      <p className="text-gray-600 mb-6">Start by finding and booking your first designer</p>
                      <Link to="/designers">
                        <Button>Find Designers</Button>
                      </Link>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {bookings
                        .filter(booking => 
                          searchQuery === '' || 
                          booking.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (booking.designer?.profile?.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (booking.designer?.profile?.last_name || '').toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filterBookings('upcoming').map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="completed" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filterBookings('completed').map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="pending" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filterBookings('pending').map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}