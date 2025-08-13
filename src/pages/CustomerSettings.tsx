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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function CustomerSettings() {
  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    bookingReminders: true,
    messageNotifications: true,
    marketingEmails: false,
    
    // Privacy Settings
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowDesignerContact: true,
    showProjectHistory: false,
    
    // Security Settings
    twoFactorAuth: false,
    loginAlerts: true,
    
    // General Settings
    language: 'english',
    timezone: 'pst',
    theme: 'light',
    currency: 'usd'
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
                  <h1 className="text-2xl font-bold text-white">Settings</h1>
                  <p className="text-white/80">Manage your account preferences</p>
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
            {/* Settings Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in">
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">Security Score</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">85%</p>
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
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">7</p>
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
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Public</p>
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
                      <p className="text-sm text-gray-600 mb-1 font-medium">Data Usage</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">2.4GB</p>
                      <p className="text-sm text-yellow-600 mt-3 font-medium">This month</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Database className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings Tabs */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Account Settings</CardTitle>
                <CardDescription>Customize your account preferences and privacy settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="notifications" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                  </TabsList>

                  {/* Notifications Settings */}
                  <TabsContent value="notifications">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive updates via email</p>
                              </div>
                            </div>
                            <Switch 
                              checked={settings.emailNotifications}
                              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Smartphone className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">Push Notifications</p>
                                <p className="text-sm text-gray-500">Get notified on your device</p>
                              </div>
                            </div>
                            <Switch 
                              checked={settings.pushNotifications}
                              onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <MessageCircle className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">SMS Notifications</p>
                                <p className="text-sm text-gray-500">Receive important alerts via text</p>
                              </div>
                            </div>
                            <Switch 
                              checked={settings.smsNotifications}
                              onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                            />
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Booking Reminders</p>
                              <p className="text-sm text-gray-500">Reminders for upcoming sessions</p>
                            </div>
                            <Switch 
                              checked={settings.bookingReminders}
                              onCheckedChange={(checked) => handleSettingChange('bookingReminders', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Message Notifications</p>
                              <p className="text-sm text-gray-500">New messages from designers</p>
                            </div>
                            <Switch 
                              checked={settings.messageNotifications}
                              onCheckedChange={(checked) => handleSettingChange('messageNotifications', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Marketing Emails</p>
                              <p className="text-sm text-gray-500">Promotional content and offers</p>
                            </div>
                            <Switch 
                              checked={settings.marketingEmails}
                              onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
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
                        <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="profileVisibility">Profile Visibility</Label>
                            <Select value={settings.profileVisibility} onValueChange={(value) => handleSettingChange('profileVisibility', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Public - Anyone can view</SelectItem>
                                <SelectItem value="designers">Designers Only</SelectItem>
                                <SelectItem value="private">Private - Hidden</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Show Online Status</p>
                              <p className="text-sm text-gray-500">Let others see when you're online</p>
                            </div>
                            <Switch 
                              checked={settings.showOnlineStatus}
                              onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Allow Designer Contact</p>
                              <p className="text-sm text-gray-500">Let designers message you directly</p>
                            </div>
                            <Switch 
                              checked={settings.allowDesignerContact}
                              onCheckedChange={(checked) => handleSettingChange('allowDesignerContact', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Show Project History</p>
                              <p className="text-sm text-gray-500">Display your past projects on profile</p>
                            </div>
                            <Switch 
                              checked={settings.showProjectHistory}
                              onCheckedChange={(checked) => handleSettingChange('showProjectHistory', checked)}
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
                            <div className="flex items-center space-x-2">
                              <Switch 
                                checked={settings.twoFactorAuth}
                                onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                              />
                              {settings.twoFactorAuth ? (
                                <Badge variant="outline" className="text-green-600 border-green-200">Enabled</Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-600 border-orange-200">Disabled</Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Login Alerts</p>
                              <p className="text-sm text-gray-500">Get notified of new logins</p>
                            </div>
                            <Switch 
                              checked={settings.loginAlerts}
                              onCheckedChange={(checked) => handleSettingChange('loginAlerts', checked)}
                            />
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <h4 className="font-medium">Password Management</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input id="currentPassword" type="password" placeholder="Enter current password" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" placeholder="Enter new password" />
                              </div>
                            </div>
                            <Button className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                              <Lock className="w-4 h-4 mr-2" />
                              Update Password
                            </Button>
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
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="language">Language</Label>
                              <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="english">English</SelectItem>
                                  <SelectItem value="spanish">Spanish</SelectItem>
                                  <SelectItem value="french">French</SelectItem>
                                  <SelectItem value="german">German</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="timezone">Timezone</Label>
                              <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pst">Pacific Standard Time</SelectItem>
                                  <SelectItem value="est">Eastern Standard Time</SelectItem>
                                  <SelectItem value="cst">Central Standard Time</SelectItem>
                                  <SelectItem value="mst">Mountain Standard Time</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="theme">Theme</Label>
                              <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="light">Light</SelectItem>
                                  <SelectItem value="dark">Dark</SelectItem>
                                  <SelectItem value="auto">Auto</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="currency">Currency</Label>
                              <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="usd">USD ($)</SelectItem>
                                  <SelectItem value="eur">EUR (€)</SelectItem>
                                  <SelectItem value="gbp">GBP (£)</SelectItem>
                                  <SelectItem value="cad">CAD ($)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-4">
                              <div className="flex items-center space-x-3 mb-3">
                                <Download className="w-5 h-5 text-blue-500" />
                                <div>
                                  <h4 className="font-medium">Export Data</h4>
                                  <p className="text-sm text-gray-500">Download your account data</p>
                                </div>
                              </div>
                              <Button variant="outline" className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                              </Button>
                            </Card>

                            <Card className="p-4">
                              <div className="flex items-center space-x-3 mb-3">
                                <RefreshCw className="w-5 h-5 text-green-500" />
                                <div>
                                  <h4 className="font-medium">Sync Data</h4>
                                  <p className="text-sm text-gray-500">Sync across devices</p>
                                </div>
                              </div>
                              <Button variant="outline" className="w-full">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Sync Now
                              </Button>
                            </Card>
                          </div>

                          <Separator />

                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium text-red-900">Danger Zone</h4>
                                <p className="text-sm text-red-700 mb-3">These actions cannot be undone</p>
                                <div className="space-y-2">
                                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete All Data
                                  </Button>
                                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                    <X className="w-4 h-4 mr-2" />
                                    Close Account
                                  </Button>
                                </div>
                              </div>
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