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
          {/* Header */}
          <header className="bg-white border-b border-border px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Customer Dashboard</h1>
                  <p className="text-muted-foreground">Welcome back, let's create something amazing</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                      <span className="text-primary font-semibold text-sm">VB</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">VB</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Viaan Bindra</p>
                          <p className="text-sm text-gray-500">customer@example.com</p>
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

          <div className="p-6 space-y-6">
              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/designers">
                  <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground flex-col space-y-2">
                    <Search className="w-5 h-5" />
                    <span className="font-semibold">Find Designer</span>
                  </Button>
                </Link>
                <Link to="/customer-dashboard/bookings">
                  <Button variant="outline" className="w-full h-16 flex-col space-y-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">My Bookings</span>
                  </Button>
                </Link>
                <Link to="/customer-dashboard/messages">
                  <Button variant="outline" className="w-full h-16 flex-col space-y-2">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">Messages</span>
                  </Button>
                </Link>
                <Link to="/customer-dashboard/wallet">
                  <Button variant="outline" className="w-full h-16 flex-col space-y-2">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-semibold">Add Funds</span>
                  </Button>
                </Link>
              </div>

              {/* Wallet Balance */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Wallet Balance</p>
                    <p className="text-3xl font-bold text-foreground mb-4">$120.00</p>
                    <p className="text-sm text-muted-foreground mb-4">Available for design sessions</p>
                    <Link to="/customer-dashboard/wallet">
                      <Button className="bg-primary hover:bg-primary/90">
                        Add Funds
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Sessions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-foreground">Upcoming Sessions</CardTitle>
                    <CardDescription>Your scheduled design sessions</CardDescription>
                  </div>
                  <Link to="/customer-dashboard/bookings" className="text-primary hover:text-primary/80 flex items-center text-sm font-medium">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <CalendarClock className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No upcoming sessions</h3>
                    <p className="text-sm text-muted-foreground mb-4">You don't have any design sessions scheduled. Book a session with a designer to get started.</p>
                    <Link to="/designers">
                      <Button className="bg-primary hover:bg-primary/90">
                        Find a Designer
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Your Projects */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Projects</h2>
                  <p className="text-gray-600">View your previous design projects</p>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                  <Link to="/customer-dashboard/projects" className="text-gray-600 hover:text-gray-800 font-medium">
                    All Projects
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recentProjects.map((project, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                          <FileImage className="w-16 h-16 text-gray-400" />
                        </div>
                        <div className="p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">{project.title}</h4>
                          <p className="text-sm text-gray-600 mb-4">by {project.designer}</p>
                          <p className="text-sm text-gray-500 mb-4">{project.date}</p>
                          <div className="flex space-x-3">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Download className="w-4 h-4 mr-2" />
                              Download Files
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
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

              {/* Recent Designers */}
              <Card className="max-w-md">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg text-gray-900">Recent Designers</CardTitle>
                  <Link to="/customer-dashboard/recent-designers" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View All
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentDesigners.map((designer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${designer.color} rounded-full flex items-center justify-center text-white font-semibold text-sm relative`}>
                          {designer.initials}
                          {designer.online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{designer.name}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600">{designer.rating}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{designer.specialty}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                  <Link to="/designers">
                    <Button variant="outline" className="w-full mt-4">
                      <Search className="w-4 h-4 mr-2" />
                      Find More Designers
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Design Tools & Resources */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Design Tools & Resources</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-green-50 border-green-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">AI Design Assistant</h3>
                      <p className="text-sm text-gray-600 mb-4">Get instant design suggestions powered by AI technology</p>
                      <Link to="/ai-assistant">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          Try AI Assistant
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ThumbsUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Design Tips</h3>
                      <p className="text-sm text-gray-600 mb-4">Learn how to get the most out of your design sessions</p>
                      <Link to="/how-to-use">
                        <Button variant="outline">
                          View Tips
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 border-purple-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users2 className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Top Designers</h3>
                      <p className="text-sm text-gray-600 mb-4">Browse our featured designers with excellent ratings</p>
                      <Link to="/designers">
                        <Button variant="outline">
                          Browse Designers
                        </Button>
                      </Link>
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