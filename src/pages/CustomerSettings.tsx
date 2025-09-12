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
  X,
  LogOut,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  Trash2,
  Download,
  Upload,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Key,
  Database,
  Languages
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/hooks/useUserSettings';
import { CustomerSidebar } from '@/components/CustomerSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CustomerSettings() {
  const { user, profile, signOut } = useAuth();
  const { settings, loading, saving, updateSetting } = useUserSettings();
  const [theme, setTheme] = useState('light');

  const getInitials = () => {
    const displayName = profile?.display_name;
    const firstName = profile?.first_name;
    const lastName = profile?.last_name;
    const email = user?.email;
    
    if (displayName) {
      const words = displayName.trim().split(' ');
      return words.length >= 2 
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : `${words[0][0]}${words[0][1] || ''}`.toUpperCase();
    }
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) return profile.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <CustomerSidebar />
        
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 to-blue-500 px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
                  <p className="text-white/80 text-sm sm:text-base">Manage your account preferences</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-sm font-medium">Online</span>
                </div>
                <Bell className="w-5 h-5 text-white/80" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-semibold text-sm">{getInitials()}</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar>
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback>{getInitials()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{getDisplayName()}</p>
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
                        <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
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

          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-x-hidden">
            {/* Settings Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in">
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Security Score</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {settings.security_two_factor ? '95%' : '85%'}
                      </p>
                      <p className="text-sm text-green-600 mt-3 font-medium">Good security</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.1s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Active Notifications</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {[settings.notifications_email, settings.notifications_push, settings.notifications_sms, settings.booking_reminders, settings.message_notifications].filter(Boolean).length}
                      </p>
                      <p className="text-sm text-blue-600 mt-3 font-medium">Enabled types</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Bell className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.2s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Privacy Level</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {settings.privacy_profile_visible ? 'Public' : 'Private'}
                      </p>
                      <p className="text-sm text-purple-600 mt-3 font-medium">Profile visibility</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in" style={{animationDelay: '0.3s'}}>
                <CardContent className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Language</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                        {settings.language === 'en' ? 'English' : settings.language}
                      </p>
                      <p className="text-sm text-yellow-600 mt-3 font-medium">Current setting</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Languages className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings Tabs */}
            <Card className="overflow-hidden border-0 shadow-lg w-full">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Account Settings</CardTitle>
                <CardDescription>Customize your account preferences and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-hidden">
                <Tabs defaultValue="notifications" className="space-y-6 w-full">
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <TabsList className="inline-flex w-max min-w-full sm:grid sm:grid-cols-5 sm:w-full">
                      <TabsTrigger value="notifications" className="whitespace-nowrap px-3 sm:px-4">Notifications</TabsTrigger>
                      <TabsTrigger value="privacy" className="whitespace-nowrap px-3 sm:px-4">Privacy</TabsTrigger>
                      <TabsTrigger value="security" className="whitespace-nowrap px-3 sm:px-4">Security</TabsTrigger>
                      <TabsTrigger value="general" className="whitespace-nowrap px-3 sm:px-4">General</TabsTrigger>
                      <TabsTrigger value="account" className="whitespace-nowrap px-3 sm:px-4">Account</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Notifications Settings */}
                  <TabsContent value="notifications">
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base">Email Notifications</p>
                                <p className="text-xs sm:text-sm text-gray-500">Receive updates via email</p>
                              </div>
                            </div>
                            <Switch 
                              checked={settings.notifications_email}
                              onCheckedChange={(checked) => updateSetting('notifications_email', checked)}
                              disabled={saving}
                              className="flex-shrink-0 ml-2"
                            />
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Smartphone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base">Push Notifications</p>
                                <p className="text-xs sm:text-sm text-gray-500">Get notified on your device</p>
                              </div>
                            </div>
                            <Switch 
                              checked={settings.notifications_push}
                              onCheckedChange={(checked) => updateSetting('notifications_push', checked)}
                              disabled={saving}
                              className="flex-shrink-0 ml-2"
                            />
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <MessageCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base">SMS Notifications</p>
                                <p className="text-xs sm:text-sm text-gray-500">Receive important alerts via text</p>
                              </div>
                            </div>
                            <Switch 
                              checked={settings.notifications_sms}
                              onCheckedChange={(checked) => updateSetting('notifications_sms', checked)}
                              disabled={saving}
                              className="flex-shrink-0 ml-2"
                            />
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between py-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base">Booking Reminders</p>
                              <p className="text-xs sm:text-sm text-gray-500">Reminders for upcoming sessions</p>
                            </div>
                            <Switch 
                              checked={settings.booking_reminders}
                              onCheckedChange={(checked) => updateSetting('booking_reminders', checked)}
                              disabled={saving}
                              className="flex-shrink-0 ml-2"
                            />
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base">Message Notifications</p>
                              <p className="text-xs sm:text-sm text-gray-500">New messages from designers</p>
                            </div>
                            <Switch 
                              checked={settings.message_notifications}
                              onCheckedChange={(checked) => updateSetting('message_notifications', checked)}
                              disabled={saving}
                              className="flex-shrink-0 ml-2"
                            />
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base">Marketing Emails</p>
                              <p className="text-xs sm:text-sm text-gray-500">Promotional emails and updates</p>
                            </div>
                            <Switch 
                              checked={settings.notifications_marketing}
                              onCheckedChange={(checked) => updateSetting('notifications_marketing', checked)}
                              disabled={saving}
                              className="flex-shrink-0 ml-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Privacy Settings */}
                  <TabsContent value="privacy">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Privacy Controls</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Profile Visibility</p>
                              <p className="text-sm text-gray-500">Make your profile visible to other users</p>
                            </div>
                            <Switch 
                              checked={settings.privacy_profile_visible}
                              onCheckedChange={(checked) => updateSetting('privacy_profile_visible', checked)}
                              disabled={saving}
                            />
                          </div>


                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Activity Status</p>
                              <p className="text-sm text-gray-500">Show when you're online</p>
                            </div>
                            <Switch 
                              checked={settings.privacy_activity_status}
                              onCheckedChange={(checked) => updateSetting('privacy_activity_status', checked)}
                              disabled={saving}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Security Settings */}
                  <TabsContent value="security">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Key className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-gray-500">Add an extra layer of security</p>
                              </div>
                            </div>
                            <Switch 
                              checked={settings.security_two_factor}
                              onCheckedChange={(checked) => updateSetting('security_two_factor', checked)}
                              disabled={saving}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">Login Alerts</p>
                                <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                              </div>
                            </div>
                            <Switch 
                              checked={settings.security_login_alerts}
                              onCheckedChange={(checked) => updateSetting('security_login_alerts', checked)}
                              disabled={saving}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* General Settings */}
                  <TabsContent value="general">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">General Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Language</Label>
                            <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="EST">Eastern Time</SelectItem>
                                <SelectItem value="CST">Central Time</SelectItem>
                                <SelectItem value="MST">Mountain Time</SelectItem>
                                <SelectItem value="PST">Pacific Time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>


                          <div className="space-y-2">
                            <Label>Time Format</Label>
                            <Select value={settings.time_format} onValueChange={(value) => updateSetting('time_format', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="12h">12 Hour</SelectItem>
                                <SelectItem value="24h">24 Hour</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Theme</p>
                              <p className="text-sm text-gray-500">Choose your preferred theme</p>
                            </div>
                            <Select value={theme} onValueChange={setTheme}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Account Settings */}
                  <TabsContent value="account">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Account Management</h3>
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Download Data</p>
                                <p className="text-sm text-gray-500">Download a copy of your account data</p>
                              </div>
                              <Button variant="outline" className="flex items-center space-x-2">
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </Button>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Delete Account</p>
                                <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                              </div>
                              <Button variant="destructive" className="flex items-center space-x-2">
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}