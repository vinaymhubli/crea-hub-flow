import { useState, useEffect } from 'react';
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
  TrendingUp,
  Eye,
  Bot,
  History,
  Download,
  Info
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { RealtimeSessionIndicator } from '@/components/RealtimeSessionIndicator';
import { Link, useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// Use the shared CustomerSidebar component
import { CustomerSidebar } from '@/components/CustomerSidebar';

export default function CustomerDashboard() {
  const { signOut, user, profile } = useAuth();
  const { activeSession, getUpcomingBookings, getCompletedBookings, loading } = useRealtimeBookings();
  const [walletBalance, setWalletBalance] = useState(0);
  const [recentDesigners, setRecentDesigners] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  
  const upcomingBookings = getUpcomingBookings();
  const completedBookings = getCompletedBookings();

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchRecentDesigners();
      fetchRecentProjects();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase.rpc('get_wallet_balance', { user_uuid: user.id });
      if (error) throw error;
      setWalletBalance(data || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchRecentDesigners = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          designer_id,
          designers (
            id,
            specialty,
            rating,
            profiles (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('customer_id', user.id)
        .limit(3);
      
      if (error) throw error;
      
      const uniqueDesigners = data?.reduce((acc, booking) => {
        if (booking.designers && !acc.find(d => d.id === booking.designers.id)) {
          acc.push({
            id: booking.designers.id,
            name: `${booking.designers.profiles?.first_name} ${booking.designers.profiles?.last_name}`,
            rating: booking.designers.rating || 4.5,
            specialty: booking.designers.specialty || 'Design',
            initials: `${booking.designers.profiles?.first_name?.[0] || 'D'}${booking.designers.profiles?.last_name?.[0] || 'R'}`,
            avatar_url: booking.designers.profiles?.avatar_url
          });
        }
        return acc;
      }, []) || [];
      
      setRecentDesigners(uniqueDesigners);
    } catch (error) {
      console.error('Error fetching recent designers:', error);
    }
  };

  const fetchRecentProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service,
          created_at,
          designers (
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('customer_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (error) throw error;
      
      const projects = data?.map(booking => ({
        title: booking.service || 'Design Project',
        designer: `${booking.designers?.profiles?.first_name} ${booking.designers?.profiles?.last_name}`,
        date: new Date(booking.created_at).toLocaleDateString(),
        image: "/placeholder.svg"
      })) || [];
      
      setRecentProjects(projects);
    } catch (error) {
      console.error('Error fetching recent projects:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userDisplayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email || 'Customer';

  const userInitials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email ? user.email.substring(0, 2).toUpperCase()
    : 'CU';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 to-blue-500 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Welcome back, {profile?.first_name || 'Customer'}!</h1>
                  <p className="text-white/80">Explore amazing designs and connect with talented designers</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-sm font-medium">Online</span>
                </div>
                <Bell className="w-5 h-5 text-white/80" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <span className="text-white font-semibold text-sm">{userInitials}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">{userInitials}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{userDisplayName}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
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
                        <button 
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
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

          <div className="p-6 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/designers" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <Search className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">Find Designer</h3>
                      <p className="text-white/80 text-sm">Browse talented designers</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/customer-dashboard/bookings" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.1s'}}>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <Calendar className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">My Bookings</h3>
                      <p className="text-white/80 text-sm">Manage your sessions</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/customer-dashboard/messages" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <MessageCircle className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">Messages</h3>
                      <p className="text-white/80 text-sm">Chat with designers</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/customer-dashboard/wallet" className="group">
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl p-6 h-32 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in" style={{animationDelay: '0.3s'}}>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <Wallet className="w-8 h-8 mb-2" />
                    <div>
                      <h3 className="font-bold text-lg">Wallet</h3>
                      <p className="text-white/80 text-sm">Manage your funds</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Active Sessions */}
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-100 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white">
                <CardTitle className="text-xl flex items-center">
                  <CalendarClock className="w-6 h-6 mr-3" />
                  Active Design Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {activeSession ? (
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-green-800">Live Session</span>
                      </div>
                      <Link 
                        to={`/session/${activeSession.id}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Join Session
                      </Link>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{activeSession.service}</h3>
                    <p className="text-gray-600">
                      with {activeSession.designer?.user?.first_name} {activeSession.designer?.user?.last_name}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarClock className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Sessions</h3>
                    <p className="text-gray-600 mb-4">You don't have any active design sessions at the moment.</p>
                    <p className="text-sm text-gray-500">Start by finding a designer and booking a session.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.5s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Wallet Balance</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">${walletBalance.toFixed(2)}</p>
                      <Link to="/customer-dashboard/wallet" className="text-sm text-green-600 hover:text-green-700 flex items-center mt-3 font-medium group">
                        Manage wallet
                        <TrendingUp className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.6s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Total Sessions</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{completedBookings.length}</p>
                      <p className="text-sm text-blue-600 mt-3 font-medium">Completed sessions</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.7s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Favorite Designers</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">3</p>
                        <Star className="w-6 h-6 text-yellow-400 fill-current" />
                      </div>
                      <p className="text-sm text-yellow-600 font-medium">In your network</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.8s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Total Spent</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$450</p>
                      <p className="text-sm text-purple-600 mt-3 font-medium">On design services</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <CreditCard className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Projects */}
              <Card className="overflow-hidden border-0 shadow-lg animate-fade-in" style={{animationDelay: '0.9s'}}>
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center">
                    <FileImage className="w-6 h-6 mr-3" />
                    Recent Projects
                  </CardTitle>
                  <CardDescription className="text-indigo-100">Your completed design projects</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <FileImage className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Company Rebrand</h4>
                          <p className="text-sm text-gray-600">by Emma Thompson</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">Completed</p>
                        <p className="text-xs text-gray-500">7/29/2025</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg flex items-center justify-center">
                          <FileImage className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Website Banner</h4>
                          <p className="text-sm text-gray-600">by Marcus Chen</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">Completed</p>
                        <p className="text-xs text-gray-500">7/22/2025</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="overflow-hidden border-0 shadow-lg animate-fade-in" style={{animationDelay: '1s'}}>
                <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                  <CardTitle className="flex items-center">
                    <History className="w-6 h-6 mr-3" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-teal-100">Your latest platform interactions</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-teal-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Project completed with Emma Thompson</p>
                        <p className="text-xs text-gray-500">Company Rebrand - 2 hours ago</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">Completed</Badge>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Payment processed</p>
                        <p className="text-xs text-gray-500">$80.00 - Yesterday</p>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">Payment</Badge>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">New message from Marcus Chen</p>
                        <p className="text-xs text-gray-500">UI/UX feedback - 3 days ago</p>
                      </div>
                      <Badge variant="outline" className="text-purple-600 border-purple-200">Message</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <RealtimeSessionIndicator />
      </div>
    </SidebarProvider>
  );
}