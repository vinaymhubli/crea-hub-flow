import { useState, useEffect } from 'react';
import { 
  Bell,
  LogOut,
  Check,
  X,
  Clock,
  DollarSign,
  Heart,
  CheckCircle,
  Info,
  Gift,
  Trash2,
  Archive,
  MessageCircle,
  AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  related_id: string | null;
  is_read: boolean;
}

function NotificationCard({ notification, onMarkAsRead, onDelete, onViewDetails }: { 
  notification: Notification, 
  onMarkAsRead: (id: string) => void,
  onDelete: (id: string) => void,
  onViewDetails: (notification: Notification) => void
}) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return CheckCircle;
      case 'message':
        return MessageCircle;
      case 'payment':
        return DollarSign;
      case 'reminder':
        return Clock;
      case 'designer_favorite':
        return Heart;
      case 'project_completed':
        return CheckCircle;
      case 'promotion':
        return Gift;
      case 'booking_cancelled':
        return X;
      // Handle announcement types from admin
      case 'announcement_info':
        return Info;
      case 'announcement_warning':
        return AlertTriangle;
      case 'announcement_success':
        return CheckCircle;
      case 'announcement_error':
        return X;
      default:
        return Info;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'project_completed':
        return 'text-green-500';
      case 'message':
        return 'text-blue-500';
      case 'payment':
        return 'text-green-500';
      case 'reminder':
        return 'text-orange-500';
      case 'designer_favorite':
        return 'text-pink-500';
      case 'promotion':
        return 'text-purple-500';
      case 'booking_cancelled':
        return 'text-red-500';
      // Handle announcement types from admin
      case 'announcement_info':
        return 'text-blue-500';
      case 'announcement_warning':
        return 'text-orange-500';
      case 'announcement_success':
        return 'text-green-500';
      case 'announcement_error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const IconComponent = getIcon(notification.type);
  const iconColor = getIconColor(notification.type);
  
  return (
    <Card className={`overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${!notification.is_read ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 ${!notification.is_read ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gray-100'} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <IconComponent className={`w-6 h-6 ${!notification.is_read ? 'text-white' : iconColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h3>
              <div className="flex items-center space-x-2 ml-2">
                {!notification.is_read && (
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
                      {!notification.is_read && (
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
            
            <p className={`text-sm mb-3 ${!notification.is_read ? 'text-gray-700' : 'text-gray-600'}`}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {new Date(notification.created_at).toLocaleDateString()} at{' '}
                {new Date(notification.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
              {/* <Button 
                size="sm" 
                variant={!notification.is_read ? "default" : "outline"} 
                className={!notification.is_read ? "bg-gradient-to-r from-green-400 to-blue-500 text-white" : ""}
                onClick={() => onViewDetails(notification)}
              >
                View Details
              </Button> */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings, updateSetting, saving } = useUserSettings();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
        toast.error('Failed to delete notification');
        return;
      }

      setNotifications(prev => prev.filter(notification => notification.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error clearing all notifications:', error);
        toast.error('Failed to clear all notifications');
        return;
      }

      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to clear all notifications');
    }
  };

  const handleViewDetails = (notification: Notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'booking_confirmed':
      case 'booking_cancelled':
        navigate('/customer-dashboard/bookings');
        break;
      case 'message':
        navigate('/customer-dashboard/messages');
        break;
      case 'payment':
        navigate('/customer-dashboard/wallet');
        break;
      case 'project_completed':
        navigate('/customer-dashboard/session-history');
        break;
      default:
        // For other types, just mark as read
        if (!notification.is_read) {
          handleMarkAsRead(notification.id);
        }
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <CustomerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading notifications...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

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
                      <span className="text-white font-semibold text-sm">U</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">U</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">User</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Dashboard
                        </Link>
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
                      <p className="text-sm text-gray-600 mb-1 font-medium">This Week</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {notifications.filter(n => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(n.created_at) > weekAgo;
                        }).length}
                      </p>
                      <p className="text-sm text-purple-600 mt-3 font-medium">Recent activity</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.3s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Important</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                        {notifications.filter(n => 
                          ['booking_confirmed', 'payment', 'booking_cancelled'].includes(n.type)
                        ).length}
                      </p>
                      <p className="text-sm text-orange-600 mt-3 font-medium">High priority</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark All as Read
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>

            {/* Notifications */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                {notifications.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-600">You're all caught up! New notifications will appear here.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                       <NotificationCard 
                         key={notification.id} 
                         notification={notification} 
                         onMarkAsRead={handleMarkAsRead}
                         onDelete={handleDeleteNotification}
                         onViewDetails={handleViewDetails}
                       />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unread" className="space-y-4 mt-6">
                {unreadNotifications.length === 0 ? (
                  <Card className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">You have no unread notifications.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {unreadNotifications.map((notification) => (
                       <NotificationCard 
                         key={notification.id} 
                         notification={notification} 
                         onMarkAsRead={handleMarkAsRead}
                         onDelete={handleDeleteNotification}
                         onViewDetails={handleViewDetails}
                       />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-600">Receive notifications via email</p>
                          </div>
                           <Switch
                             checked={settings.notifications_email}
                             onCheckedChange={(checked) => 
                               updateSetting('notifications_email', checked)
                             }
                           />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-gray-600">Receive browser push notifications</p>
                          </div>
                           <Switch
                             checked={settings.notifications_push}
                             onCheckedChange={(checked) => 
                               updateSetting('notifications_push', checked)
                             }
                           />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Booking Reminders</p>
                            <p className="text-sm text-gray-600">Get reminded about upcoming sessions</p>
                          </div>
                           <Switch
                             checked={settings.booking_reminders}
                             onCheckedChange={(checked) => 
                               updateSetting('booking_reminders', checked)
                             }
                           />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Message Notifications</p>
                            <p className="text-sm text-gray-600">Get notified of new messages</p>
                          </div>
                           <Switch
                             checked={settings.message_notifications}
                             onCheckedChange={(checked) => 
                               updateSetting('message_notifications', checked)
                             }
                           />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Marketing Emails</p>
                            <p className="text-sm text-gray-600">Receive promotional content and updates</p>
                          </div>
                           <Switch
                             checked={settings.notifications_marketing}
                             onCheckedChange={(checked) => 
                               updateSetting('notifications_marketing', checked)
                             }
                           />
                        </div>
                      </div>
                    </div>
                    
                     <div className="flex justify-end">
                       <Button 
                         className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                         disabled={saving}
                       >
                         {saving ? 'Saving...' : 'Preferences Auto-Saved'}
                       </Button>
                     </div>
                  </CardContent>
                </Card>
              </TabsContent> */}
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}