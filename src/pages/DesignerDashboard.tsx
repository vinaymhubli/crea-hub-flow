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
  Sparkles,
  ArrowUpRight,
  Target,
  Zap,
  BarChart3,
  Users,
  CheckCircle
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
import { Progress } from "@/components/ui/progress";

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
      <SidebarContent className="bg-gradient-subtle border-r border-gray-100/50">
        <div className="p-6 border-b border-gray-100/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">VB</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">Vb Bn</p>
              <p className="text-sm text-gray-500">Pro Designer</p>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupContent className="px-4">
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 mb-1 ${
                        isActive(item.url) 
                          ? 'bg-gradient-primary text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-white/80 hover:shadow-md'
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
      <div className="min-h-screen flex w-full" style={{ background: 'var(--gradient-subtle)' }}>
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Modern Header */}
          <header className="bg-card/95 backdrop-blur-sm border-b border-border px-6 py-6 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="hover:bg-accent/50 p-2 rounded-lg transition-colors" />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Good morning, Vb!
                  </h1>
                  <p className="text-muted-foreground flex items-center space-x-2 mt-1">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Ready to create something amazing today?</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Bell className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
                  <span className="text-primary-foreground font-bold text-sm">VB</span>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Quick Actions */}
            <div className="animate-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-accent" />
                <span>Quick Actions</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/designer-dashboard/bookings" className="group">
                  <Button className="h-16 w-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                    <Calendar className="w-5 h-5 mr-3" />
                    <span className="font-medium">View Bookings</span>
                    <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
                <Link to="/designer-dashboard/portfolio" className="group">
                  <Button variant="outline" className="h-16 w-full border-2 hover:border-primary/50 hover:bg-primary/5 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                    <FolderOpen className="w-5 h-5 mr-3" />
                    <span className="font-medium">Update Portfolio</span>
                  </Button>
                </Link>
                <Link to="/designer-dashboard/availability" className="group">
                  <Button variant="outline" className="h-16 w-full border-2 hover:border-primary/50 hover:bg-primary/5 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                    <Clock className="w-5 h-5 mr-3" />
                    <span className="font-medium">Set Availability</span>
                  </Button>
                </Link>
                <Link to="/designer-dashboard/profile" className="group">
                  <Button variant="outline" className="h-16 w-full border-2 hover:border-primary/50 hover:bg-primary/5 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                    <User className="w-5 h-5 mr-3" />
                    <span className="font-medium">Edit Profile</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Active Sessions Card */}
            <Card className="border-0 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-4 delay-150">
              <div className="p-8 text-white relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Active Design Sessions</h2>
                    <p className="text-primary-foreground/80">Manage your ongoing client work</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <CalendarClock className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
              </div>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarClock className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">No active sessions</h3>
                  <p className="text-muted-foreground mb-6">When clients start a session with you, they will appear here.</p>
                  <Button variant="outline" className="hover:bg-primary/5 hover:border-primary/50 transition-all duration-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    Check Your Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <div className="animate-scale-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span>Performance Overview</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="card-modern hover-lift border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        +0%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">$0.00</p>
                      <Link to="/designer-dashboard/earnings" className="text-sm text-primary hover:text-primary/80 flex items-center transition-colors">
                        View details
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-modern hover-lift border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        New
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Clients</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
                      <p className="text-sm text-gray-500">0 pending bookings</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-modern hover-lift border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">0.0</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">0.0</p>
                      <p className="text-sm text-gray-500">From 0 reviews</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-modern hover-lift border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-purple-600" />
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        Goal
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">0%</p>
                      <p className="text-sm text-gray-500">0 completed sessions</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Weekly Performance */}
              <Card className="lg:col-span-2 card-glow border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Weekly Performance</CardTitle>
                      <CardDescription>Your earnings and activity this week</CardDescription>
                    </div>
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gradient-subtle rounded-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                        <BarChart3 className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">No data yet</h3>
                      <p className="text-gray-500 text-sm">Start taking sessions to see your performance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Completion */}
              <Card className="card-modern border-0">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Profile Setup</CardTitle>
                      <CardDescription>Complete your profile</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-bold text-primary">85%</span>
                    </div>
                    <Progress value={85} className="h-3" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Basic information</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Portfolio uploaded</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-400">Availability set</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-400">Payment setup</span>
                    </div>
                  </div>

                  <Button className="w-full btn-gradient">
                    Complete Setup
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-modern hover-lift border-0">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Response Time</p>
                      <p className="text-2xl font-bold text-gray-900">0 min</p>
                      <p className="text-xs text-gray-500">Avg. booking response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern hover-lift border-0">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Portfolio Views</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">Views this month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern hover-lift border-0">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Success Score</p>
                      <p className="text-2xl font-bold text-gradient">95%</p>
                      <p className="text-xs text-gray-500">Platform rating</p>
                    </div>
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