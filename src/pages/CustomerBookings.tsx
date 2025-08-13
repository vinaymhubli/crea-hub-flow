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
  AlertCircle,
  Plus,
  TrendingUp,
  ArrowUpRight,
  History,
  Filter
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

const recentDesigners = [
  { name: "Emma Thompson", rating: 4.9, specialty: "Logo & Brand Identity", initials: "EM", color: "bg-blue-500", sessions: 3, lastSession: "2 days ago", online: true },
  { name: "Marcus Chen", rating: 4.7, specialty: "UI/UX Design", initials: "MC", color: "bg-purple-500", sessions: 1, lastSession: "1 week ago", online: false },
  { name: "Sophie Williams", rating: 4.8, specialty: "Illustration", initials: "SW", color: "bg-green-500", sessions: 2, lastSession: "3 days ago", online: true },
  { name: "Alex Johnson", rating: 4.6, specialty: "Website Design", initials: "AJ", color: "bg-orange-500", sessions: 1, lastSession: "5 days ago", online: false },
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
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">VB</span>
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
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 border-r-2 border-gradient-to-b from-green-500 to-blue-500' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive(item.url) ? 'text-green-600' : ''}`} />
                      <span className="font-medium">{item.title}</span>
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
    <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
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

          <div className="flex space-x-3 pt-3 border-t">
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
                      <span className="text-white font-semibold text-sm">VB</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">VB</span>
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
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{mockBookings.length}</p>
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
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$770</p>
                      <p className="text-sm text-purple-600 mt-3 font-medium">This month</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.3s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Wallet Balance</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">$120</p>
                      <Link to="/customer-dashboard/wallet" className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center mt-3 font-medium group">
                        Add funds
                        <ArrowUpRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Bookings Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Search */}
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          placeholder="Search bookings..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-11"
                        />
                      </div>
                      <Button variant="outline" className="flex items-center space-x-2">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Bookings Tabs */}
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">Your Sessions</CardTitle>
                    <CardDescription>Track and manage all your design appointments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="upcoming" className="space-y-6">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="upcoming">
                          Upcoming ({filterBookings('upcoming').length})
                        </TabsTrigger>
                        <TabsTrigger value="pending">
                          Pending ({filterBookings('pending').length})
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                          Completed ({filterBookings('completed').length})
                        </TabsTrigger>
                        <TabsTrigger value="cancelled">
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
                              <p className="text-sm text-muted-foreground mb-4">Book a session with a designer to get started</p>
                              <Link to="/designers">
                                <Button className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white">
                                  Find a Designer
                                </Button>
                              </Link>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="space-y-4">
                            {filterBookings('upcoming').map((booking) => (
                              <BookingCard key={booking.id} booking={booking} />
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="pending" className="space-y-4">
                        {filterBookings('pending').length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No pending bookings</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filterBookings('pending').map((booking) => (
                              <BookingCard key={booking.id} booking={booking} />
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="completed" className="space-y-4">
                        {filterBookings('completed').length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No completed sessions yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filterBookings('completed').map((booking) => (
                              <BookingCard key={booking.id} booking={booking} />
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="cancelled" className="space-y-4">
                        {filterBookings('cancelled').length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No cancelled bookings</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filterBookings('cancelled').map((booking) => (
                              <BookingCard key={booking.id} booking={booking} />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Quick Wallet Actions */}
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                    <CardTitle className="flex items-center text-lg">
                      <Wallet className="w-5 h-5 mr-2" />
                      Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                        <p className="text-2xl font-bold text-foreground">$120.00</p>
                        <p className="text-xs text-green-600 mt-1">Available funds</p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Link to="/customer-dashboard/wallet">
                          <Button className="w-full bg-gradient-to-r from-green-400 to-teal-500 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Funds
                          </Button>
                        </Link>
                        <Button variant="outline" className="w-full">
                          <History className="w-4 h-4 mr-2" />
                          Transaction History
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Designers */}
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-foreground">Recent Designers</CardTitle>
                      <Link to="/customer-dashboard/recent-designers" className="text-primary hover:text-primary/80 text-sm font-medium">
                        View All
                      </Link>
                    </div>
                    <CardDescription>Your recently worked with designers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentDesigners.slice(0, 4).map((designer, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                          <div className={`w-10 h-10 ${designer.color} rounded-full flex items-center justify-center relative`}>
                            <span className="text-white font-semibold text-sm">{designer.initials}</span>
                            {designer.online && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{designer.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{designer.specialty}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-muted-foreground">{designer.rating}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{designer.sessions} sessions</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                              <MessageCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Link to="/designers">
                        <Button variant="ghost" className="w-full justify-start">
                          <Search className="w-4 h-4 mr-2" />
                          Find New Designer
                        </Button>
                      </Link>
                      <Link to="/customer-dashboard/messages">
                        <Button variant="ghost" className="w-full justify-start">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          View Messages
                        </Button>
                      </Link>
                      <Link to="/customer-dashboard/notifications">
                        <Button variant="ghost" className="w-full justify-start">
                          <Bell className="w-4 h-4 mr-2" />
                          Notifications
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}