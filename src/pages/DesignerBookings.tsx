import { useState, useEffect } from 'react';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { BookingDetailsDialog } from '@/components/BookingDetailsDialog';
import { RescheduleDialog } from '@/components/RescheduleDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  Eye,
  Package,
  LogOut
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/DesignerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationBell from '@/components/NotificationBell';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export default function DesignerBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [bookingToDecline, setBookingToDecline] = useState<any>(null);
  const [recentlyAcceptedBookingId, setRecentlyAcceptedBookingId] = useState<string | null>(null);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [filterOptions, setFilterOptions] = useState({
    dateRange: { start: '', end: '' },
    serviceType: '',
    status: '',
    minAmount: '',
    maxAmount: ''
  });
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // URL-driven tab state
  const activeTab = searchParams.get('tab') || 'upcoming';
  
  const setActiveTab = (tab: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    setSearchParams(newSearchParams);
  };
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
  }, []); // Remove setNewBookingCallback from dependencies

  // Filter bookings by status and search query
  const getFilteredBookings = (status: string) => {
    let filtered = [];
    
    switch (status) {
      case 'upcoming':
        // Include only confirmed bookings that haven't been completed yet
        filtered = allBookings.filter(booking => 
          booking.status === 'confirmed'
        );
        break;
      case 'pending':
        filtered = allBookings.filter(booking => booking.status === 'pending');
        break;
      case 'completed':
        // Include bookings marked as completed, and also in_progress bookings 
        // (which should be treated as completed if the session has ended)
        filtered = allBookings.filter(booking => 
          booking.status === 'completed' || booking.status === 'in_progress'
        );
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

    // Apply advanced filters
    if (filterOptions.dateRange.start) {
      filtered = filtered.filter(booking => 
        new Date(booking.scheduled_date) >= new Date(filterOptions.dateRange.start)
      );
    }
    if (filterOptions.dateRange.end) {
      filtered = filtered.filter(booking => 
        new Date(booking.scheduled_date) <= new Date(filterOptions.dateRange.end)
      );
    }
    if (filterOptions.serviceType) {
      filtered = filtered.filter(booking => 
        booking.service?.toLowerCase().includes(filterOptions.serviceType.toLowerCase())
      );
    }
    if (filterOptions.status) {
      filtered = filtered.filter(booking => booking.status === filterOptions.status);
    }
    if (filterOptions.minAmount) {
      filtered = filtered.filter(booking => 
        booking.total_amount >= parseFloat(filterOptions.minAmount)
      );
    }
    if (filterOptions.maxAmount) {
      filtered = filtered.filter(booking => 
        booking.total_amount <= parseFloat(filterOptions.maxAmount)
      );
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

  // Action handlers with optimistic updates
  const handleAcceptBooking = async (booking: any) => {
    try {
      console.log(`Accepting booking ${booking.id} with current status: ${booking.status}`);
      
      // Set tab to upcoming immediately (optimistic UI)
      setActiveTab('upcoming');
      
      // Mark this booking as recently accepted for highlighting
      setRecentlyAcceptedBookingId(booking.id);
      
      // Accept the booking
      await acceptBooking(booking.id);
      
      console.log(`Booking ${booking.id} accepted successfully`);
      
      // Show success toast
      toast({
        title: "Booking accepted",
        description: "Booking moved to Upcoming — customer has been notified.",
      });
      
      setShowDetailsDialog(false);
      
      // Clear highlighting after 3 seconds
      setTimeout(() => {
        setRecentlyAcceptedBookingId(null);
      }, 3000);
      
    } catch (error) {
      console.error(`Error accepting booking ${booking.id}:`, error);
      toast({
        title: "Error",
        description: "Failed to accept booking. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleCalendarView = () => {
    setShowCalendarView(!showCalendarView);
  };

  const handleFilterClick = () => {
    setShowFilterDialog(true);
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilterOptions(newFilters);
    setShowFilterDialog(false);
  };

  const handleClearFilters = () => {
    setFilterOptions({
      dateRange: { start: '', end: '' },
      serviceType: '',
      status: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  // Calendar month navigation
  const goToPrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCalendarMonth(new Date());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
      case 'in_progress':
        // For in_progress bookings, show as completed since they should be in the completed tab
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
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
    
    // Check if this booking was recently accepted for highlighting
    const isRecentlyAccepted = recentlyAcceptedBookingId === booking.id;
    
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
      <Card 
        key={booking.id} 
        className={`hover:shadow-lg transition-all duration-300 border ${
          isRecentlyAccepted 
            ? 'border-green-400 bg-green-50 shadow-lg ring-2 ring-green-200' 
            : 'border-gray-200'
        }`}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold text-sm sm:text-base">
                  {customerName.split(' ').map((n: string) => n[0]).join('') || 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base truncate">{booking.service}</h3>
                <p className="text-gray-600 font-medium text-sm truncate">{customerName}</p>
                <p className="text-xs sm:text-sm text-gray-500">Customer</p>
              </div>
            </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {getStatusBadge(booking.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:h-9 sm:w-9">
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600 truncate">{formatDate(booking.scheduled_date)}</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600 truncate">{formatTime(booking.scheduled_date, booking.duration_hours)}</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">Video Call</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-green-600">₹{booking.total_amount}</span>
            </div>
          </div>

          {booking.description && (
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{booking.description}</p>
            </div>
          )}

        {booking.rating && (
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    i < booking.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-gray-600">({booking.rating}/5)</span>
          </div>
        )}

        {booking.feedback && (
          <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-blue-800 italic line-clamp-2">"{booking.feedback}"</p>
          </div>
        )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm text-gray-500">Duration:</span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">{booking.duration_hours} hour{booking.duration_hours !== 1 ? 's' : ''}</span>
            </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleMessageClient(booking)}
              className="flex-1 sm:flex-none text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Chat
            </Button>
            {booking.status === 'confirmed' && (
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white flex-1 sm:flex-none text-xs"
                onClick={() => handleJoinSession(booking)}
              >
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Join Session</span>
                <span className="sm:hidden">Join</span>
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
          <DashboardHeader
            title="Bookings"
            subtitle="Manage your design sessions and client appointments"
            icon={<Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            additionalInfo={
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
                <span className="text-white/90 font-medium">
                  {upcomingBookings.length} Upcoming
                </span>
                <span className="text-white/60">•</span>
                <span className="text-white/90 font-medium">
                  {pendingBookings.length} Pending
                </span>
              </div>
            }
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-4">
                <NotificationBell />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {profile?.first_name && profile?.last_name 
                          ? `${profile.first_name[0]}${profile.last_name[0]}`
                          : user?.email ? user.email.substring(0, 2).toUpperCase()
                          : 'D'}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-64 w-fit p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {profile?.first_name && profile?.last_name 
                              ? `${profile.first_name[0]}${profile.last_name[0]}`
                              : user?.email ? user.email.substring(0, 2).toUpperCase()
                              : 'D'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {profile?.first_name && profile?.last_name 
                              ? `${profile.first_name} ${profile.last_name}`
                              : user?.email?.split('@')[0] || 'Designer'}
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
                <Button 
                  onClick={handleCalendarView}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 font-medium text-xs sm:text-sm w-full sm:w-auto"
                >
                  <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {showCalendarView ? 'List View' : 'Calendar View'}
                </Button>
              </div>
            }
          />

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {showCalendarView ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar View</h2>
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-2 sm:space-x-3">
                      <Button variant="outline" className="rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-4" onClick={goToPrevMonth}>
                        Prev
                      </Button>
                      <Button variant="outline" className="rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-4" onClick={goToToday}>
                        Today
                      </Button>
                      <Button variant="outline" className="rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-4" onClick={goToNextMonth}>
                        Next
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-yellow-100 border border-yellow-300"></div>
                        <span className="text-gray-600">Pending</span>
                      </div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-100 border border-green-300"></div>
                        <span className="text-gray-600">Confirmed</span>
                      </div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-100 border border-blue-300"></div>
                        <span className="text-gray-600">Completed</span>
                      </div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-100 border border-red-300"></div>
                        <span className="text-gray-600">Cancelled</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-semibold text-gray-600 py-1 sm:py-2 text-xs sm:text-sm">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {Array.from({ length: 42 }, (_, i) => {
                      const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
                      const startDate = new Date(firstDay);
                      startDate.setDate(startDate.getDate() - firstDay.getDay() + i);
                      
                      const dayBookings = allBookings.filter(booking => {
                        const bookingDate = new Date(booking.scheduled_date);
                        return bookingDate.toDateString() === startDate.toDateString();
                      });
                      
                      const isCurrentMonth = startDate.getMonth() === calendarMonth.getMonth();
                      const isToday = startDate.toDateString() === new Date().toDateString();
                      
                      return (
                        <div
                          key={i}
                          className={`min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] p-1 sm:p-2 border border-gray-200 rounded-md sm:rounded-lg ${
                            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                          } ${isToday ? 'ring-1 sm:ring-2 ring-blue-500' : ''}`}
                        >
                          <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {startDate.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayBookings.slice(0, 2).map(booking => {
                              const getBookingColor = (status: string) => {
                                switch (status) {
                                  case 'pending':
                                    return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
                                  case 'confirmed':
                                    return 'bg-green-100 text-green-800 hover:bg-green-200';
                                  case 'completed':
                                    return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
                                  case 'cancelled':
                                    return 'bg-red-100 text-red-800 hover:bg-red-200';
                                  default:
                                    return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
                                }
                              };
                              
                              return (
                                <div
                                  key={booking.id}
                                  className={`text-xs p-1 rounded truncate cursor-pointer transition-colors ${getBookingColor(booking.status)}`}
                                  onClick={() => handleViewDetails(booking)}
                                  title={`${booking.service} - ${booking.status}`}
                                >
                                  {booking.service}
                                </div>
                              );
                            })}
                            {dayBookings.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayBookings.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-1.5 sm:p-2 overflow-x-auto">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-transparent gap-1.5 sm:gap-2 min-w-max lg:min-w-0 !h-fit">
                    <TabsTrigger 
                      value="upcoming"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl py-2 sm:py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Upcoming ({upcomingBookings.length})</span>
                      <span className="sm:hidden">Upcoming</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pending"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl py-2 sm:py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Pending ({pendingBookings.length})</span>
                      <span className="sm:hidden">Pending</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="completed"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl py-2 sm:py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Completed ({completedBookings.length})</span>
                      <span className="sm:hidden">Done</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="cancelled"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl py-2 sm:py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Cancelled ({cancelledBookings.length})</span>
                      <span className="sm:hidden">Cancelled</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full border-gray-200 focus:border-green-400 focus:ring-green-200 text-sm"
                    />
                  </div>
                  <Button 
                    onClick={handleFilterClick}
                    variant="outline" 
                    className="border-gray-300 hover:bg-gray-50 rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 font-medium transition-all duration-200 text-sm w-full sm:w-auto"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <TabsContent value="upcoming" className="space-y-4 sm:space-y-6">
                {loading ? (
                  <div className="text-center py-8 sm:py-12 text-sm sm:text-base">Loading bookings...</div>
                ) : upcomingBookings.length > 0 ? (
                  upcomingBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-12 sm:py-16 lg:py-20">
                    <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 px-4">No upcoming bookings</h3>
                    <p className="text-gray-500 text-sm sm:text-base px-4">Your upcoming sessions will appear here.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4 sm:space-y-6">
                {loading ? (
                  <div className="text-center py-8 sm:py-12 text-sm sm:text-base">Loading bookings...</div>
                ) : pendingBookings.length > 0 ? (
                  pendingBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-12 sm:py-16 lg:py-20">
                    <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 px-4">No pending bookings</h3>
                    <p className="text-gray-500 text-sm sm:text-base px-4">Pending booking requests will appear here.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 sm:space-y-6">
                {loading ? (
                  <div className="text-center py-8 sm:py-12 text-sm sm:text-base">Loading bookings...</div>
                ) : completedBookings.length > 0 ? (
                  completedBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-12 sm:py-16 lg:py-20">
                    <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 px-4">No completed bookings</h3>
                    <p className="text-gray-500 text-sm sm:text-base px-4">Your completed sessions will appear here.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4 sm:space-y-6">
                {loading ? (
                  <div className="text-center py-8 sm:py-12 text-sm sm:text-base">Loading bookings...</div>
                ) : cancelledBookings.length > 0 ? (
                  cancelledBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-12 sm:py-16 lg:py-20">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl">
                      <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-4">No cancelled bookings</h3>
                    <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base lg:text-lg px-4">
                      You don't have any cancelled bookings.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            )}
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

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <Filter className="w-6 h-6 mr-2 text-blue-600" />
              Filter Bookings
            </DialogTitle>
            <p className="text-gray-600">
              Apply filters to find specific bookings
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Date Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filterOptions.dateRange.start}
                    onChange={(e) => setFilterOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filterOptions.dateRange.end}
                    onChange={(e) => setFilterOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                placeholder="e.g., Logo Design, Web Development"
                value={filterOptions.serviceType}
                onChange={(e) => setFilterOptions(prev => ({
                  ...prev,
                  serviceType: e.target.value
                }))}
                className="rounded-xl"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filterOptions.status}
                onValueChange={(value) => setFilterOptions(prev => ({
                  ...prev,
                  status: value
                }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Amount Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Minimum Amount (₹)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    placeholder="0"
                    value={filterOptions.minAmount}
                    onChange={(e) => setFilterOptions(prev => ({
                      ...prev,
                      minAmount: e.target.value
                    }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Maximum Amount (₹)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    placeholder="10000"
                    value={filterOptions.maxAmount}
                    onChange={(e) => setFilterOptions(prev => ({
                      ...prev,
                      maxAmount: e.target.value
                    }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="rounded-xl px-6 py-2.5 border-gray-300 hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Clear Filters
            </Button>
            <Button 
              onClick={() => handleApplyFilters(filterOptions)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-xl px-6 py-2.5 border-0"
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}