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
  Bell
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
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Vb Bn</p>
              <p className="text-sm text-gray-500">designer</p>
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
                          ? 'bg-green-50 text-green-600 border-r-2 border-green-600' 
                          : 'text-gray-700 hover:bg-gray-50'
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
      <div className="min-h-screen flex w-full bg-gray-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600">Welcome back, Designer</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">VB</span>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="h-12 bg-blue-600 hover:bg-blue-700 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                View Bookings
              </Button>
              <Button variant="outline" className="h-12 border-gray-300 hover:bg-gray-50">
                <FolderOpen className="w-4 h-4 mr-2" />
                Update Portfolio
              </Button>
              <Button variant="outline" className="h-12 border-gray-300 hover:bg-gray-50">
                <Clock className="w-4 h-4 mr-2" />
                Set Availability
              </Button>
              <Button variant="outline" className="h-12 border-gray-300 hover:bg-gray-50">
                <User className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            {/* Active Design Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Active Design Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CalendarClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">You don't have any active design sessions at the moment.</p>
                  <p className="text-sm text-gray-400">When customers start a session with you, they will appear here.</p>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">$0.00</p>
                      <Link to="/designer-dashboard/earnings" className="text-sm text-green-600 hover:text-green-700 flex items-center mt-2">
                        View earnings report
                        <TrendingUp className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
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
                  
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">Notification System Active</span>
                    </div>
                    <p className="text-sm text-green-700">You'll receive alerts when customers request sessions</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}