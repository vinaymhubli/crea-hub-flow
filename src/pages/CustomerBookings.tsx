import { useState } from 'react';
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
  Star,
  Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { CustomerBookingDetailsDialog } from "@/components/CustomerBookingDetailsDialog";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function BookingCard({ booking, onClick }: { booking: any; onClick: () => void }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Video className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-gradient-to-r from-green-100 to-teal-100 text-teal-700 border-teal-200">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200">Cancelled</Badge>;
      case 'in_progress':
        return <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const designerName = booking.designer?.user?.first_name && booking.designer?.user?.last_name
    ? `${booking.designer.user.first_name} ${booking.designer.user.last_name}`
    : 'Unknown Designer';

  const designerInitials = booking.designer?.user?.first_name && booking.designer?.user?.last_name
    ? `${booking.designer.user.first_name[0] || ''}${booking.designer.user.last_name[0] || ''}`
    : 'UD';

  return (
    <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer" onClick={onClick}>
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
            <span className="font-semibold text-foreground">₹{booking.total_amount}</span>
          </div>

          <div className="flex justify-center pt-3 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              View Details & Actions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerBookings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    bookings, 
    loading, 
    rescheduleBooking,
    refetch 
  } = useRealtimeBookings();

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
      
      refetch();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRescheduleBooking = async (bookingId: string, newDate: string) => {
    try {
      await rescheduleBooking(bookingId, newDate);
      toast({
        title: "Booking Rescheduled",
        description: "Your booking has been rescheduled successfully.",
      });
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filterBookings = (status: string) => {
    const filtered = bookings.filter(booking => {
      // Normalize status mapping
      if (status === 'upcoming') {
        return booking.status === 'pending' || booking.status === 'confirmed';
      }
      if (status === 'all') {
        return true;
      }
      return booking.status === status;
    });

    // Apply search filter
    return filtered.filter(booking => {
      const designerName = booking.designer?.user?.first_name && booking.designer?.user?.last_name
        ? `${booking.designer.user.first_name} ${booking.designer.user.last_name}`
        : '';
      return designerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             booking.service.toLowerCase().includes(searchQuery.toLowerCase());
    }).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());
  };

  const getBookingStats = () => {
    return {
      upcoming: filterBookings('upcoming').length,
      total: bookings.length,
      completed: filterBookings('completed').length,
      totalSpent: bookings.reduce((sum, booking) => sum + Number(booking.total_amount), 0)
    };
  };

  const stats = getBookingStats();

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
          <DashboardHeader
            title="My Bookings"
            subtitle="Manage your design sessions and appointments"
            userInitials="U"
            isOnline={true}
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-4">
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
            }
          />

          <div className="p-6 space-y-8">
            {/* Quick Stats and Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in">
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Upcoming Sessions</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.upcoming}</p>
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

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in bg-gradient-to-br from-blue-100 via-indigo-100 to-cyan-100" style={{animationDelay: '0.1s'}}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Total Sessions</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">{stats.total}</p>
                      <p className="text-sm text-blue-600 mt-3 font-medium">{stats.completed} completed</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <History className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in bg-gradient-to-br from-purple-100 via-violet-100 to-pink-100" style={{animationDelay: '0.2s'}}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Total Spent</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                      ₹{stats.totalSpent}
                      </p>
                      <p className="text-sm text-purple-600 mt-3 font-medium">This year</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-violet-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">₹</span>
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
                        {stats.completed}
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
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search bookings by designer name or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
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
                  {filterBookings('all').length === 0 ? (
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
                      {filterBookings('all').map((booking) => (
                        <BookingCard key={booking.id} booking={booking} onClick={() => handleBookingClick(booking)} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4 mt-6">
                  {filterBookings('upcoming').length === 0 ? (
                    <Card className="p-12 text-center">
                      <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming sessions</h3>
                      <p className="text-gray-600">Your next sessions will appear here</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filterBookings('upcoming').map((booking) => (
                        <BookingCard key={booking.id} booking={booking} onClick={() => handleBookingClick(booking)} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4 mt-6">
                  {filterBookings('completed').length === 0 ? (
                    <Card className="p-12 text-center">
                      <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed sessions</h3>
                      <p className="text-gray-600">Your completed sessions will appear here</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filterBookings('completed').map((booking) => (
                        <BookingCard key={booking.id} booking={booking} onClick={() => handleBookingClick(booking)} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4 mt-6">
                  {filterBookings('pending').length === 0 ? (
                    <Card className="p-12 text-center">
                      <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending sessions</h3>
                      <p className="text-gray-600">Sessions awaiting designer confirmation will appear here</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filterBookings('pending').map((booking) => (
                        <BookingCard key={booking.id} booking={booking} onClick={() => handleBookingClick(booking)} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        {/* Dialogs */}
        <CustomerBookingDetailsDialog
          booking={selectedBooking}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onCancelBooking={handleCancelBooking}
          onRescheduleBooking={() => {
            setShowDetailsDialog(false);
            setShowRescheduleDialog(true);
          }}
        />

        <RescheduleDialog
          open={showRescheduleDialog}
          onOpenChange={setShowRescheduleDialog}
          onReschedule={(newDate: string) => {
            if (selectedBooking) {
              handleRescheduleBooking(selectedBooking.id, newDate);
            }
            setShowRescheduleDialog(false);
          }}
          currentDate={selectedBooking?.scheduled_date || ''}
        />
      </div>
    </SidebarProvider>
  );
}