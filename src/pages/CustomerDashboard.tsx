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
  Users2
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
      <SidebarContent className="bg-background border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">VB</span>
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
                          ? 'bg-primary/10 text-primary border-r-2 border-primary' 
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

export default function CustomerDashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header with Gradient */}
          <header className="bg-gradient-primary text-white px-6 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Viaan!</h1>
                  <p className="text-green-100">Ready to bring your next project to life?</p>
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
            
            {/* Floating decorative elements */}
            <div className="absolute top-4 right-20 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-6 right-32 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-12 right-40 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-500"></div>
          </header>

          <div className="p-6 space-y-8 bg-gradient-to-br from-background to-muted/20 min-h-screen">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-card border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
                      <p className="text-2xl font-bold text-foreground">$120.00</p>
                      <p className="text-xs text-muted-foreground mt-1">Available funds</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Sessions</p>
                      <p className="text-2xl font-bold text-foreground">0</p>
                      <p className="text-xs text-muted-foreground mt-1">In progress</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <Users2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Projects</p>
                      <p className="text-2xl font-bold text-foreground">2</p>
                      <p className="text-xs text-muted-foreground mt-1">Completed</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <FileImage className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Action Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/designers">
                    <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-primary text-white overflow-hidden">
                      <CardContent className="p-6 relative">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                        <div className="relative z-10 text-center space-y-3">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                            <Search className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-white">Find Designer</h3>
                          <p className="text-xs text-green-100">Browse talented designers</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  <Link to="/customer-dashboard/bookings">
                    <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-card border border-gradient-border">
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-gradient-primary-soft rounded-full flex items-center justify-center mx-auto">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">My Bookings</h3>
                        <p className="text-xs text-muted-foreground">Manage sessions</p>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  <Link to="/customer-dashboard/messages">
                    <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-card border border-gradient-border">
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-gradient-primary-soft rounded-full flex items-center justify-center mx-auto">
                          <MessageCircle className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Messages</h3>
                        <p className="text-xs text-muted-foreground">Chat with designers</p>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  <Link to="/customer-dashboard/wallet">
                    <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-card border border-gradient-border">
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-gradient-primary-soft rounded-full flex items-center justify-center mx-auto">
                          <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Add Funds</h3>
                        <p className="text-xs text-muted-foreground">Top up wallet</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>

              {/* Upcoming Sessions */}
              <Card className="bg-gradient-card border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-foreground">Upcoming Sessions</CardTitle>
                      <CardDescription>Your scheduled design sessions</CardDescription>
                    </div>
                    <Link to="/customer-dashboard/bookings" className="text-primary hover:text-primary/80 flex items-center text-sm font-medium">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-primary-soft rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarClock className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">No upcoming sessions</h3>
                    <p className="text-sm text-muted-foreground mb-4">You don't have any design sessions scheduled. Book a session with a designer to get started.</p>
                    <Link to="/designers">
                      <Button className="bg-gradient-primary border-0 text-white hover:shadow-lg transition-all duration-300">
                        Find a Designer
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Your Projects Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Your Projects</h2>
                  <p className="text-muted-foreground">View your design project portfolio</p>
                </div>
                <Link to="/customer-dashboard/projects" className="text-primary hover:text-primary/80 font-medium flex items-center">
                  All Projects
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentProjects.map((project, index) => (
                  <Card key={index} className="group hover:shadow-2xl transition-all duration-300 bg-gradient-card border-0 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
                        <FileImage className="w-16 h-16 text-primary/50 relative z-10" />
                      </div>
                      <div className="p-6">
                        <h4 className="font-semibold text-foreground mb-2">{project.title}</h4>
                        <p className="text-sm text-muted-foreground mb-1">by {project.designer}</p>
                        <p className="text-xs text-muted-foreground mb-4">{project.date}</p>
                        <div className="flex space-x-3">
                          <Button variant="outline" size="sm" className="flex-1 hover:bg-primary/10">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 hover:bg-primary/10">
                            <Info className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Designers */}
              <Card className="bg-gradient-card border-0 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg text-foreground">Recent Designers</CardTitle>
                  <Link to="/customer-dashboard/recent-designers" className="text-primary hover:text-primary/80 text-sm font-medium">
                    View All
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentDesigners.map((designer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gradient-primary-soft transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${designer.color} rounded-full flex items-center justify-center text-white font-semibold text-sm relative shadow-lg`}>
                          {designer.initials}
                          {designer.online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{designer.name}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-muted-foreground">{designer.rating}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{designer.specialty}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                  <Link to="/designers">
                    <Button variant="outline" className="w-full mt-4 hover:bg-gradient-primary-soft border-gradient-border">
                      <Search className="w-4 h-4 mr-2" />
                      Find More Designers
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Design Tools & Resources */}
              <Card className="bg-gradient-card border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Design Tools & Resources</CardTitle>
                  <CardDescription>Enhance your design journey with our tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link to="/ai-assistant">
                      <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bot className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">AI Assistant</h3>
                          <p className="text-xs text-muted-foreground mb-3">Get instant design suggestions</p>
                          <Button size="sm" className="bg-gradient-primary border-0 text-white">
                            Try Now
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                    
                    <Link to="/how-to-use">
                      <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ThumbsUp className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">Design Tips</h3>
                          <p className="text-xs text-muted-foreground mb-3">Learn best practices</p>
                          <Button size="sm" variant="outline" className="hover:bg-blue-50">
                            View Tips
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
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