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
      <SidebarContent className="bg-background border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">Viaan Bindra</p>
              <p className="text-sm text-muted-foreground">Customer</p>
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
                          ? 'bg-gradient-to-r from-teal-50 to-blue-50 text-teal-600 border-r-2 border-teal-500' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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

  return (
    <Card className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border border-teal-200/30 hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-sm">{booking.designerImage}</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{booking.designer}</h3>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-sm text-muted-foreground">{booking.designerRating}</span>
              </div>
            </div>
          </div>
          {getStatusBadge(booking.status)}
        </div>

        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">{booking.service}</p>
            <p className="text-sm text-muted-foreground">{booking.duration} session</p>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
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
            <span className="font-semibold text-foreground">{booking.price}</span>
          </div>

          <div className="flex space-x-3 pt-3 border-t border-teal-200/30">
            {booking.status === 'upcoming' && (
              <>
                <Button className="flex-1 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white hover:shadow-lg transition-all duration-300">
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
                <Button variant="outline" className="flex-1 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </>
            )}
            {booking.status === 'completed' && (
              <>
                <Button variant="outline" className="flex-1 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50">
                  <Star className="w-4 h-4 mr-2" />
                  Rate Designer
                </Button>
                <Button variant="outline" className="flex-1 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50">
                  View Files
                </Button>
              </>
            )}
            {booking.status === 'pending' && (
              <>
                <Button variant="outline" className="flex-1 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-100 border-teal-300/50">
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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-teal-50/30 to-blue-50/20">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 text-white px-6 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
                  <p className="text-green-100">Manage your design sessions and appointments</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-green-100" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <span className="text-white font-semibold text-sm">VB</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">VB</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Viaan Bindra</p>
                          <p className="text-sm text-muted-foreground">customer@example.com</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/customer-dashboard/wallet" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <Wallet className="w-4 h-4 mr-3" />
                          Wallet
                        </Link>
                        <Link 
                          to="/customer-dashboard/profile" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Floating decorative elements */}
            <div className="absolute top-4 right-20 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-6 right-32 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-12 right-40 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-500"></div>
          </header>

          <div className="p-6 space-y-8">
            {/* Search */}
            <Card className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border border-teal-200/30 shadow-lg">
              <CardContent className="p-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 w-5 h-5" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 border-teal-200/50 focus:border-teal-400 focus:ring-teal-400/20"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bookings Tabs */}
            <Card className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border border-teal-200/30 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">Your Sessions</CardTitle>
                <CardDescription>Track and manage all your design appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upcoming" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-teal-50 to-blue-50">
                    <TabsTrigger value="upcoming" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                      Upcoming ({filterBookings('upcoming').length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                      Pending ({filterBookings('pending').length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                      Completed ({filterBookings('completed').length})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                      Cancelled ({filterBookings('cancelled').length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upcoming" className="space-y-4">
                    {filterBookings('upcoming').length === 0 ? (
                      <Card className="bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 border border-teal-200/50">
                        <CardContent className="py-12 text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-100 via-teal-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <CalendarClock className="w-8 h-8 text-teal-600" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">No upcoming sessions</h3>
                          <p className="text-sm text-muted-foreground mb-4">You don't have any design sessions scheduled.</p>
                          <Link to="/designers">
                            <Button className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white hover:shadow-lg transition-all duration-300">
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
                      <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 border border-yellow-200/50">
                        <CardContent className="py-12 text-center">
                          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                          <h3 className="font-semibold text-foreground mb-2">No pending sessions</h3>
                          <p className="text-sm text-muted-foreground">All your sessions have been confirmed.</p>
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
                      <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200/50">
                        <CardContent className="py-12 text-center">
                          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                          <h3 className="font-semibold text-foreground mb-2">No completed sessions</h3>
                          <p className="text-sm text-muted-foreground">Your completed sessions will appear here.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filterBookings('completed').map(booking => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="cancelled" className="space-y-4">
                    <Card className="bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 border border-red-200/50">
                      <CardContent className="py-12 text-center">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="font-semibold text-foreground mb-2">No cancelled sessions</h3>
                        <p className="text-sm text-muted-foreground">Your cancelled sessions will appear here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}