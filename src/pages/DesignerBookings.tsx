import { useState } from 'react';
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const sidebarItems = [
  { title: "Dashboard", url: "/designer-dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/designer-dashboard/profile", icon: User },
  { title: "Portfolio", url: "/designer-dashboard/portfolio", icon: FolderOpen },
  { title: "Bookings", url: "/designer-dashboard/bookings", icon: Calendar },
  { title: "Availability", url: "/designer-dashboard/availability", icon: Clock },
  { title: "Earnings", url: "/designer-dashboard/earnings", icon: DollarSign },
  { title: "Session History", url: "/designer-dashboard/history", icon: History },
  { title: "Settings", url: "/designer-dashboard/settings", icon: Settings },
];

function DesignerSidebar() {
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
              <p className="font-semibold text-gray-900">Vb Bn</p>
              <p className="text-sm text-gray-500">Designer</p>
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
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 border-r-2 border-green-500' 
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

export default function DesignerBookings() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  // Sample booking data
  const bookings = {
    upcoming: [
      {
        id: 1,
        client: { name: "Sarah Johnson", avatar: "", email: "sarah@company.com" },
        project: "E-commerce Website Redesign",
        date: "Aug 15, 2025",
        time: "2:00 PM - 3:30 PM",
        type: "Video Call",
        duration: "1.5 hours",
        price: "$150",
        status: "confirmed",
        notes: "Focus on mobile responsiveness and user experience improvements"
      },
      {
        id: 2,
        client: { name: "Mike Chen", avatar: "", email: "mike@startup.io" },
        project: "Logo Design Consultation",
        date: "Aug 16, 2025",
        time: "10:00 AM - 11:00 AM",
        type: "In Person",
        duration: "1 hour",
        price: "$100",
        status: "confirmed",
        notes: "Logo concepts for tech startup, modern and minimalist style preferred"
      }
    ],
    pending: [
      {
        id: 3,
        client: { name: "Lisa Brown", avatar: "", email: "lisa@agency.com" },
        project: "Brand Identity Package",
        date: "Aug 18, 2025",
        time: "3:00 PM - 5:00 PM",
        type: "Video Call",
        duration: "2 hours",
        price: "$300",
        status: "pending",
        notes: "Complete brand identity including logo, colors, and guidelines"
      }
    ],
    completed: [
      {
        id: 4,
        client: { name: "David Wilson", avatar: "", email: "david@corp.com" },
        project: "Mobile App UI Design",
        date: "Aug 10, 2025",
        time: "1:00 PM - 2:30 PM",
        type: "Video Call",
        duration: "1.5 hours",
        price: "$200",
        status: "completed",
        rating: 5,
        feedback: "Excellent work! Very professional and creative approach."
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
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

  const renderBookingCard = (booking: any) => (
    <Card key={booking.id} className="hover:shadow-lg transition-all duration-300 border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={booking.client.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold">
                {booking.client.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{booking.project}</h3>
              <p className="text-gray-600 font-medium">{booking.client.name}</p>
              <p className="text-sm text-gray-500">{booking.client.email}</p>
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
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Client
                </DropdownMenuItem>
                {booking.status === 'pending' && (
                  <>
                    <DropdownMenuItem>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Booking
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline Booking
                    </DropdownMenuItem>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <DropdownMenuItem>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Reschedule
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{booking.date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{booking.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            {booking.type === 'Video Call' ? (
              <Video className="w-4 h-4 text-gray-400" />
            ) : (
              <MapPin className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">{booking.type}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-green-600">{booking.price}</span>
          </div>
        </div>

        {booking.notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">{booking.notes}</p>
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
            <span className="text-sm font-medium text-gray-700">{booking.duration}</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat
            </Button>
            {booking.status === 'confirmed' && (
              <Button size="sm" className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
                <Video className="w-4 h-4 mr-1" />
                Join Call
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
                        {bookings.upcoming.length} Upcoming
                      </span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">
                        {bookings.pending.length} Pending
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
                      Upcoming ({bookings.upcoming.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pending"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                    >
                      Pending ({bookings.pending.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="completed"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                    >
                      Completed ({bookings.completed.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="cancelled"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold"
                    >
                      Cancelled
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
                {bookings.upcoming.map(renderBookingCard)}
              </TabsContent>

              <TabsContent value="pending" className="space-y-6">
                {bookings.pending.map(renderBookingCard)}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6">
                {bookings.completed.map(renderBookingCard)}
              </TabsContent>

              <TabsContent value="cancelled" className="mt-6">
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <XCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No cancelled bookings</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                    You don't have any cancelled bookings.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}