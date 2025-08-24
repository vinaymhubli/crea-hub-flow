import { useState, useEffect } from 'react';
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
  LogOut
} from 'lucide-react';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DesignerSidebar } from '@/components/DesignerSidebar';
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


export default function DesignerSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);
  
  const { user } = useAuth();
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
          {/* Enhanced Header */}
          <header className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2" />
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-white/90 text-lg">Manage your account settings and preferences</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-white/90 font-medium">Account active</span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">All systems operational</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 mb-8">
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
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
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
                        <Label className="font-semibold text-gray-700">Hourly Rate</Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">$</span>
                          <Input 
                            type="number"
                            value={designerProfile?.hourly_rate || 0}
                            onChange={(e) => updateDesignerProfile({ hourly_rate: Number(e.target.value) })}
                            className="flex-1 border-gray-200 focus:border-green-400"
                          />
                          <span className="text-gray-500">/hour</span>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
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
                            className="border-gray-200 focus:border-green-400"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="font-semibold text-gray-700">New Password</Label>
                        <Input 
                          type="password"
                          placeholder="Enter new password"
                          className="border-gray-200 focus:border-green-400"
                        />
                      </div>

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

                      <Button className="w-full bg-gradient-to-r from-red-400 to-pink-500 text-white">
                        Update Password
                      </Button>
                    </CardContent>
                  </Card>

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
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>

                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download Tax Forms
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-br from-red-400 to-orange-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Trash2 className="w-5 h-5 mr-2" />
                        Account Management
                      </CardTitle>
                      <CardDescription className="text-white/80">Account deletion and data export</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Export Account Data
                      </Button>

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