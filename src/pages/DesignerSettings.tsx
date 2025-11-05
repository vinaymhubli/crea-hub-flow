import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings,
  Globe,
  CreditCard,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Palette,
  Monitor,
  Smartphone,
  Download,
  Trash2,
  Save,
  User,
  DollarSign,
  LogOut,
  LayoutDashboard,
  Package
} from 'lucide-react';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DesignerSidebar } from '@/components/DesignerSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useDesignerProfile } from "@/hooks/useDesignerProfile";
import { useDesignerAvailability } from "@/hooks/useDesignerAvailability";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import NotificationBell from '@/components/NotificationBell';


export default function DesignerSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { user, profile, signOut } = useAuth();

  const userInitials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email ? user.email.substring(0, 2).toUpperCase()
    : 'D';

  const userDisplayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email?.split('@')[0] || 'Designer';
  const { toast } = useToast();

  // Export sessions and earnings as CSV files (simple multi-file download)
  const handleExportAccountData = async () => {
    try {
      if (!user) return;

      // Fetch bookings (sessions) for this user (as designer or customer)
      const { data: bookings } = await (supabase as any)
        .from('bookings')
        .select('*')
        .or(`designer_id.eq.${user.id},customer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      // Fetch wallet transactions (earnings history)
      const { data: transactions } = await (supabase as any)
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const toCsv = (rows: any[]) => {
        if (!rows || rows.length === 0) return '';
        const headers = Object.keys(rows[0]);
        const escape = (v: any) => {
          if (v === null || v === undefined) return '';
          return String(v).replace(/\"/g, '""');
        };
        const body = rows.map(r => headers.map(h => `"${escape(r[h])}"`).join(','));
        return [headers.join(','), ...body].join('\n');
      };

      const files = [
        { name: 'sessions.csv', content: toCsv(bookings || []) },
        { name: 'earnings_transactions.csv', content: toCsv(transactions || []) },
      ];

      files.forEach(f => {
        const blob = new Blob([f.content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Error exporting account data', err);
    }
  };

  // Update password
  const handleUpdatePassword = async () => {
    try {
      if (!currentPassword) {
        toast({ title: "Enter current password", description: "Please type your current password to continue.", variant: "destructive" });
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: "Passwords do not match", description: "New password and confirm password must match.", variant: "destructive" });
        return;
      }
      setUpdatingPassword(true);
      // Re-authenticate with current password
      const email = (user as any)?.email;
      if (!email) throw new Error('User email not found');
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Your password has been changed." });
    } catch (e: any) {
      console.error('Update password failed', e);
      toast({ title: "Failed to update password", description: e?.message || 'Try again', variant: "destructive" });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Open official Government of India Form 16 help/download page
  const handleDownloadForm16 = () => {
    window.open('https://www.incometax.gov.in/iec/foportal/help/form16', '_blank');
  };
  const { settings: userSettings, loading: settingsLoading, updateSetting } = useUserSettings();
  const { designerProfile, loading: profileLoading, updateDesignerProfile } = useDesignerProfile();
  const { settings: availabilitySettings, loading: availabilityLoading, updateSettings: updateAvailabilitySettings } = useDesignerAvailability();

  if (settingsLoading || profileLoading || availabilityLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
          <DesignerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const devices = [
    { name: "MacBook Pro", type: "desktop", location: "San Francisco, CA", lastActive: "Current session", status: "active" },
    { name: "iPhone 14 Pro", type: "mobile", location: "San Francisco, CA", lastActive: "2 hours ago", status: "active" },
    { name: "iPad Air", type: "tablet", location: "San Francisco, CA", lastActive: "1 day ago", status: "inactive" }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          <DashboardHeader
            title="Settings"
            subtitle="Manage your account settings and preferences"
            icon={<Settings className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            additionalInfo={
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 text-xs sm:text-sm">
                <span className="text-white/90 font-medium">Account active</span>
                <span className="text-white/60 hidden sm:inline">•</span>
                <span className="text-white/90 font-medium">All systems operational</span>
              </div>
            }
            userInitials={userInitials}
            isOnline={true}
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-4">
                <NotificationBell />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {userInitials}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-64 w-fit p-0" align="end">
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
                          to="/designer-dashboard"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          to="/designer-dashboard/services"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Package className="w-4 h-4 mr-3" />
                          Services
                        </Link>
                        <Link
                          to="/designer-dashboard/earnings"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <DollarSign className="w-4 h-4 mr-3" />
                          Earnings
                        </Link>
                        <Link
                          to="/designer-dashboard/profile"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button
                          onClick={async () => {
                            try {
                              await signOut();
                            } catch (error) {
                              console.error('Error signing out:', error);
                            }
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm w-full sm:w-auto">
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            }
          />

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-1.5 sm:p-2 mb-6 sm:mb-8 overflow-x-auto">
                <TabsList className="grid w-auto grid-cols-5 bg-transparent gap-2">
                  <TabsTrigger 
                    value="general"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold flex items-center space-x-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span>General</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold flex items-center space-x-2"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profile"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold flex items-center space-x-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Security</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="billing"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-6 font-semibold flex items-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Billing</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Globe className="w-5 h-5 mr-2" />
                        Regional Settings
                      </CardTitle>
                      <CardDescription className="text-white/80">Configure your location and language preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Label className="font-semibold text-gray-700">Language</Label>
                        <Select value={userSettings.language} onValueChange={(value) => updateSetting('language', value)}>
                          <SelectTrigger className="border-gray-200 focus:border-green-400">
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

                      <div>
                        <Label className="font-semibold text-gray-700">Timezone</Label>
                        <Select value={userSettings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                          <SelectTrigger className="border-gray-200 focus:border-green-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Standard Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Standard Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Standard Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Standard Time</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="font-semibold text-gray-700">Currency</Label>
                        <Select value={userSettings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                          <SelectTrigger className="border-gray-200 focus:border-green-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Palette className="w-5 h-5 mr-2" />
                        Appearance
                      </CardTitle>
                      <CardDescription className="text-white/80">Customize your interface appearance</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Label className="font-semibold text-gray-700">Date Format</Label>
                        <Select value={userSettings.date_format} onValueChange={(value) => updateSetting('date_format', value)}>
                          <SelectTrigger className="border-gray-200 focus:border-green-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="font-semibold text-gray-700">Time Format</Label>
                        <Select value={userSettings.time_format} onValueChange={(value) => updateSetting('time_format', value)}>
                          <SelectTrigger className="border-gray-200 focus:border-green-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12h">12 Hour</SelectItem>
                            <SelectItem value="24h">24 Hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold text-gray-700">Compact Mode</Label>
                          <p className="text-sm text-gray-500">Use a more compact interface</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold text-gray-700">Animations</Label>
                          <p className="text-sm text-gray-500">Enable interface animations</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription className="text-white/80">Configure how you receive updates and alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Email Notifications</h4>
                      <div className="space-y-4">
                        {[
                          { key: 'notifications_email', label: 'Booking requests and updates', desc: 'New bookings, cancellations, and changes' },
                          { key: 'notifications_email', label: 'Payment notifications', desc: 'Payment confirmations and receipts' },
                          { key: 'notifications_marketing', label: 'Marketing and tips', desc: 'Designer tips and product updates' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <Label className="font-medium text-gray-700">{item.label}</Label>
                              <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                            <Switch 
                              checked={userSettings[item.key as keyof typeof userSettings] as boolean}
                              onCheckedChange={(checked) => updateSetting(item.key as any, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Push Notifications</h4>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label className="font-medium text-gray-700">Browser notifications</Label>
                          <p className="text-sm text-gray-500">Real-time notifications in your browser</p>
                        </div>
                        <Switch 
                          checked={userSettings.notifications_push}
                          onCheckedChange={(checked) => updateSetting('notifications_push', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-br from-green-400 to-teal-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Public Profile
                      </CardTitle>
                      <CardDescription className="text-white/80">Control how others see your profile</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold text-gray-700">Public profile</Label>
                          <p className="text-sm text-gray-500">Allow others to find and view your profile</p>
                        </div>
                        <Switch 
                          checked={userSettings.privacy_profile_visible}
                          onCheckedChange={(checked) => updateSetting('privacy_profile_visible', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold text-gray-700">Show online status</Label>
                          <p className="text-sm text-gray-500">Let clients see when you're online</p>
                        </div>
                        <Switch 
                          checked={userSettings.privacy_activity_status}
                          onCheckedChange={(checked) => updateSetting('privacy_activity_status', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold text-gray-700">Auto-accept bookings</Label>
                          <p className="text-sm text-gray-500">Automatically accept booking requests</p>
                        </div>
                        <Switch 
                          checked={availabilitySettings?.auto_accept_bookings || false}
                          onCheckedChange={(checked) => updateAvailabilitySettings({ auto_accept_bookings: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Pricing Settings
                      </CardTitle>
                      <CardDescription className="text-white/80">Configure your rates and pricing</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Label className="font-semibold text-gray-700">Per Minute Rate</Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">₹</span>
                          <Input 
                            type="number"
                            value={designerProfile?.hourly_rate || 0}
                            onChange={(e) => updateDesignerProfile({ hourly_rate: Number(e.target.value) })}
                            className="flex-1 border-gray-200 focus:border-green-400"
                          />
                          <span className="text-gray-500">/min</span>
                        </div>
                      </div>

                      <div>
                        <Label className="font-semibold text-gray-700">Minimum session duration</Label>
                        <Select defaultValue="60">
                          <SelectTrigger className="border-gray-200 focus:border-green-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div className="flex justify-center py-8 px-4">
                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 w-full max-w-3xl mx-auto">
                    <CardHeader className="bg-gradient-to-br from-red-400 to-pink-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Lock className="w-5 h-5 mr-2" />
                        Password & Authentication
                      </CardTitle>
                      <CardDescription className="text-white/80">Secure your account</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Label className="font-semibold text-gray-700">Current Password</Label>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="border-gray-200 focus:border-green-400 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="font-semibold text-gray-700">New Password</Label>
                        <div className="relative">
                          <Input 
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="border-gray-200 focus:border-green-400 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="font-semibold text-gray-700">Confirm New Password</Label>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-type new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="border-gray-200 focus:border-green-400 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {/*
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold text-gray-700">Two-factor authentication</Label>
                          <p className="text-sm text-gray-500">Add an extra layer of security</p>
                        </div>
                        <Switch 
                          checked={userSettings.security_two_factor}
                          onCheckedChange={(checked) => updateSetting('security_two_factor', checked)}
                        />
                      </div>
                      */}

                      <Button className="w-full bg-gradient-to-r from-red-400 to-pink-500 text-white" onClick={handleUpdatePassword} disabled={updatingPassword}>
                        {updatingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/*
                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Monitor className="w-5 h-5 mr-2" />
                        Active Sessions
                      </CardTitle>
                      <CardDescription className="text-white/80">Manage your logged-in devices</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {devices.map((device, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                              {device.type === 'desktop' && <Monitor className="w-5 h-5 text-white" />}
                              {device.type === 'mobile' && <Smartphone className="w-5 h-5 text-white" />}
                              {device.type === 'tablet' && <Monitor className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{device.name}</h4>
                              <p className="text-sm text-gray-500">{device.location}</p>
                              <p className="text-xs text-gray-400">{device.lastActive}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={device.status === 'active' ? 'default' : 'secondary'}>
                              {device.status}
                            </Badge>
                            {device.status !== 'active' && (
                              <Button variant="ghost" size="sm">
                                <LogOut className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      <Button variant="outline" className="w-full">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out all devices
                      </Button>
                    </CardContent>
                  </Card>
                  */}
                </div>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Payment Methods
                      </CardTitle>
                      <CardDescription className="text-white/80">Manage how you receive payments</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Label className="font-semibold text-gray-700">Payout Method</Label>
                        <Select defaultValue="bank">
                          <SelectTrigger className="border-gray-200 focus:border-green-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                            {/* <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem> */}
                          </SelectContent>
                        </Select>
                      </div>

                      {/*
                      <Button className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                      */}

                      <div className="flex flex-col md:flex-row items-center justify-center gap-3">
                        <Button variant="outline" className="min-w-[240px]" onClick={handleExportAccountData}>
                          <Download className="w-4 h-4 mr-2" />
                          Export Account Data
                        </Button>
                        <Button variant="outline" className="min-w-[240px]" onClick={handleDownloadForm16}>
                          <Download className="w-4 h-4 mr-2" />
                          Download Form 16
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-br from-red-400 to-orange-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Trash2 className="w-5 h-5 mr-2" />
                        Account Management
                      </CardTitle>
                      <CardDescription className="text-white/80">Account deletion</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">

                      <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>

                      <p className="text-xs text-gray-500">
                        Account deletion is permanent and cannot be undone. All your data will be permanently removed.
                      </p>
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