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
  Check,
  X,
  Clock,
  DollarSign,
  UserPlus,
  Heart,
  Bookmark,
  AlertCircle,
  CheckCircle,
  Info,
  Gift,
  Trash2,
  Filter,
  Archive,
  Archive,
  TrendingUp
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

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

const mockNotifications = [
  {
    id: 1,
    type: "booking_confirmed",
    title: "Booking Confirmed",
    message: "Your session with Emma Thompson has been confirmed for tomorrow at 2:00 PM.",
    timestamp: "2 minutes ago",
    read: false,
    icon: CheckCircle,
    iconColor: "text-green-500",
    actionButton: "View Booking"
  },
  {
    id: 2,
    type: "message",
    title: "New Message",
    message: "Marcus Chen sent you a message about your UI/UX project.",
    timestamp: "1 hour ago",
    read: false,
    icon: MessageCircle,
    iconColor: "text-blue-500",
    actionButton: "Reply"
  },
  {
    id: 3,
    type: "payment",
    title: "Payment Processed",
    message: "Your payment of $150 for the logo design session has been processed.",
    timestamp: "3 hours ago",
    read: true,
    icon: DollarSign,
    iconColor: "text-green-500",
    actionButton: "View Receipt"
  },
  {
    id: 4,
    type: "reminder",
    title: "Session Reminder",
    message: "Your design session with Sophie Williams starts in 24 hours.",
    timestamp: "5 hours ago",
    read: false,
    icon: Clock,
    iconColor: "text-orange-500",
    actionButton: "Set Reminder"
  },
  {
    id: 5,
    type: "designer_favorite",
    title: "Designer Available",
    message: "Emma Thompson, one of your favorite designers, is now available for bookings.",
    timestamp: "1 day ago",
    read: true,
    icon: Heart,
    iconColor: "text-pink-500",
    actionButton: "Book Now"
  },
  {
    id: 6,
    type: "project_completed",
    title: "Project Completed",
    message: "Your brand identity project with Alex Johnson has been completed. Please review and rate the designer.",
    timestamp: "2 days ago",
    read: true,
    icon: CheckCircle,
    iconColor: "text-green-500",
    actionButton: "Rate Designer"
  },
  {
    id: 7,
    type: "promotion",
    title: "Special Offer",
    message: "Get 20% off your next design session. Limited time offer!",
    timestamp: "3 days ago",
    read: false,
    icon: Gift,
    iconColor: "text-purple-500",
    actionButton: "View Offer"
  },
  {
    id: 8,
    type: "booking_cancelled",
    title: "Booking Cancelled",
    message: "Your session with David Wilson has been cancelled due to designer unavailability. Full refund has been processed.",
    timestamp: "1 week ago",
    read: true,
    icon: X,
    iconColor: "text-red-500",
    actionButton: "Find Alternative"
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
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
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
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 border-r-2 border-gradient-to-b from-green-500 to-blue-500' 
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

function NotificationCard({ notification, onMarkAsRead, onDelete }: { 
  notification: any, 
  onMarkAsRead: (id: number) => void,
  onDelete: (id: number) => void 
}) {
  const IconComponent = notification.icon;
  
  return (
    <Card className={`overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${!notification.read ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 ${!notification.read ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gray-100'} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <IconComponent className={`w-6 h-6 ${!notification.read ? 'text-white' : notification.iconColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h3>
              <div className="flex items-center space-x-2 ml-2">
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="end">
                    <div className="p-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left"
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark as read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left text-red-600 hover:text-red-700"
                        onClick={() => onDelete(notification.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <p className={`text-sm mb-3 ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{notification.timestamp}</p>
              {notification.actionButton && (
                <Button size="sm" variant={!notification.read ? "default" : "outline"} className={!notification.read ? "bg-gradient-to-r from-green-400 to-blue-500 text-white" : ""}>
                  {notification.actionButton}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    bookingReminders: true,
    messageNotifications: true,
    marketingEmails: false,
  });
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleDeleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

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
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    {unreadCount > 0 && (
                      <Badge className="bg-white/20 text-white backdrop-blur-sm border border-white/30">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/80">Stay updated with your design projects</p>
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
          </header>

          <div className="p-6 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in">
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Total Notifications</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{notifications.length}</p>
                      <p className="text-sm text-green-600 mt-3 font-medium">All time</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Bell className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.1s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Unread</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{unreadCount}</p>
                      <p className="text-sm text-blue-600 mt-3 font-medium">Needs attention</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Archive className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.2s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Today</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">4</p>
                      <p className="text-sm text-purple-600 mt-3 font-medium">New notifications</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.3s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Actions Required</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">2</p>
                      <p className="text-sm text-yellow-600 mt-3 font-medium">Need response</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Notifications List */}
              <div className="lg:col-span-2 space-y-6">
                {notifications.length === 0 ? (
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <CardContent className="py-12 text-center">
                      <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">No notifications</h3>
                      <p className="text-sm text-gray-500">You're all caught up! New notifications will appear here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl text-foreground">Your Notifications</CardTitle>
                          <CardDescription>Stay updated with your design projects</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          {unreadCount > 0 && (
                            <Button variant="outline" onClick={handleMarkAllAsRead}>
                              <Check className="w-4 h-4 mr-2" />
                              Mark all as read
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={handleClearAll}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear all
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="all" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                          <TabsTrigger value="bookings">Bookings</TabsTrigger>
                          <TabsTrigger value="messages">Messages</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-4">
                          {notifications.map((notification) => (
                            <NotificationCard
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={handleMarkAsRead}
                              onDelete={handleDeleteNotification}
                            />
                          ))}
                        </TabsContent>

                        <TabsContent value="unread" className="space-y-4">
                          {unreadNotifications.length === 0 ? (
                            <div className="text-center py-8">
                              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="font-semibold text-gray-900 mb-2">No unread notifications</h3>
                              <p className="text-sm text-gray-500">You're all caught up!</p>
                            </div>
                          ) : (
                            unreadNotifications.map((notification) => (
                              <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDeleteNotification}
                              />
                            ))
                          )}
                        </TabsContent>

                        <TabsContent value="bookings" className="space-y-4">
                          {notifications.filter(n => n.type.includes('booking')).map((notification) => (
                            <NotificationCard
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={handleMarkAsRead}
                              onDelete={handleDeleteNotification}
                            />
                          ))}
                        </TabsContent>

                        <TabsContent value="messages" className="space-y-4">
                          {notifications.filter(n => n.type === 'message').map((notification) => (
                            <NotificationCard
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={handleMarkAsRead}
                              onDelete={handleDeleteNotification}
                            />
                          ))}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Notification Settings */}
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                    <CardTitle className="flex items-center text-lg">
                      <Settings className="w-5 h-5 mr-2" />
                      Notification Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Email Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, emailNotifications: checked}))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Push Notifications</p>
                          <p className="text-xs text-muted-foreground">Get notified on your device</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, pushNotifications: checked}))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Booking Reminders</p>
                          <p className="text-xs text-muted-foreground">Session reminders</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.bookingReminders}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, bookingReminders: checked}))}
                        />
                      </div>
                      <Separator />
                      <Link to="/customer-dashboard/settings">
                        <Button variant="outline" className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          More Settings
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start" onClick={handleMarkAllAsRead}>
                        <Check className="w-4 h-4 mr-2" />
                        Mark All as Read
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <Archive className="w-4 h-4 mr-2" />
                        Archive Old
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter by Type
                      </Button>
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