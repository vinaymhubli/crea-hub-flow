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
  Globe,
  CreditCard,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Mail,
  Edit,
  LogOut,
  Check,
  Camera,
  Monitor,
  Key
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

export default function DesignerSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // General settings
    language: "english",
    timezone: "est",
    currency: "usd",
    darkMode: false,
    // Notification settings
    bookingRequests: true,
    sessionReminders: true,
    newMessages: true,
    paymentReceipts: true,
    newReviews: true,
    designerTips: false,
    // Designer Profile settings
    autoAcceptBookings: false,
    pauseNewBookings: false,
    urgentWork: true,
    displayHourlyRate: true,
    useCustomRate: false,
    currentRate: "5.00",
    minBookingDuration: "30",
    bufferTime: "15",
    // Design Session settings
    defaultTools: "all",
    defaultCanvasSize: "large",
    defaultColorPalette: "standard",
    autoRecordSessions: true,
    cameraEnabled: false,
    screenSharingEnabled: true,
    // Payment settings
    payoutFrequency: "bi-weekly",
    payoutMethod: "bank-transfer",
    hourlyRate: "85.00",
    // Security settings
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: false,
    // Privacy settings
    profileVisibility: "public",
    showOnlineStatus: true,
    showRecentWork: true,
    allowPortfolioShowcase: true,
    enableWatermarking: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveChanges = () => {
    console.log('Saving settings:', settings);
    // Implement save functionality
  };

  const handleUpdatePassword = () => {
    console.log('Updating password');
    // Implement password update functionality
  };

  const handleUpdateTaxInfo = () => {
    console.log('Updating tax information');
    // Implement tax info update functionality
  };

  const handleSaveBillingSettings = () => {
    console.log('Saving billing settings');
    // Implement billing settings save functionality
  };

  const handleSavePaymentDetails = () => {
    console.log('Saving payment details');
    // Implement payment details save functionality
  };

  const handleLogoutDevice = (device: string) => {
    console.log('Logging out device:', device);
    // Implement device logout functionality
  };

  const handleLogoutAllDevices = () => {
    console.log('Logging out all devices');
    // Implement logout all devices functionality
  };

  const handleExportData = () => {
    console.log('Exporting data');
    // Implement data export functionality
  };

  const handleDeleteAccount = () => {
    console.log('Deleting account');
    // Implement account deletion functionality
  };

  const handleSavePrivacySettings = () => {
    console.log('Saving privacy settings');
    // Implement privacy settings save functionality
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 to-blue-500 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Settings</h1>
                  <p className="text-white/80">Manage your account settings and preferences</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {/* Settings Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="general" className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>General</span>
                </TabsTrigger>
                <TabsTrigger value="designer-profile" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Designer Profile</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Payments</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Privacy</span>
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Preferences */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferences</CardTitle>
                      <CardDescription>Manage your interface and regional settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
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

                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="est">Eastern Standard Time</SelectItem>
                            <SelectItem value="cst">Central Standard Time</SelectItem>
                            <SelectItem value="mst">Mountain Standard Time</SelectItem>
                            <SelectItem value="pst">Pacific Standard Time</SelectItem>
                            <SelectItem value="utc">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usd">USD ($)</SelectItem>
                            <SelectItem value="eur">EUR (€)</SelectItem>
                            <SelectItem value="gbp">GBP (£)</SelectItem>
                            <SelectItem value="cad">CAD (C$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="dark-mode">Dark Mode</Label>
                          <p className="text-sm text-gray-500">Switch between light and dark theme</p>
                        </div>
                        <Switch
                          checked={settings.darkMode}
                          onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                        />
                      </div>

                      <Button onClick={handleSaveChanges} className="w-full">
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Notifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>Manage your email and push notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3">Email Notifications</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Booking requests</span>
                            <Switch
                              checked={settings.bookingRequests}
                              onCheckedChange={(checked) => handleSettingChange('bookingRequests', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Session reminders</span>
                            <Switch
                              checked={settings.sessionReminders}
                              onCheckedChange={(checked) => handleSettingChange('sessionReminders', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">New messages</span>
                            <Switch
                              checked={settings.newMessages}
                              onCheckedChange={(checked) => handleSettingChange('newMessages', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Payment receipts</span>
                            <Switch
                              checked={settings.paymentReceipts}
                              onCheckedChange={(checked) => handleSettingChange('paymentReceipts', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">New reviews</span>
                            <Switch
                              checked={settings.newReviews}
                              onCheckedChange={(checked) => handleSettingChange('newReviews', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Designer tips & updates</span>
                            <Switch
                              checked={settings.designerTips}
                              onCheckedChange={(checked) => handleSettingChange('designerTips', checked)}
                            />
                          </div>
                        </div>
                      </div>

                      <Button className="w-full flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>Manage All Notifications</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Designer Profile Tab */}
              <TabsContent value="designer-profile" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bookings & Availability */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Bookings & Availability</CardTitle>
                      <CardDescription>Configure how customers can book your services</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-Accept Bookings</Label>
                          <p className="text-sm text-gray-500">Automatically accept booking requests</p>
                        </div>
                        <Switch
                          checked={settings.autoAcceptBookings}
                          onCheckedChange={(checked) => handleSettingChange('autoAcceptBookings', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Pause New Bookings</Label>
                          <p className="text-sm text-gray-500">Temporarily stop accepting new booking requests</p>
                        </div>
                        <Switch
                          checked={settings.pauseNewBookings}
                          onCheckedChange={(checked) => handleSettingChange('pauseNewBookings', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Available for Urgent Work</Label>
                          <p className="text-sm text-gray-500">Show as available for last-minute bookings</p>
                        </div>
                        <Switch
                          checked={settings.urgentWork}
                          onCheckedChange={(checked) => handleSettingChange('urgentWork', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Display Hourly Rate</Label>
                          <p className="text-sm text-gray-500">Show your hourly rate on your profile</p>
                        </div>
                        <Switch
                          checked={settings.displayHourlyRate}
                          onCheckedChange={(checked) => handleSettingChange('displayHourlyRate', checked)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="min-booking">Minimum Booking Duration (minutes)</Label>
                        <Select value={settings.minBookingDuration} onValueChange={(value) => handleSettingChange('minBookingDuration', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="buffer-time">Buffer Time Between Bookings (minutes)</Label>
                        <Select value={settings.bufferTime} onValueChange={(value) => handleSettingChange('bufferTime', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleSaveChanges} className="w-full">
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Billing Rate Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing Rate Settings</CardTitle>
                      <CardDescription>Configure your session billing rates and preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Use Custom Rate</Label>
                          <p className="text-sm text-gray-500">Override platform default with your own pricing</p>
                        </div>
                        <Switch
                          checked={settings.useCustomRate}
                          onCheckedChange={(checked) => handleSettingChange('useCustomRate', checked)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="current-rate">Current Rate: $5.00/min (Platform Default)</Label>
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-blue-700 text-sm">Current Rate: $5.00/min (Platform Default)</p>
                        </div>
                      </div>

                      <Button onClick={handleSaveBillingSettings} className="w-full">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Save Billing Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Design Session Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Design Session Settings</CardTitle>
                    <CardDescription>Configure your design session environment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="default-tools">Default Design Tools</Label>
                        <Select value={settings.defaultTools} onValueChange={(value) => handleSettingChange('defaultTools', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Tools</SelectItem>
                            <SelectItem value="basic">Basic Tools</SelectItem>
                            <SelectItem value="advanced">Advanced Tools</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="canvas-size">Default Canvas Size</Label>
                        <Select value={settings.defaultCanvasSize} onValueChange={(value) => handleSettingChange('defaultCanvasSize', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small (800x600)</SelectItem>
                            <SelectItem value="medium">Medium (1024x768)</SelectItem>
                            <SelectItem value="large">Large (1280x960)</SelectItem>
                            <SelectItem value="xlarge">X-Large (1920x1080)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="color-palette">Default Color Palette</Label>
                        <Select value={settings.defaultColorPalette} onValueChange={(value) => handleSettingChange('defaultColorPalette', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="vibrant">Vibrant</SelectItem>
                            <SelectItem value="pastel">Pastel</SelectItem>
                            <SelectItem value="monochrome">Monochrome</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Record Sessions</Label>
                        <p className="text-sm text-gray-500">Automatically record all design sessions</p>
                      </div>
                      <Switch
                        checked={settings.autoRecordSessions}
                        onCheckedChange={(checked) => handleSettingChange('autoRecordSessions', checked)}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Default Media Settings</Label>
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Camera className="w-4 h-4" />
                            <span className="text-sm">Camera</span>
                          </div>
                          <Select value={settings.cameraEnabled ? "enabled" : "disabled"} onValueChange={(value) => handleSettingChange('cameraEnabled', value === "enabled")}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="disabled">Disabled by default</SelectItem>
                              <SelectItem value="enabled">Enabled by default</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Monitor className="w-4 h-4" />
                            <span className="text-sm">Screen Sharing</span>
                          </div>
                          <Select value={settings.screenSharingEnabled ? "enabled" : "disabled"} onValueChange={(value) => handleSettingChange('screenSharingEnabled', value === "enabled")}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enabled">Enabled by default</SelectItem>
                              <SelectItem value="disabled">Disabled by default</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSaveChanges} className="w-full">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Settings</CardTitle>
                      <CardDescription>Manage your earnings and payment preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="payout-frequency">Payout Frequency</Label>
                        <Select value={settings.payoutFrequency} onValueChange={(value) => handleSettingChange('payoutFrequency', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="payout-method">Preferred Payout Method</Label>
                        <Select value={settings.payoutMethod} onValueChange={(value) => handleSettingChange('payoutMethod', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Tax Information</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Tax Form Status:</span>
                            <span className="font-medium">Completed</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tax ID Type:</span>
                            <span className="font-medium">SSN (Personal)</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Last Updated:</span>
                            <span className="font-medium">Jan 15, 2023</span>
                          </div>
                        </div>
                        <Button onClick={handleUpdateTaxInfo} className="w-full mt-3">
                          Update Tax Info
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor="hourly-rate">Hourly Rate (USD)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="hourly-rate"
                            value={settings.hourlyRate}
                            onChange={(e) => handleSettingChange('hourlyRate', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Your hourly rate impacts how often you appear in search results. The platform fee is 15% of your earnings.
                        </p>
                      </div>

                      <Button onClick={handleSaveChanges} className="w-full">
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Payout Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payout Information</CardTitle>
                      <CardDescription>Manage your withdrawal details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Account Holder Name</Label>
                        <Input value="Rajesh Kumar" readOnly className="bg-gray-50" />
                      </div>

                      <div>
                        <Label>Account Number</Label>
                        <Input value="••••••••••" readOnly className="bg-gray-50" />
                      </div>

                      <div>
                        <Label>Bank Name</Label>
                        <Input value="State Bank of India" readOnly className="bg-gray-50" />
                      </div>

                      <div>
                        <Label>Routing Number</Label>
                        <Input value="••••••••••" readOnly className="bg-gray-50" />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-700 font-medium text-sm">Your banking information is secure</span>
                        </div>
                        <p className="text-blue-600 text-sm mt-1">
                          We use industry-standard encryption to protect your sensitive financial information.
                        </p>
                      </div>

                      <Button onClick={handleSavePaymentDetails} className="w-full">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Save Payment Details
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Password */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>Update your password to keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPassword ? "text" : "password"}
                            value={settings.currentPassword}
                            onChange={(e) => handleSettingChange('currentPassword', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={settings.newPassword}
                          onChange={(e) => handleSettingChange('newPassword', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={settings.confirmPassword}
                          onChange={(e) => handleSettingChange('confirmPassword', e.target.value)}
                        />
                      </div>

                      <div className="text-sm text-gray-600">
                        <p className="mb-1">Password must:</p>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Check className="w-3 h-3 text-green-500" />
                            <span>Be at least 8 characters long</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Check className="w-3 h-3 text-green-500" />
                            <span>Include at least one uppercase letter</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Check className="w-3 h-3 text-green-500" />
                            <span>Include at least one number</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Check className="w-3 h-3 text-green-500" />
                            <span>Include at least one special character</span>
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleUpdatePassword} className="w-full">
                        <Key className="w-4 h-4 mr-2" />
                        Update Password
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Account Security */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Security</CardTitle>
                      <CardDescription>Enhance the security of your account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <Switch
                          checked={settings.twoFactorAuth}
                          onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                        />
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium">Active Sessions</Label>
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium text-sm">This Device</p>
                              <p className="text-sm text-gray-500">Windows • Chrome • New York</p>
                            </div>
                            <span className="text-sm text-green-600 font-medium">Current</span>
                          </div>

                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium text-sm">MacBook Pro</p>
                              <p className="text-sm text-gray-500">macOS • Safari • Chicago</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLogoutDevice('MacBook Pro')}
                            >
                              Logout
                            </Button>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          onClick={handleLogoutAllDevices}
                          className="w-full mt-3"
                        >
                          Logout of All Devices
                        </Button>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium">Login History</Label>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Today, 3:24 PM</p>
                              <p className="text-sm text-gray-500">New York, USA • Chrome on Windows</p>
                            </div>
                            <Check className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Yesterday, 7:15 PM</p>
                              <p className="text-sm text-gray-500">Chicago, USA • Safari on macOS</p>
                            </div>
                            <Check className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <Button variant="link" className="w-full mt-2 text-blue-600">
                          View Complete History
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Data Privacy */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Privacy</CardTitle>
                      <CardDescription>Manage your personal data and privacy settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="profile-visibility">Profile Visibility</Label>
                        <Select value={settings.profileVisibility} onValueChange={(value) => handleSettingChange('profileVisibility', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="contacts">Contacts Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">Control who can view your designer profile</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show Online Status</Label>
                          <p className="text-sm text-gray-500">Show when you're online to potential clients</p>
                        </div>
                        <Switch
                          checked={settings.showOnlineStatus}
                          onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show Recent Work</Label>
                          <p className="text-sm text-gray-500">Display your recent projects publicly</p>
                        </div>
                        <Switch
                          checked={settings.showRecentWork}
                          onCheckedChange={(checked) => handleSettingChange('showRecentWork', checked)}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Data Management</Label>
                        <div className="mt-3 space-y-2">
                          <Button variant="outline" onClick={handleExportData} className="w-full justify-start">
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteAccount} className="w-full justify-start">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </Button>
                        </div>
                      </div>

                      <Button onClick={handleSavePrivacySettings} className="w-full">
                        Save Privacy Settings
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Account Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Management</CardTitle>
                      <CardDescription>Manage your account and data settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Identity Verification</Label>
                        <div className="mt-2 flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">Your identity is verified</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Last verified on Jan 15, 2023</p>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium">Portfolio Content Rights</Label>
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm">Allow platform to showcase your work</span>
                              <p className="text-sm text-gray-500">We may feature your best work in our marketing materials</p>
                            </div>
                            <Switch
                              checked={settings.allowPortfolioShowcase}
                              onCheckedChange={(checked) => handleSettingChange('allowPortfolioShowcase', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm">Enable watermarking on previews</span>
                              <p className="text-sm text-gray-500">Add subtle watermarks to protect your work</p>
                            </div>
                            <Switch
                              checked={settings.enableWatermarking}
                              onCheckedChange={(checked) => handleSettingChange('enableWatermarking', checked)}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium">Account Actions</Label>
                        <div className="mt-3 space-y-2">
                          <Button variant="outline" className="w-full justify-start">
                            <Mail className="w-4 h-4 mr-2" />
                            Change Email Address
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Designer Profile
                          </Button>
                          <Button variant="destructive" className="w-full justify-start">
                            <LogOut className="w-4 h-4 mr-2" />
                            Log Out
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}