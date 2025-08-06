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
  Trash2
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

function NotificationCard({ notification, onMarkAsRead, onDelete }: { 
  notification: any, 
  onMarkAsRead: (id: number) => void,
  onDelete: (id: number) => void 
}) {
  const IconComponent = notification.icon;
  
  return (
    <Card className={`${!notification.read ? 'bg-gradient-to-br from-green-50/30 via-teal-50/30 to-blue-50/30 border-gradient-to-r from-green-200/50 to-blue-200/50' : 'bg-white'} hover:shadow-xl transition-all duration-300 border-0 backdrop-blur-sm`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className={`w-10 h-10 ${!notification.read ? 'bg-gradient-to-br from-green-400 to-blue-500' : 'bg-gray-100'} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <IconComponent className={`w-5 h-5 ${!notification.read ? 'text-white' : notification.iconColor}`} />
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
                <Button size="sm" variant={!notification.read ? "default" : "outline"} className="text-xs">
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
      <div className="min-h-screen flex w-full bg-gray-50">
        <CustomerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 border-b-0 px-6 py-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2" />
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    {unreadCount > 0 && (
                      <Badge className="bg-white/20 text-white backdrop-blur-sm border border-white/30">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/90">Stay updated with your design projects</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {unreadCount > 0 && (
                  <Button variant="outline" onClick={handleMarkAllAsRead} className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                    <Check className="w-4 h-4 mr-2" />
                    Mark all as read
                  </Button>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Bell className="w-5 h-5" />
                    </Button>
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

          <div className="flex-1 flex">
            {/* Main Notifications Area */}
            <div className="flex-1 p-6">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">No notifications</h3>
                  <p className="text-sm text-gray-500">You're all caught up! New notifications will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="all" className="space-y-6">
                <div className="flex items-center justify-between">
                  <TabsList className="grid grid-cols-6 w-full max-w-2xl">
                    <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                    <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex space-x-3">
                    {unreadCount > 0 && (
                      <Button variant="outline" onClick={handleMarkAllAsRead}>
                        <Check className="w-4 h-4 mr-2" />
                        Mark all as read
                      </Button>
                    )}
                    {notifications.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleClearAll}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear all
                      </Button>
                    )}
                  </div>
                </div>

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
                    <Card>
                      <CardContent className="py-12 text-center">
                        <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">No unread notifications</h3>
                        <p className="text-sm text-gray-500">You're all caught up!</p>
                      </CardContent>
                    </Card>
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
                  {notifications.filter(n => n.type.includes('booking')).length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">No booking notifications</h3>
                        <p className="text-sm text-gray-500">Booking-related notifications will appear here.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    notifications.filter(n => n.type.includes('booking')).map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDeleteNotification}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="messages" className="space-y-4">
                  {notifications.filter(n => n.type === 'message').length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">No message notifications</h3>
                        <p className="text-sm text-gray-500">Message notifications will appear here.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    notifications.filter(n => n.type === 'message').map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDeleteNotification}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  {notifications.filter(n => n.type === 'payment').length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">No payment notifications</h3>
                        <p className="text-sm text-gray-500">Payment notifications will appear here.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    notifications.filter(n => n.type === 'payment').map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDeleteNotification}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                  {notifications.filter(n => ['reminder', 'promotion'].includes(n.type)).length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">No system notifications</h3>
                        <p className="text-sm text-gray-500">System notifications will appear here.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    notifications.filter(n => ['reminder', 'promotion'].includes(n.type)).map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDeleteNotification}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
            </div>

            {/* Notification Settings Panel */}
            <div className="w-80 bg-white border-l border-gray-200 p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Notification Settings</h2>
                  <p className="text-sm text-gray-600">Configure how you receive updates</p>
                </div>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Booking updates</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">New messages</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Payment confirmations</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Review requests</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Marketing updates</span>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Push Notifications */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Push Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Booking updates</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">New messages</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Payment confirmations</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Review requests</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Marketing updates</span>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced Settings */}
                  <div className="pt-4">
                    <Link to="/customer-dashboard/settings" className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Settings
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}