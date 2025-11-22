import { useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  MessageCircle, 
  Bell,
  Wallet,
  LogOut,
  Smartphone,
  Mail,
  Trash2,
  AlertCircle,
  Download
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/hooks/useUserSettings';
import { supabase } from '@/integrations/supabase/client';
import { CustomerSidebar } from '@/components/CustomerSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import NotificationBell from '@/components/NotificationBell';
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
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';

export default function CustomerSettings() {
  const { user, profile, signOut } = useAuth();
  const { settings, loading, saving, updateSetting } = useUserSettings();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  // Export account data: session payments with designer names, tax deducted, money transferred, and wallet deposits
  const handleExportAccountData = async () => {
    try {
      if (!user || !profile) return;
      
      // Ensure user is a customer (not a designer)
      const isCustomer = profile.user_type === 'customer' || profile.user_type === 'client';
      
      if (!isCustomer || profile.user_type === 'designer') {
        console.error('User is not a customer');
        return;
      }
      
      // Fetch session invoices - only customer invoices (payments)
      const { data: invoices, error: invoicesError } = await (supabase as any)
        .from('invoices')
        .select('*')
        .eq('customer_id', user.id)
        .eq('invoice_type', 'customer')
        .order('created_at', { ascending: false });

      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        return;
      }

      // Get unique designer IDs
      const designerIds = [...new Set((invoices || []).map((inv: any) => inv.designer_id).filter(Boolean))];

      // Fetch designer profiles
      const { data: designersData } = await (supabase as any)
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', designerIds);

      // Create lookup map
      const designersMap = new Map(designersData?.map((d: any) => [d.user_id, d]) || []);

      // Fetch wallet deposits (money added to wallet)
      const { data: deposits, error: depositsError } = await (supabase as any)
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'deposit')
        .order('created_at', { ascending: false });

      if (depositsError) {
        console.error('Error fetching deposits:', depositsError);
      }

      // Format invoice data for CSV
      const formatInvoiceRow = (invoice: any) => {
        const designer = designersMap.get(invoice.designer_id) as any;
        const designerName = designer 
          ? `${designer.first_name || ''} ${designer.last_name || ''}`.trim() || designer.email || 'Unknown'
          : 'Unknown';
        
        return {
          'Date': new Date(invoice.created_at).toLocaleDateString('en-IN'),
          'Designer Name': designerName,
          'Invoice Type': invoice.invoice_type || 'customer',
          'Tax Deducted (₹)': (invoice.tax_amount || 0).toFixed(2),
          'Money Transferred (₹)': (invoice.total_amount || 0).toFixed(2),
          'Money Added to Wallet (₹)': '0.00',
          'Invoice Number': invoice.invoice_number || '',
          'Session ID': invoice.session_id || ''
        };
      };

      // Format deposit data for CSV
      const formatDepositRow = (deposit: any) => {
        return {
          'Date': new Date(deposit.created_at).toLocaleDateString('en-IN'),
          'Designer Name': 'N/A',
          'Invoice Type': 'Wallet Deposit',
          'Tax Deducted (₹)': '0.00',
          'Money Transferred (₹)': '0.00',
          'Money Added to Wallet (₹)': (parseFloat(deposit.amount) || 0).toFixed(2),
          'Transaction ID': deposit.id || '',
          'Description': deposit.description || 'Wallet Recharge'
        };
      };

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

      // Combine invoices and deposits
      const formattedInvoices = (invoices || []).map(formatInvoiceRow);
      const formattedDeposits = (deposits || []).map(formatDepositRow);
      
      // Add "Money Added to Wallet" column to invoice rows (set to 0)
      const invoicesWithWallet = formattedInvoices.map(row => ({
        ...row,
        'Money Added to Wallet (₹)': '0.00'
      }));

      const allRows = [...invoicesWithWallet, ...formattedDeposits];
      const csvContent = toCsv(allRows);

      // Download single CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customer_payments_and_wallet.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting account data', err);
    }
  };

  // Redirect to official Government of India Form 16 page
  const handleGetForm16 = () => {
    window.open('https://incometaxindia.gov.in/Pages/tax-services/form-16A-download-deductor.aspx', '_blank');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <CustomerSidebar />
        
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <DashboardHeader
            title="Settings"
            subtitle="Manage your account preferences"
            avatarImage={profile?.avatar_url}
            userInitials={getInitials()}
            isOnline={true}
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-4">
                <NotificationBell />
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
                  <PopoverContent className="min-w-64 w-fit p-0" align="end">
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
            }
          />

          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-x-hidden">
            {/* Settings Tabs */}
            <Card className="overflow-hidden border-0 shadow-lg w-full">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Account Settings</CardTitle>
                <CardDescription>Customize your account preferences and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-hidden">
                <Tabs defaultValue="privacy" className="space-y-6 w-full">
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <TabsList className="inline-flex w-max min-w-full sm:grid sm:grid-cols-1 sm:w-full">
                      <TabsTrigger value="privacy" className="whitespace-nowrap px-3 sm:px-4">Privacy</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Notifications Settings */}
                  <TabsContent value="notifications">
                    {/* NOTE: Notification preferences are saved to database but are NOT currently checked
                        before sending notifications. The notification system sends all notifications regardless
                        of these settings. Commented out until backend implementation is complete.
                    */}
                    {/*
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
                    */}
                    <div className="text-center py-12 text-gray-500">
                      <p>Notification preferences will be available here soon.</p>
                    </div>
                  </TabsContent>

                  {/* Privacy Settings */}
                  <TabsContent value="privacy">
                    <div className="space-y-6">
                      {/* NOTE: Privacy settings are saved to database but are NOT currently used to filter
                          profiles or control visibility. Commented out until backend implementation is complete.
                      */}
                      {/*
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
                      */}

                      {/* Account Data Section */}
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-4">Account Data</h3>
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
                            <Button variant="outline" className="min-w-[240px]" onClick={handleExportAccountData}>
                              <Download className="w-4 h-4 mr-2" />
                              Export Account Data
                            </Button>
                            <Button variant="outline" className="min-w-[240px]" onClick={handleGetForm16}>
                              Get Form 16
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Delete Account Section */}
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-4 text-red-600">Danger Zone</h3>
                        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Delete Account</p>
                              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                            </div>
                            <Button 
                              variant="destructive" 
                              className="flex items-center space-x-2"
                              onClick={() => setShowDeleteDialog(true)}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Security Settings */}
                  <TabsContent value="security">
                    {/* NOTE: Security login alerts setting is saved to database but is NOT currently implemented.
                        Commented out until backend implementation is complete.
                    */}
                    {/*
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                        <div className="space-y-4">
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
                    */}
                    <div className="text-center py-12 text-gray-500">
                      <p>Security settings will be available here soon.</p>
                    </div>
                  </TabsContent>

                  {/* General Settings */}
                  <TabsContent value="general">
                    {/* NOTE: Language, Timezone, and Time Format settings are saved to database
                        but are NOT currently used anywhere in the application. Commented out until
                        backend implementation is complete.
                    */}
                    {/*
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

                      </div>
                    </div>
                    */}
                    <div className="text-center py-12 text-gray-500">
                      <p>General preferences will be available here soon.</p>
                    </div>
                  </TabsContent>

                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Delete Account Dialog */}
      <DeleteAccountDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
    </SidebarProvider>
  );
}