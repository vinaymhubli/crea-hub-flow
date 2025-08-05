import { useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  MessageCircle, 
  CreditCard,
  Bell,
  Settings,
  Search,
  Users,
  Wallet,
  ChevronRight,
  CalendarClock,
  Star,
  LogOut,
  Clock,
  MapPin,
  Video,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const sidebarItems = [
  { title: "Dashboard", url: "/customer-dashboard", icon: LayoutDashboard },
  { title: "Find Designer", url: "/designers", icon: Search },
  { title: "My Bookings", url: "/customer-dashboard/bookings", icon: Calendar },
  { title: "Messages", url: "/customer-dashboard/messages", icon: MessageCircle },
  { title: "Recent Designers", url: "/customer-dashboard/recent-designers", icon: Users },
  { title: "Wallet", url: "/customer-dashboard/wallet", icon: Wallet },
  { title: "Notifications", url: "/customer-dashboard/notifications", icon: Bell },
  { title: "Profile", url: "/customer-dashboard/profile", icon: User },
  { title: "Settings", url: "/customer-dashboard/settings", icon: Settings },
];

const mockBookings = [
  {
    id: 1,
    designer: "Emma Thompson",
    service: "Logo Design",
    date: "2025-08-08",
    time: "2:00 PM",
    duration: "2 hours",
    status: "upcoming",
    type: "video",
    price: "$150",
    designerImage: "EM",
    designerRating: 4.9
  },
  {
    id: 2,
    designer: "Marcus Chen",
    service: "UI/UX Consultation",
    date: "2025-08-10",
    time: "10:00 AM",
    duration: "1 hour",
    status: "upcoming",
    type: "video",
    price: "$120",
    designerImage: "MC",
    designerRating: 4.7
  },
  {
    id: 3,
    designer: "Sophie Williams",
    service: "Brand Identity",
    date: "2025-07-30",
    time: "3:00 PM",
    duration: "3 hours",
    status: "completed",
    type: "video",
    price: "$300",
    designerImage: "SW",
    designerRating: 4.8
  },
  {
    id: 4,
    designer: "Alex Johnson",
    service: "Website Design",
    date: "2025-08-12",
    time: "1:00 PM",
    duration: "2 hours",
    status: "pending",
    type: "video",
    price: "$200",
    designerImage: "AJ",
    designerRating: 4.6
  }
];

function CustomerSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Viaan Bindra</p>
              <p className="text-sm text-gray-500">Customer</p>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.url) 
                          ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                      {isActive(item.url) && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function BookingCard({ booking }: { booking: any }) {
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
        return <Badge className="bg-blue-100 text-blue-700">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">{booking.designerImage}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{booking.designer}</h3>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">{booking.designerRating}</span>
              </div>
            </div>
          </div>
          {getStatusBadge(booking.status)}
        </div>

        <div className="space-y-3">
          <div>
            <p className="font-medium text-gray-900">{booking.service}</p>
            <p className="text-sm text-gray-600">{booking.duration} session</p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(booking.status)}
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Video className="w-4 h-4" />
                <span>Video Call</span>
              </div>
            </div>
            <span className="font-semibold text-gray-900">{booking.price}</span>
          </div>

          <div className="flex space-x-3 pt-3 border-t border-gray-100">
            {booking.status === 'upcoming' && (
              <>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerBookings() {
  const [searchQuery, setSearchQuery] = useState('');

  const filterBookings = (status: string) => {
    return mockBookings
      .filter(booking => booking.status === status)
      .filter(booking => 
        booking.designer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.service.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                  <p className="text-gray-600">Manage your design sessions</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                      <span className="text-blue-600 font-semibold text-sm">VB</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">VB</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Viaan Bindra</p>
                          <p className="text-sm text-gray-500">customer@example.com</p>
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

          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Bookings Tabs */}
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upcoming">Upcoming ({filterBookings('upcoming').length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({filterBookings('pending').length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({filterBookings('completed').length})</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled ({filterBookings('cancelled').length})</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {filterBookings('upcoming').length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CalendarClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">No upcoming sessions</h3>
                      <p className="text-sm text-gray-500 mb-4">You don't have any design sessions scheduled.</p>
                      <Link to="/designers">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          Find a Designer
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  filterBookings('upcoming').map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {filterBookings('pending').length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">No pending sessions</h3>
                      <p className="text-sm text-gray-500">All your sessions have been confirmed.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filterBookings('pending').map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {filterBookings('completed').length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">No completed sessions</h3>
                      <p className="text-sm text-gray-500">Your completed sessions will appear here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filterBookings('completed').map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4">
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No cancelled sessions</h3>
                    <p className="text-sm text-gray-500">Your cancelled sessions will appear here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}