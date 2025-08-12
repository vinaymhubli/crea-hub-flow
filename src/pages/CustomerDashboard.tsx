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
  FileImage,
  Download,
  Info,
  Bot,
  ThumbsUp,
  Users2,
  Clock,
  TrendingUp,
  Activity,
  CheckCircle,
  DollarSign,
  Plus,
  Filter,
  MoreVertical,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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

const recentDesigners = [
  { name: "Emma Thompson", rating: 4.9, specialty: "Logo & Brand Identity", initials: "EM", color: "bg-blue-500" },
  { name: "Marcus Chen", rating: 4.7, specialty: "UI/UX Design", initials: "MA", color: "bg-purple-500" },
  { name: "Sophie Williams", rating: 4.8, specialty: "Illustration", initials: "SO", color: "bg-green-500", online: true },
];

const recentProjects = [
  { 
    title: "Company Rebrand", 
    designer: "Emma Thompson", 
    date: "7/29/2025", 
    image: "/placeholder.svg" 
  },
  { 
    title: "Website Banner Design", 
    designer: "Marcus Chen", 
    date: "7/22/2025", 
    image: "/placeholder.svg" 
  },
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
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
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 text-green-600 border-r-2 border-green-500' 
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

export default function CustomerDashboard() {
  const { signOut } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const stats = [
    { label: 'Wallet Balance', value: '$120.00', change: '+5.2%', icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
    { label: 'Total Sessions', value: '18', change: '+12%', icon: Activity, color: 'from-blue-500 to-indigo-500' },
    { label: 'Projects Completed', value: '12', change: '+8%', icon: CheckCircle, color: 'from-purple-500 to-pink-500' },
    { label: 'Hours Saved', value: '24h', change: '+15%', icon: Clock, color: 'from-orange-500 to-red-500' }
  ];

  const upcomingSessions = [
    {
      id: 1,
      designer: 'Emma Thompson',
      title: 'Logo Design Review',
      time: '2:00 PM Today',
      duration: '60 min',
      status: 'confirmed',
      avatar: 'ET'
    },
    {
      id: 2,
      designer: 'Marcus Chen',
      title: 'UI/UX Consultation',
      time: '10:00 AM Tomorrow',
      duration: '90 min',
      status: 'pending',
      avatar: 'MC'
    }
  ];

  const recentActivity = [
    { type: 'session', message: 'Completed session with Emma Thompson', time: '2 hours ago', icon: CheckCircle },
    { type: 'message', message: 'New message from Marcus Chen', time: '4 hours ago', icon: MessageCircle },
    { type: 'payment', message: 'Added $50 to wallet', time: '1 day ago', icon: DollarSign },
    { type: 'booking', message: 'Booked session with Sophie Williams', time: '2 days ago', icon: Calendar }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Modern Header */}
          <header className="bg-gradient-to-r from-primary via-primary-foreground to-primary/80 text-white px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors" />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Good Morning, Viaan!</h1>
                  <p className="text-white/80 text-sm">Let's create something amazing today</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
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
                        <Link to="/customer-dashboard" className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link to="/customer-dashboard/profile" className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
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

          <div className="p-6 space-y-6 bg-muted/30 min-h-screen">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          {stat.change} from last month
                        </p>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Quick Actions & Upcoming */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Link to="/designers" className="group">
                        <div className="text-center p-4 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                            <Search className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium">Find Designer</p>
                        </div>
                      </Link>
                      <Link to="/customer-dashboard/bookings" className="group">
                        <div className="text-center p-4 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium">My Bookings</p>
                        </div>
                      </Link>
                      <Link to="/customer-dashboard/messages" className="group">
                        <div className="text-center p-4 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                            <MessageCircle className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium">Messages</p>
                        </div>
                      </Link>
                      <Link to="/customer-dashboard/wallet" className="group">
                        <div className="text-center p-4 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                            <Plus className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium">Add Funds</p>
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Sessions */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Upcoming Sessions
                    </CardTitle>
                    <Link to="/customer-dashboard/bookings" className="text-sm text-primary hover:underline">
                      View all
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {upcomingSessions.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">{session.avatar}</span>
                              </div>
                              <div>
                                <h4 className="font-medium">{session.title}</h4>
                                <p className="text-sm text-muted-foreground">with {session.designer}</p>
                                <p className="text-xs text-muted-foreground">{session.time} • {session.duration}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'}>
                                {session.status}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CalendarClock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium mb-2">No upcoming sessions</h3>
                        <p className="text-sm text-muted-foreground mb-4">Schedule a session with a designer to get started</p>
                        <Button asChild>
                          <Link to="/designers">Find a Designer</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Projects */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileImage className="w-5 h-5" />
                      Recent Projects
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                      <Link to="/customer-dashboard/projects" className="text-sm text-primary hover:underline">
                        View all
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recentProjects.map((project, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            <FileImage className="w-12 h-12 text-muted-foreground" />
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium mb-1">{project.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">by {project.designer}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{project.date}</span>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Activity & Tools */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <activity.icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.message}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Design Tools */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      Design Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Link to="/ai-assistant">
                        <div className="p-3 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">AI Assistant</h4>
                              <p className="text-xs text-muted-foreground">Get design suggestions</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <Link to="/how-to-use">
                        <div className="p-3 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                              <ThumbsUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">Design Tips</h4>
                              <p className="text-xs text-muted-foreground">Learn best practices</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Favorite Designers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Favorite Designers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentDesigners.slice(0, 3).map((designer, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 ${designer.color} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                              {designer.initials}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{designer.name}</p>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-muted-foreground">{designer.rating}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
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