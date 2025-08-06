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
  Eye,
  Star,
  TrendingUp,
  CalendarClock,
  Bell,
  LogOut
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
  { title: "Portfolio", url: "/designer-dashboard/portfolio", icon: FolderOpen },
  { title: "Bookings", url: "/designer-dashboard/bookings", icon: Calendar },
  { title: "Availability", url: "/designer-dashboard/availability", icon: Clock },
  { title: "Earnings", url: "/designer-dashboard/earnings", icon: DollarSign },
  { title: "Session History", url: "/designer-dashboard/history", icon: History },
  { title: "Settings", url: "/designer-dashboard/settings", icon: Settings },
];

function DesignerSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-background border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">Vb Bn</p>
              <p className="text-sm text-muted-foreground">Designer</p>
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
                            ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                        >
                        <item.icon className="w-5 h-5" />
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
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-border px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Designer Dashboard</h1>
                  <p className="text-muted-foreground">Manage your design business and showcase your talent</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-muted-foreground text-sm font-medium">Online</span>
                </div>
                <Bell className="w-5 h-5 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                      <span className="text-primary font-semibold text-sm">VB</span>
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

          <div className="p-6 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/designer-dashboard/bookings">
                <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground flex-col space-y-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Manage Bookings</span>
                </Button>
              </Link>
              <Link to="/designer-dashboard/portfolio">
                <Button variant="outline" className="w-full h-16 flex-col space-y-2">
                  <FolderOpen className="w-5 h-5" />
                  <span className="font-semibold">Update Portfolio</span>
                </Button>
              </Link>
              <Link to="/designer-dashboard/availability">
                <Button variant="outline" className="w-full h-16 flex-col space-y-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Set Availability</span>
                </Button>
              </Link>
              <Link to="/designer-dashboard/earnings">
                <Button variant="outline" className="w-full h-16 flex-col space-y-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-semibold">View Earnings</span>
                </Button>
              </Link>
            </div>

            {/* Active Design Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Active Design Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CalendarClock className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">You don't have any active design sessions at the moment.</p>
                  <p className="text-sm text-muted-foreground/80">When customers start a session with you, they will appear here.</p>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                      <p className="text-2xl font-bold text-foreground">$0.00</p>
                      <Link to="/designer-dashboard/earnings" className="text-sm text-primary hover:text-primary/80 flex items-center mt-2">
                        View earnings report
                        <TrendingUp className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Clients</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-sm text-gray-500 mt-2">0 pending bookings</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg. Rating</p>
                      <div className="flex items-center space-x-1">
                        <p className="text-2xl font-bold text-gray-900">0.0</p>
                        <Star className="w-5 h-5 text-yellow-400" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">From 0 completed sessions</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">0%</p>
                      <p className="text-sm text-gray-500 mt-2">0 completed sessions</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Earnings */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Earnings</CardTitle>
                  <CardDescription>Your earnings for the current week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No earnings data yet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>Your scheduled design sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No upcoming sessions</h3>
                    <p className="text-sm text-gray-500 mb-4">You don't have any design sessions scheduled.</p>
                    <Button variant="outline" size="sm">
                      Update Availability
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Response Time</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">0 min</p>
                  <p className="text-sm text-gray-500 mt-1">Average time to respond to booking requests</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-1">
                    <Eye className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Portfolio Views</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-500 mt-1">Number of times clients viewed your portfolio</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Profile Completion</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">85%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Complete your profile to attract more clients</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}