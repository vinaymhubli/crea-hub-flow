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
  MessageCircle,
  Star,
  Search,
  Filter,
  Heart,
  ThumbsUp,
  Award
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
              <span className="text-white font-semibold text-xs">MD</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Meetmydesigners</p>
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

export default function ClientFeedback() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Sample feedback data
  const feedbackData = [
    {
      id: 1,
      client: { name: "Sarah Johnson", avatar: "", email: "sarah@company.com" },
      project: "E-commerce Website Redesign",
      date: "Aug 14, 2025",
      rating: 5,
      feedback: "Absolutely fantastic work! The design exceeded my expectations. The attention to detail and creative approach to solving our UX challenges was outstanding. I particularly loved how you incorporated our brand guidelines while creating something fresh and modern.",
      tags: ["Creative", "Professional", "Timely"],
      helpful: 12,
      sessionType: "Video Call"
    },
    {
      id: 2,
      client: { name: "Mike Chen", avatar: "", email: "mike@startup.io" },
      project: "Logo Design Consultation",
      date: "Aug 13, 2025",
      rating: 4,
      feedback: "Great session! Mike was very collaborative and brought excellent ideas to the table. The iterative process was smooth and the final logo concepts were exactly what we were looking for.",
      tags: ["Collaborative", "Insightful"],
      helpful: 8,
      sessionType: "In Person"
    },
    {
      id: 3,
      client: { name: "Lisa Brown", avatar: "", email: "lisa@agency.com" },
      project: "Brand Identity Workshop",
      date: "Aug 12, 2025",
      rating: 5,
      feedback: "Outstanding session! Lisa's expertise in brand strategy really showed. She helped us think through our positioning in ways we hadn't considered before. The workshop format was engaging and productive.",
      tags: ["Expert", "Strategic", "Engaging"],
      helpful: 15,
      sessionType: "Video Call"
    },
    {
      id: 4,
      client: { name: "David Wilson", avatar: "", email: "david@tech.com" },
      project: "Mobile App UI Review",
      date: "Aug 10, 2025",
      rating: 5,
      feedback: "Incredible attention to detail! The UI improvements suggested were spot-on and really enhanced the user experience. Great communication throughout the process.",
      tags: ["Detail-oriented", "User-focused"],
      helpful: 10,
      sessionType: "Video Call"
    },
    {
      id: 5,
      client: { name: "Emma Davis", avatar: "", email: "emma@creative.com" },
      project: "Website Redesign Consultation",
      date: "Aug 8, 2025",
      rating: 4,
      feedback: "Very helpful session with practical insights. The designer understood our needs quickly and provided actionable feedback that we could implement immediately.",
      tags: ["Practical", "Quick learner"],
      helpful: 6,
      sessionType: "In Person"
    }
  ];

  const stats = {
    totalFeedback: feedbackData.length,
    avgRating: feedbackData.reduce((acc, item) => acc + item.rating, 0) / feedbackData.length,
    fiveStarCount: feedbackData.filter(item => item.rating === 5).length,
    totalHelpful: feedbackData.reduce((acc, item) => acc + item.helpful, 0)
  };

  const getRatingStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredFeedback = feedbackData.filter(item => {
    const matchesSearch = item.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.feedback.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === "all" || item.rating.toString() === ratingFilter;
    return matchesSearch && matchesRating;
  });

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
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Client Feedback</h1>
                    <p className="text-white/90 text-lg">Reviews and testimonials from your clients</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-white/90 font-medium">{stats.avgRating.toFixed(1)} ⭐ average rating</span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">{stats.totalFeedback} total reviews</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
                <Award className="w-4 h-4 mr-2" />
                Share Reviews
              </Button>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFeedback}</p>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.fiveStarCount}</p>
                  <p className="text-sm text-gray-600">5-Star Reviews</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <ThumbsUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalHelpful}</p>
                  <p className="text-sm text-gray-600">Helpful Votes</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search reviews by client, project, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-green-400 focus:ring-green-200"
                  />
                </div>
                
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-40 border-gray-200">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="border-gray-200">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>

            {/* Feedback Cards */}
            <div className="space-y-6">
              {filteredFeedback.map((item) => (
                <Card key={item.id} className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={item.client.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold">
                            {item.client.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{item.project}</h3>
                          <p className="text-gray-600 font-medium">{item.client.name}</p>
                          <p className="text-sm text-gray-500">{item.date} • {item.sessionType}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {getRatingStars(item.rating)}
                        </div>
                        <span className="text-lg font-semibold text-gray-700">({item.rating}/5)</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 mb-4">
                      <p className="text-gray-800 leading-relaxed text-lg">"{item.feedback}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Tags:</span>
                          <div className="flex space-x-1">
                            {item.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Heart className="w-4 h-4" />
                          <span>{item.helpful} helpful</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}