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
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Heart
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
      <SidebarContent className="bg-card border-r border-border shadow-elegant">
        <div className="p-6 border-b border-border bg-gradient-subtle">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-glow">
              <span className="text-accent-foreground font-bold text-sm">VB</span>
            </div>
            <div>
              <p className="font-bold text-foreground">Viaan Bindra</p>
              <Badge variant="secondary" className="text-xs">Premium Customer</Badge>
            </div>
          </div>
        </div>
        
        <SidebarGroup className="px-4 py-6">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive(item.url) 
                          ? 'bg-accent text-accent-foreground shadow-glow border border-accent/20' 
                          : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                      {isActive(item.url) && <ArrowRight className="w-4 h-4 ml-auto" />}
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
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Hero Header */}
          <header className="bg-gradient-primary text-primary-foreground px-8 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-accent/5"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <SidebarTrigger className="text-primary-foreground hover:bg-white/10" />
                <div>
                  <h1 className="text-4xl font-bold mb-2">Welcome back, Viaan! 👋</h1>
                  <p className="text-primary-foreground/80 text-lg">Ready to bring your design vision to life?</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="secondary" size="sm" className="bg-white/20 text-primary-foreground border-white/30 hover:bg-white/30">
                  <Bell className="w-4 h-4 mr-2" />
                  2 New
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-12 h-12 bg-accent rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors shadow-glow">
                      <span className="text-accent-foreground font-bold">VB</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-6 bg-gradient-subtle">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-glow">
                          <span className="text-accent-foreground font-bold">VB</span>
                        </div>
                        <div>
                          <p className="font-bold text-foreground">Viaan Bindra</p>
                          <p className="text-sm text-muted-foreground">customer@example.com</p>
                          <Badge variant="secondary" className="text-xs mt-1">Premium Member</Badge>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/customer-dashboard/wallet" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                        >
                          <Wallet className="w-4 h-4 mr-3" />
                          Wallet
                        </Link>
                        <Link 
                          to="/customer-dashboard/profile" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent/10 rounded-lg transition-colors">
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

          <div className="p-8 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/designers" className="group">
                <Card className="h-28 hover:shadow-elegant transition-all duration-300 group-hover:scale-105 bg-gradient-primary text-primary-foreground border-0">
                  <CardContent className="p-6 flex items-center justify-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Find Designer</p>
                      <p className="text-primary-foreground/80 text-sm">Discover talent</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/customer-dashboard/bookings" className="group">
                <Card className="h-28 hover:shadow-elegant transition-all duration-300 group-hover:scale-105">
                  <CardContent className="p-6 flex items-center justify-center space-x-4">
                    <div className="p-3 bg-accent/20 rounded-full">
                      <Calendar className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-foreground">My Bookings</p>
                      <p className="text-muted-foreground text-sm">Manage sessions</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/customer-dashboard/messages" className="group">
                <Card className="h-28 hover:shadow-elegant transition-all duration-300 group-hover:scale-105">
                  <CardContent className="p-6 flex items-center justify-center space-x-4">
                    <div className="p-3 bg-accent/20 rounded-full">
                      <MessageCircle className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-foreground">Messages</p>
                      <p className="text-muted-foreground text-sm">Chat with designers</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/customer-dashboard/wallet" className="group">
                <Card className="h-28 hover:shadow-elegant transition-all duration-300 group-hover:scale-105">
                  <CardContent className="p-6 flex items-center justify-center space-x-4">
                    <div className="p-3 bg-accent/20 rounded-full">
                      <CreditCard className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-foreground">Wallet</p>
                      <p className="text-muted-foreground text-sm">Manage funds</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wallet Balance */}
              <Card className="hover:shadow-elegant transition-all duration-300 bg-gradient-subtle border border-accent/20">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-accent/20 rounded-full">
                      <Wallet className="w-6 h-6 text-accent" />
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent">Active</Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">$120.00</h3>
                  <p className="text-muted-foreground text-sm mb-4">Available balance</p>
                  <Link to="/customer-dashboard/wallet">
                    <Button className="w-full bg-accent hover:bg-accent/90">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Add Funds
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-accent/20 rounded-full">
                      <TrendingUp className="w-6 h-6 text-accent" />
                    </div>
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">12</h3>
                  <p className="text-muted-foreground text-sm mb-4">Completed projects</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-yellow-500 mr-1 fill-current" />
                    <span>4.9 average rating</span>
                  </div>
                </CardContent>
              </Card>

              {/* Next Session */}
              <Card className="hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-accent/20 rounded-full">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">No upcoming sessions</h3>
                  <p className="text-muted-foreground text-sm mb-4">Ready to start your next project?</p>
                  <Link to="/designers">
                    <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      <Search className="w-4 h-4 mr-2" />
                      Find Designer
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Recent Projects */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground">Your Projects</h2>
                  <p className="text-muted-foreground">Your creative journey showcase</p>
                </div>
                <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                  View All Projects
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {recentProjects.map((project, index) => (
                  <Card key={index} className="group hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                    <div className="aspect-video bg-gradient-subtle flex items-center justify-center border-b border-border">
                      <div className="p-4 bg-accent/20 rounded-full">
                        <FileImage className="w-12 h-12 text-accent" />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-lg text-foreground">{project.title}</h4>
                        <Badge variant="secondary" className="bg-accent/10 text-accent">Completed</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">by {project.designer}</p>
                      <p className="text-sm text-muted-foreground mb-6">{project.date}</p>
                      <div className="flex space-x-3">
                        <Button variant="outline" size="sm" className="flex-1 border-accent/30 hover:bg-accent/10">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-accent/30 hover:bg-accent/10">
                          <Info className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Designers */}
              <Card className="lg:col-span-1 hover:shadow-elegant transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-foreground flex items-center">
                    <Users className="w-5 h-5 mr-2 text-accent" />
                    Recent Designers
                  </CardTitle>
                  <CardDescription>Your design collaboration history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentDesigners.map((designer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/5 transition-all duration-200 cursor-pointer group">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${designer.color} rounded-full flex items-center justify-center text-white font-bold text-sm relative shadow-sm`}>
                          {designer.initials}
                          {designer.online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{designer.name}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-muted-foreground">{designer.rating}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{designer.specialty}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                  ))}
                  <Link to="/designers">
                    <Button variant="outline" className="w-full mt-4 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      <Search className="w-4 h-4 mr-2" />
                      Discover More Designers
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Tools & Resources */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Design Tools & Resources</h2>
                  <p className="text-muted-foreground">Everything you need for your design journey</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="group hover:shadow-elegant transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <Bot className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-bold text-lg text-foreground mb-3">AI Design Assistant</h3>
                      <p className="text-sm text-muted-foreground mb-6">Get instant design suggestions powered by AI</p>
                      <Link to="/ai-assistant">
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          <Zap className="w-4 h-4 mr-2" />
                          Try AI Assistant
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="group hover:shadow-elegant transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <ThumbsUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-lg text-foreground mb-3">Design Tips</h3>
                      <p className="text-sm text-muted-foreground mb-6">Learn how to maximize your design sessions</p>
                      <Link to="/how-to-use">
                        <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white">
                          <Sparkles className="w-4 h-4 mr-2" />
                          View Tips
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}