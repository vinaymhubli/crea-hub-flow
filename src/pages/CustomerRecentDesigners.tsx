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
  Star,
  LogOut,
  Filter,
  MapPin,
  Clock,
  Badge as BadgeIcon,
  Heart,
  Bookmark
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const mockRecentDesigners = [
  {
    id: 1,
    name: "Emma Thompson",
    specialty: "Logo & Brand Identity",
    rating: 4.9,
    reviewsCount: 127,
    hourlyRate: "$75",
    location: "San Francisco, CA",
    avatar: "EM",
    color: "bg-blue-500",
    online: true,
    lastWorked: "2 days ago",
    projectsCompleted: 3,
    totalSpent: "$450",
    skills: ["Logo Design", "Brand Identity", "Print Design"],
    bio: "Creative designer with 8+ years of experience in brand identity and logo design.",
    completionRate: 100,
    responseTime: "1 hour"
  },
  {
    id: 2,
    name: "Marcus Chen",
    specialty: "UI/UX Design",
    rating: 4.7,
    reviewsCount: 89,
    hourlyRate: "$85",
    location: "New York, NY",
    avatar: "MC",
    color: "bg-purple-500",
    online: false,
    lastWorked: "1 week ago",
    projectsCompleted: 2,
    totalSpent: "$340",
    skills: ["UI Design", "UX Research", "Prototyping"],
    bio: "Senior UX designer specializing in web and mobile applications.",
    completionRate: 98,
    responseTime: "2 hours"
  },
  {
    id: 3,
    name: "Sophie Williams",
    specialty: "Illustration",
    rating: 4.8,
    reviewsCount: 156,
    hourlyRate: "$65",
    location: "Austin, TX",
    avatar: "SW",
    color: "bg-green-500",
    online: true,
    lastWorked: "3 weeks ago",
    projectsCompleted: 1,
    totalSpent: "$195",
    skills: ["Digital Illustration", "Character Design", "Concept Art"],
    bio: "Passionate illustrator creating unique visual stories for brands.",
    completionRate: 100,
    responseTime: "30 minutes"
  },
  {
    id: 4,
    name: "Alex Johnson",
    specialty: "Web Design",
    rating: 4.6,
    reviewsCount: 73,
    hourlyRate: "$70",
    location: "Seattle, WA",
    avatar: "AJ",
    color: "bg-orange-500",
    online: false,
    lastWorked: "1 month ago",
    projectsCompleted: 1,
    totalSpent: "$280",
    skills: ["Web Design", "Frontend Development", "Responsive Design"],
    bio: "Full-stack designer who brings ideas to life through code and design.",
    completionRate: 95,
    responseTime: "4 hours"
  },
  {
    id: 5,
    name: "Rachel Davis",
    specialty: "Graphic Design",
    rating: 4.9,
    reviewsCount: 203,
    hourlyRate: "$60",
    location: "Los Angeles, CA",
    avatar: "RD",
    color: "bg-pink-500",
    online: true,
    lastWorked: "2 months ago",
    projectsCompleted: 2,
    totalSpent: "$360",
    skills: ["Graphic Design", "Social Media Design", "Marketing Materials"],
    bio: "Creative graphic designer with expertise in marketing and social media.",
    completionRate: 100,
    responseTime: "1 hour"
  }
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

function DesignerCard({ designer }: { designer: any }) {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white via-gray-50 to-green-50/30 backdrop-blur-sm hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg relative shadow-lg">
              {designer.avatar}
              {designer.online && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{designer.name}</h3>
              <p className="text-gray-600 font-medium">{designer.specialty}</p>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-700">{designer.rating}</span>
                <span className="text-sm text-gray-500">({designer.reviewsCount} reviews)</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">{designer.hourlyRate}/hour</p>
            <div className="flex items-center space-x-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-500">{designer.location}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-gray-600">{designer.bio}</p>
          
          <div className="flex flex-wrap gap-2">
            {designer.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Last worked</p>
              <p className="font-medium text-gray-900">{designer.lastWorked}</p>
            </div>
            <div>
              <p className="text-gray-500">Projects completed</p>
              <p className="font-medium text-gray-900">{designer.projectsCompleted}</p>
            </div>
            <div>
              <p className="text-gray-500">Total spent</p>
              <p className="font-medium text-gray-900">{designer.totalSpent}</p>
            </div>
            <div>
              <p className="text-gray-500">Response time</p>
              <p className="font-medium text-gray-900">{designer.responseTime}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <BadgeIcon className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">{designer.completionRate}% completion rate</span>
            </div>
            {designer.online && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">Online now</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg">
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" className="flex-1 border-2 border-gradient-to-r from-green-400 to-blue-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50">
            <Calendar className="w-4 h-4 mr-2" />
            Book Again
          </Button>
          <Button variant="outline" size="icon" className="border-2 border-gradient-to-r from-green-400 to-blue-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerRecentDesigners() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');

  const filteredDesigners = mockRecentDesigners
    .filter(designer => 
      designer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      designer.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      designer.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(designer => {
      if (filterBy === 'online') return designer.online;
      if (filterBy === 'favorites') return false; // Add favorites logic
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return parseInt(a.hourlyRate.replace('$', '')) - parseInt(b.hourlyRate.replace('$', ''));
        case 'projects':
          return b.projectsCompleted - a.projectsCompleted;
        default:
          return 0; // Keep original order for 'recent'
      }
    });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 border-b-0 px-6 py-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Recent Designers</h1>
                  <p className="text-white/90">Designers you've worked with previously</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-white/80 hover:text-white cursor-pointer transition-colors" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 ring-2 ring-white/30">
                      <span className="text-white font-semibold text-sm">VB</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">VB</span>
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
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/customer-dashboard/wallet" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 rounded-md transition-colors"
                        >
                          <Wallet className="w-4 h-4 mr-3" />
                          Wallet
                        </Link>
                        <Link 
                          to="/customer-dashboard/profile" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-red-50 rounded-md transition-colors">
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

          <div className="p-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search designers, skills, or specialties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price">Lowest Price</SelectItem>
                    <SelectItem value="projects">Most Projects</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="favorites">Favorites</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-0 bg-gradient-to-br from-green-400/10 via-teal-500/10 to-blue-500/10 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">{mockRecentDesigners.length}</p>
                  <p className="text-sm text-gray-600">Total Designers</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-green-400/10 via-teal-500/10 to-blue-500/10 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">{mockRecentDesigners.reduce((sum, d) => sum + d.projectsCompleted, 0)}</p>
                  <p className="text-sm text-gray-600">Projects Completed</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-green-400/10 via-teal-500/10 to-blue-500/10 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    ${mockRecentDesigners.reduce((sum, d) => sum + parseInt(d.totalSpent.replace('$', '')), 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {(mockRecentDesigners.reduce((sum, d) => sum + d.rating, 0) / mockRecentDesigners.length).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </CardContent>
              </Card>
            </div>

            {/* Designers Grid */}
            {filteredDesigners.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">No designers found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchQuery 
                      ? "Try adjusting your search or filters" 
                      : "You haven't worked with any designers yet"
                    }
                  </p>
                  <Link to="/designers">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Find Designers
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredDesigners.map((designer) => (
                  <DesignerCard key={designer.id} designer={designer} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}