import { useState, useEffect } from 'react';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { BookingDetailsDialog } from '@/components/BookingDetailsDialog';
import { RescheduleDialog } from '@/components/RescheduleDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  LayoutDashboard, 
  User, 
  FolderOpen, 
  Calendar, 
  Clock, 
  DollarSign, 
  History, 
  Settings,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  MessageCircle,
  Video,
  MapPin,
  Star,
  ChevronRight,
  CalendarDays,
  Phone,
  Mail,
  Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/DesignerSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function DesignerBookings() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [bookingToDecline, setBookingToDecline] = useState<any>(null);
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { 
    bookings: allBookings, 
    loading, 
    acceptBooking, 
    declineBooking, 
    rescheduleBooking, 
    startSession,
    setNewBookingCallback,
    refetch
  } = useRealtimeBookings();

  // Set up new booking notification callback
  useEffect(() => {
    setNewBookingCallback((booking) => {
      // Auto-switch to pending tab when new booking arrives
      if (booking.status === 'pending') {
        setActiveTab('pending');
      }
    });
  }, [setNewBookingCallback]);

  // Filter bookings by status and search query
  const getFilteredBookings = (status: string) => {
    let filtered = [];
    
    switch (status) {
      case 'upcoming':
        filtered = allBookings.filter(booking => {
          const bookingDate = new Date(booking.scheduled_date);
          const now = new Date();
          
          return (booking.status === 'confirmed' || booking.status === 'in_progress') && 
                 bookingDate >= now;
        });
        break;
      case 'pending':
        filtered = allBookings.filter(booking => booking.status === 'pending');
        break;
      case 'completed':
        filtered = allBookings.filter(booking => {
          const bookingDate = new Date(booking.scheduled_date);
          const now = new Date();
          
          return booking.status === 'completed' || 
                 (booking.status === 'confirmed' && bookingDate < now);
        });
        break;
      case 'cancelled':
        filtered = allBookings.filter(booking => booking.status === 'cancelled');
        break;
      default:
        filtered = [];
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => {
        const customerName = booking.customer 
          ? `${booking.customer.first_name || ''} ${booking.customer.last_name || ''}`.toLowerCase()
          : '';
        const service = booking.service?.toLowerCase() || '';
        const description = booking.description?.toLowerCase() || '';
        
        return customerName.includes(query) || 
               service.includes(query) || 
               description.includes(query);
      });
    }

    // Sort by date (earliest first for upcoming/pending, latest first for completed/cancelled)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.scheduled_date);
      const dateB = new Date(b.scheduled_date);
      
      if (status === 'upcoming' || status === 'pending') {
        return dateA.getTime() - dateB.getTime(); // earliest first
      } else {
        return dateB.getTime() - dateA.getTime(); // latest first
      }
    });
  };

  const upcomingBookings = getFilteredBookings('upcoming');
  const pendingBookings = getFilteredBookings('pending');
  const completedBookings = getFilteredBookings('completed');
  const cancelledBookings = getFilteredBookings('cancelled');

  // Action handlers
  const handleAcceptBooking = async (booking: any) => {
    await acceptBooking(booking.id);
    await refetch(); // Refetch to see updated status
    setShowDetailsDialog(false);
  };

  const handleDeclineBooking = (booking: any) => {
    setBookingToDecline(booking);
    setShowDeclineDialog(true);
  };

  const confirmDeclineBooking = async () => {
    if (bookingToDecline) {
      await declineBooking(bookingToDecline.id);
      await refetch(); // Refetch to see updated status
      setShowDeclineDialog(false);
      setShowDetailsDialog(false);
      setBookingToDecline(null);
    }
  };

  const handleRescheduleBooking = async (newDateTime: string) => {
    if (selectedBooking) {
      await rescheduleBooking(selectedBooking.id, newDateTime);
      await refetch(); // Refetch to see updated date
      setShowRescheduleDialog(false);
      setShowDetailsDialog(false);
    }
  };

  const handleJoinSession = async (booking: any) => {
    const result = await startSession(booking.id);
    if (result.success) {
      navigate(`/session/${booking.id}`);
    }
  };

  const handleMessageClient = (booking: any) => {
    navigate(`/designer-dashboard/messages?booking_id=${booking.id}`);
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderBookingCard = (booking: any) => {
    const customerName = booking.customer 
      ? `${booking.customer.first_name || ''} ${booking.customer.last_name || ''}`.trim()
      : 'Unknown Customer';
    
    const formatDate = (dateString: string) => {
      try {
        return format(new Date(dateString), 'MMM dd, yyyy');
      } catch {
        return 'Invalid Date';
      }
    };

    const formatTime = (dateString: string, duration: number) => {
      try {
        const startTime = format(new Date(dateString), 'h:mm a');
        const endTime = format(new Date(new Date(dateString).getTime() + duration * 60 * 60 * 1000), 'h:mm a');
        return `${startTime} - ${endTime}`;
      } catch {
        return 'Invalid Time';
      }
    };

    return (
      <Card key={booking.id} className="hover:shadow-lg transition-all duration-300 border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold">
                  {customerName.split(' ').map((n: string) => n[0]).join('') || 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{booking.service}</h3>
                <p className="text-gray-600 font-medium">{customerName}</p>
                <p className="text-sm text-gray-500">Customer</p>
              </div>
            </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(booking.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMessageClient(booking)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Client
                </DropdownMenuItem>
                {booking.status === 'pending' && (
                  <>
                    <DropdownMenuItem onClick={() => handleAcceptBooking(booking)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Booking
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeclineBooking(booking)}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline Booking
                    </DropdownMenuItem>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <>
                    <DropdownMenuItem onClick={() => handleJoinSession(booking)}>
                      <Video className="w-4 h-4 mr-2" />
                      Join Session
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowRescheduleDialog(true)}>
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Reschedule
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{formatDate(booking.scheduled_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{formatTime(booking.scheduled_date, booking.duration_hours)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Video Call</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-green-600">${booking.total_amount}</span>
            </div>
          </div>

          {booking.description && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">{booking.description}</p>
            </div>
          )}

        {booking.rating && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < booking.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({booking.rating}/5)</span>
          </div>
        )}

        {booking.feedback && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800 italic">"{booking.feedback}"</p>
          </div>
        )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Duration:</span>
              <span className="text-sm font-medium text-gray-700">{booking.duration_hours} hour{booking.duration_hours !== 1 ? 's' : ''}</span>
            </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleMessageClient(booking)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat
            </Button>
            {booking.status === 'confirmed' && (
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white"
                onClick={() => handleJoinSession(booking)}
              >
                <Video className="w-4 h-4 mr-1" />
                Join Session
              </Button>
            )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Enhanced Header */}
          <header className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2" />
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Bookings</h1>
                    <p className="text-white/90 text-lg">Manage your design sessions and client appointments</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-white/90 font-medium">
                        {upcomingBookings.length} Upcoming
                      </span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">
                        {pendingBookings.length} Pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
                <CalendarDays className="w-4 h-4 mr-2" />
                Calendar View
              </Button>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-8">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
                  <TabsList className="grid w-auto grid-cols-4 bg-transparent gap-2">
                    <TabsTrigger 
                      value="upcoming"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                    >
                      Upcoming ({upcomingBookings.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pending"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                    >
                      Pending ({pendingBookings.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="completed"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                    >
                      Completed ({completedBookings.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="cancelled"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                    >
                      Cancelled ({cancelledBookings.length})
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 border-gray-200 focus:border-green-400 focus:ring-green-200"
                    />
                  </div>
                  <Button variant="outline" className="border-gray-300">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <TabsContent value="upcoming" className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">Loading bookings...</div>
                ) : upcomingBookings.length > 0 ? (
                  upcomingBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-20">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming bookings</h3>
                    <p className="text-gray-500">Your upcoming sessions will appear here.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">Loading bookings...</div>
                ) : pendingBookings.length > 0 ? (
                  pendingBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-20">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending bookings</h3>
                    <p className="text-gray-500">Pending booking requests will appear here.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">Loading bookings...</div>
                ) : completedBookings.length > 0 ? (
                  completedBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-20">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed bookings</h3>
                    <p className="text-gray-500">Your completed sessions will appear here.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">Loading bookings...</div>
                ) : cancelledBookings.length > 0 ? (
                  cancelledBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <XCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No cancelled bookings</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                      You don't have any cancelled bookings.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Dialogs */}
      <BookingDetailsDialog
        booking={selectedBooking}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onAccept={() => selectedBooking && handleAcceptBooking(selectedBooking)}
        onDecline={() => selectedBooking && handleDeclineBooking(selectedBooking)}
        onReschedule={() => setShowRescheduleDialog(true)}
        onJoinSession={() => selectedBooking && handleJoinSession(selectedBooking)}
        onMessageClient={() => selectedBooking && handleMessageClient(selectedBooking)}
      />

      <RescheduleDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        onReschedule={handleRescheduleBooking}
        currentDate={selectedBooking?.scheduled_date || ''}
      />

      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline this booking? This action cannot be undone and the customer will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeclineBooking}
              className="bg-red-500 hover:bg-red-600"
            >
              Decline Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}