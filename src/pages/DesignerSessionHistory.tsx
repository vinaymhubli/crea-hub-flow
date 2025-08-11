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
  Download,
  Search,
  Filter,
  Video,
  MessageCircle,
  Star,
  FileText,
  Play,
  Eye,
  MapPin,
  MoreVertical
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function DesignerSessionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("recent");

  // Sample session data
  const sessions = [
    {
      id: 1,
      client: { name: "Sarah Johnson", avatar: "", email: "sarah@company.com" },
      project: "E-commerce Website Redesign",
      date: "Aug 14, 2025",
      duration: "2h 30m",
      type: "Video Call",
      status: "completed",
      rating: 5,
      feedback: "Excellent work! Very professional and creative approach to the redesign.",
      earnings: 300,
      hasRecording: true,
      hasNotes: true,
      tools: ["Figma", "Adobe XD"]
    },
    {
      id: 2,
      client: { name: "Mike Chen", avatar: "", email: "mike@startup.io" },
      project: "Logo Design Consultation",
      date: "Aug 13, 2025",
      duration: "1h 15m",
      type: "In Person",
      status: "completed",
      rating: 4,
      feedback: "Great session, loved the creative process and final concepts.",
      earnings: 150,
      hasRecording: false,
      hasNotes: true,
      tools: ["Adobe Illustrator", "Sketch"]
    },
    {
      id: 3,
      client: { name: "Lisa Brown", avatar: "", email: "lisa@agency.com" },
      project: "Brand Identity Workshop",
      date: "Aug 12, 2025",
      duration: "3h 00m",
      type: "Video Call",
      status: "completed",
      rating: 5,
      feedback: "Outstanding session! Lisa was very collaborative and insightful.",
      earnings: 450,
      hasRecording: true,
      hasNotes: true,
      tools: ["Figma", "Miro", "Adobe Creative Suite"]
    }
  ];

  const stats = {
    totalSessions: sessions.length,
    totalHours: sessions.reduce((acc, session) => {
      const hours = parseFloat(session.duration.split('h')[0]);
      const minutesPart = session.duration.split('h')[1]?.split('m')[0];
      const minutes = minutesPart ? parseFloat(minutesPart) : 0;
      return acc + hours + (minutes / 60);
    }, 0),
    avgRating: sessions.reduce((acc, session) => acc + session.rating, 0) / sessions.length,
    totalEarnings: sessions.reduce((acc, session) => acc + session.earnings, 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderSessionCard = (session: any) => (
    <Card key={session.id} className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={session.client.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold">
                {session.client.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{session.project}</h3>
              <p className="text-gray-600 font-medium">{session.client.name}</p>
              <p className="text-sm text-gray-500">{session.client.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(session.status)}
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
                {session.hasRecording && (
                  <DropdownMenuItem>
                    <Play className="w-4 h-4 mr-2" />
                    Watch Recording
                  </DropdownMenuItem>
                )}
                {session.hasNotes && (
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    View Notes
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{session.date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{session.duration}</span>
          </div>
          <div className="flex items-center space-x-2">
            {session.type === 'Video Call' ? (
              <Video className="w-4 h-4 text-gray-400" />
            ) : (
              <MapPin className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">{session.type}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-green-600">${session.earnings}</span>
          </div>
        </div>

        {session.rating && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < session.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({session.rating}/5)</span>
          </div>
        )}

        {session.feedback && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800 italic">"{session.feedback}"</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Tools used:</span>
              <div className="flex space-x-1">
                {session.tools.map((tool: string) => (
                  <Badge key={tool} variant="outline" className="text-xs">{tool}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {session.hasRecording && (
              <Button variant="outline" size="sm">
                <Play className="w-4 h-4 mr-1" />
                Recording
              </Button>
            )}
            {session.hasNotes && (
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1" />
                Notes
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
                    <History className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Session History</h1>
                    <p className="text-white/90 text-lg">Track your past design sessions and performance</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-white/90 font-medium">{stats.totalSessions} sessions</span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">{stats.totalHours.toFixed(1)} hours</span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">{stats.avgRating.toFixed(1)} ⭐ avg rating</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</p>
                  <p className="text-sm text-gray-600">Total Hours</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Avg. Rating</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings}</p>
                  <p className="text-sm text-gray-600">Total Earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by client name or project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-green-400 focus:ring-green-200"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-gray-200">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="border-gray-200">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>

            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 mb-8">
                <TabsList className="grid w-auto grid-cols-3 bg-transparent gap-2">
                  <TabsTrigger 
                    value="recent"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-8 font-semibold"
                  >
                    Recent Sessions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-8 font-semibold"
                  >
                    Performance Analytics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="feedback"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-8 font-semibold"
                  >
                    Client Feedback
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="recent" className="space-y-6">
                {sessions.map(renderSessionCard)}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <History className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Performance Analytics</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                    Detailed insights about your session performance and client satisfaction.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="feedback" className="space-y-6">
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Client Feedback</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                    All feedback and reviews from your clients in one place.
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