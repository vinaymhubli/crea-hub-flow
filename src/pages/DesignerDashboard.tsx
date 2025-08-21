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
  MessageSquare,
  Eye,
  Star,
  TrendingUp,
  CalendarClock,
  Bell,
  LogOut,
  Package
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { RealtimeSessionIndicator } from '@/components/RealtimeSessionIndicator';
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const sidebarItems = [
  { title: "Dashboard", url: "/designer-dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/designer-dashboard/profile", icon: User },
  { title: "Services", url: "/designer-dashboard/services", icon: Package },
  { title: "Portfolio", url: "/designer-dashboard/portfolio", icon: FolderOpen },
  { title: "Bookings", url: "/designer-dashboard/bookings", icon: Calendar },
  { title: "Messages", url: "/designer-dashboard/messages", icon: MessageSquare },
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

export default function DesignerDashboard() {
  const { signOut } = useAuth();
  const { activeSession, getUpcomingBookings, getCompletedBookings, loading } = useRealtimeBookings();
  
  const upcomingBookings = getUpcomingBookings();
  const completedBookings = getCompletedBookings();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 to-blue-500 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Designer Dashboard</h1>
                  <p className="text-white/80">Manage your design business and showcase your talent</p>
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
                          <p className="font-semibold text-foreground">Vb Bn</p>
                          <p className="text-sm text-muted-foreground">lvbn200@gmail.com</p>
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
                          onClick={handleLogout}
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
            </div>
          </header>

          <div className="p-6 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/designer-dashboard/services" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <Package className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">Manage Services</h3>
                      <p className="text-white/80 text-sm">Create & edit offerings</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/designer-dashboard/bookings" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.1s'}}>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <Calendar className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">Manage Bookings</h3>
                      <p className="text-white/80 text-sm">View & organize sessions</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/designer-dashboard/portfolio" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <FolderOpen className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">Update Portfolio</h3>
                      <p className="text-white/80 text-sm">Showcase your work</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/designer-dashboard/earnings" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.3s'}}>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <DollarSign className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">View Earnings</h3>
                      <p className="text-white/80 text-sm">Track your income</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Active Design Sessions */}
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-100 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white">
                <CardTitle className="text-xl flex items-center">
                  <CalendarClock className="w-6 h-6 mr-3" />
                  Active Design Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {activeSession ? (
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-green-800">Live Session</span>
                      </div>
                      <Link 
                        to={`/session/${activeSession.id}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Join Session
                      </Link>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{activeSession.service}</h3>
                    <p className="text-gray-600">
                      with {activeSession.customer?.first_name} {activeSession.customer?.last_name}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarClock className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Sessions</h3>
                    <p className="text-gray-600 mb-4">You don't have any active design sessions at the moment.</p>
                    <p className="text-sm text-gray-500">When customers start a session with you, they will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.5s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Total Earnings</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">$0.00</p>
                      <Link to="/designer-dashboard/earnings" className="text-sm text-green-600 hover:text-green-700 flex items-center mt-3 font-medium group">
                        View earnings report
                        <TrendingUp className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.6s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Total Clients</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{completedBookings.length}</p>
                      <p className="text-sm text-blue-600 mt-3 font-medium">{upcomingBookings.length} upcoming bookings</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.7s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Avg. Rating</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">0.0</p>
                        <Star className="w-6 h-6 text-yellow-400 fill-current" />
                      </div>
                      <p className="text-sm text-yellow-600 font-medium">From 0 completed sessions</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.8s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Completion Rate</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {completedBookings.length > 0 ? '100' : '0'}%
                      </p>
                      <p className="text-sm text-purple-600 mt-3 font-medium">{completedBookings.length} completed sessions</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Weekly Earnings Chart */}
              <Card className="overflow-hidden border-0 shadow-lg animate-fade-in" style={{animationDelay: '0.9s'}}>
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-6 h-6 mr-3" />
                    Weekly Earnings
                  </CardTitle>
                  <CardDescription className="text-indigo-100">Your earnings for the current week</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-2">No Earnings Data</h3>
                      <p className="text-gray-600">Start taking sessions to see your weekly progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Sessions */}
              <Card className="overflow-hidden border-0 shadow-lg animate-fade-in" style={{animationDelay: '1.0s'}}>
                <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                  <CardTitle className="flex items-center">
                    <CalendarClock className="w-6 h-6 mr-3" />
                    Upcoming Sessions
                  </CardTitle>
                  <CardDescription className="text-teal-100">Your scheduled design sessions</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarClock className="w-8 h-8 text-teal-500" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2">No Upcoming Sessions</h3>
                    <p className="text-gray-600 mb-6">You don't have any design sessions scheduled.</p>
                    <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 transition-all duration-300 hover:scale-105">
                      Update Availability
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '1.1s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Response Time</h3>
                      <p className="text-sm text-gray-600">Average response to bookings</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">0 min</p>
                  <p className="text-sm text-amber-600 font-medium">Respond faster to get more bookings</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '1.2s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-rose-50 to-pink-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Portfolio Views</h3>
                      <p className="text-sm text-gray-600">Times clients viewed your work</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">0</p>
                  <p className="text-sm text-rose-600 font-medium">Update your portfolio to attract clients</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '1.3s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-emerald-50 to-green-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Profile Completion</h3>
                      <p className="text-sm text-gray-600">Complete to attract more clients</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">85%</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-sm text-emerald-600 font-medium">Almost there! Complete your profile</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <RealtimeSessionIndicator />
      </div>
    </SidebarProvider>
  );
}
