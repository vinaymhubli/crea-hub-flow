import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, DollarSign, Receipt, Shield, Bell, Globe, 
  Save, RefreshCw, AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: string;
  is_public: boolean;
  updated_at: string;
}

interface PlatformSettings {
  // Financial Settings
  platform_commission_rate: number;
  designer_commission_rate: number;
  tax_rate: number;
  minimum_withdrawal_amount: number;
  maximum_withdrawal_amount: number;
  
  // System Settings
  session_timeout_minutes: number;
  max_file_upload_size_mb: number;
  max_concurrent_sessions: number;
  
  // General Settings
  platform_name: string;
  platform_description: string;
  support_email: string;
  contact_phone: string;
  
  // Feature Flags
  enable_live_sessions: boolean;
  enable_wallet_system: boolean;
  enable_notifications: boolean;
  enable_analytics: boolean;
  
  // Security Settings
  require_email_verification: boolean;
  require_phone_verification: boolean;
  enable_two_factor_auth: boolean;
  password_min_length: number;
}

export default function PlatformSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings | null>(null);

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('singleton', true)
        .single();

      if (error) throw error;

      // Convert database row to settings object
      const settingsObj: PlatformSettings = {
        platform_commission_rate: (data.commission_rate || 15) / 100, // Convert percentage to decimal
        designer_commission_rate: 1 - ((data.commission_rate || 15) / 100), // Calculate designer rate
        tax_rate: data.tax_rate || 0.08,
        minimum_withdrawal_amount: data.minimum_withdrawal_amount || 50,
        maximum_withdrawal_amount: data.maximum_withdrawal_amount || 10000,
        session_timeout_minutes: data.session_timeout_minutes || 60,
        max_file_upload_size_mb: data.max_file_upload_size_mb || 100,
        max_concurrent_sessions: data.max_concurrent_sessions || 5,
        platform_name: data.platform_name || 'CreaHub Flow',
        platform_description: data.platform_description || 'Real-time design collaboration platform',
        support_email: data.support_email || 'support@creahubflow.com',
        contact_phone: data.contact_phone || '+1-555-0123',
        enable_live_sessions: data.enable_live_sessions !== false,
        enable_wallet_system: data.enable_wallet_system !== false,
        enable_notifications: data.enable_notifications !== false,
        enable_analytics: data.enable_analytics !== false,
        require_email_verification: data.require_email_verification !== false,
        require_phone_verification: data.require_phone_verification === true,
        enable_two_factor_auth: data.enable_two_factor_auth === true,
        password_min_length: data.password_min_length || 8,
      };

      setSettings(settingsObj);
      setOriginalSettings(JSON.parse(JSON.stringify(settingsObj)));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof PlatformSettings, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Check if there are changes
    const hasChanges = JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanges);
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      
      // Convert settings object to database row format
      const updateData = {
        commission_rate: settings.platform_commission_rate * 100, // Convert decimal to percentage
        tax_rate: settings.tax_rate,
        minimum_withdrawal_amount: settings.minimum_withdrawal_amount,
        maximum_withdrawal_amount: settings.maximum_withdrawal_amount,
        session_timeout_minutes: settings.session_timeout_minutes,
        max_file_upload_size_mb: settings.max_file_upload_size_mb,
        max_concurrent_sessions: settings.max_concurrent_sessions,
        platform_name: settings.platform_name,
        platform_description: settings.platform_description,
        support_email: settings.support_email,
        contact_phone: settings.contact_phone,
        enable_live_sessions: settings.enable_live_sessions,
        enable_wallet_system: settings.enable_wallet_system,
        enable_notifications: settings.enable_notifications,
        enable_analytics: settings.enable_analytics,
        require_email_verification: settings.require_email_verification,
        require_phone_verification: settings.require_phone_verification,
        enable_two_factor_auth: settings.enable_two_factor_auth,
        password_min_length: settings.password_min_length,
        updated_by: user.id,
      };

      // Update the singleton row
      const { error } = await supabase
        .from('platform_settings')
        .update(updateData)
        .eq('singleton', true);

      if (error) throw error;

      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      platform_commission_rate: 'Platform commission rate as a decimal (e.g., 0.10 for 10%)',
      designer_commission_rate: 'Designer commission rate as a decimal (e.g., 0.90 for 90%)',
      tax_rate: 'Default tax rate as a decimal (e.g., 0.08 for 8%)',
      minimum_withdrawal_amount: 'Minimum withdrawal amount in USD',
      maximum_withdrawal_amount: 'Maximum withdrawal amount in USD',
      session_timeout_minutes: 'Session timeout in minutes',
      max_file_upload_size_mb: 'Maximum file upload size in MB',
      max_concurrent_sessions: 'Maximum concurrent sessions per user',
      platform_name: 'Platform name displayed to users',
      platform_description: 'Platform description',
      support_email: 'Support email address',
      contact_phone: 'Contact phone number',
      enable_live_sessions: 'Enable live session functionality',
      enable_wallet_system: 'Enable wallet system',
      enable_notifications: 'Enable notifications',
      enable_analytics: 'Enable analytics tracking',
      require_email_verification: 'Require email verification for new users',
      require_phone_verification: 'Require phone verification for new users',
      enable_two_factor_auth: 'Enable two-factor authentication',
      password_min_length: 'Minimum password length',
    };
    return descriptions[key] || '';
  };

  const getSettingCategory = (key: string): string => {
    if (key.includes('commission') || key.includes('tax') || key.includes('withdrawal')) {
      return 'financial';
    }
    if (key.includes('session') || key.includes('file') || key.includes('concurrent')) {
      return 'system';
    }
    if (key.includes('enable') || key.includes('require') || key.includes('password')) {
      return 'security';
    }
    return 'general';
  };

  const isPublicSetting = (key: string): boolean => {
    const publicSettings = [
      'platform_name',
      'platform_description',
      'support_email',
      'contact_phone',
    ];
    return publicSettings.includes(key);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading platform settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={!hasChanges || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">You have unsaved changes. Click "Save Changes" to apply them.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Financial Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="platform_commission_rate">Platform Commission Rate</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="platform_commission_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settings.platform_commission_rate}
                      onChange={(e) => handleSettingChange('platform_commission_rate', parseFloat(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">({(settings.platform_commission_rate * 100).toFixed(1)}%)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('platform_commission_rate')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="designer_commission_rate">Designer Commission Rate</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="designer_commission_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settings.designer_commission_rate}
                      onChange={(e) => handleSettingChange('designer_commission_rate', parseFloat(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">({(settings.designer_commission_rate * 100).toFixed(1)}%)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('designer_commission_rate')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="tax_rate">Default Tax Rate</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settings.tax_rate}
                      onChange={(e) => handleSettingChange('tax_rate', parseFloat(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">({(settings.tax_rate * 100).toFixed(1)}%)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('tax_rate')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="minimum_withdrawal_amount">Minimum Withdrawal Amount</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="minimum_withdrawal_amount"
                      type="number"
                      min="0"
                      value={settings.minimum_withdrawal_amount}
                      onChange={(e) => handleSettingChange('minimum_withdrawal_amount', parseInt(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('minimum_withdrawal_amount')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="maximum_withdrawal_amount">Maximum Withdrawal Amount</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="maximum_withdrawal_amount"
                      type="number"
                      min="0"
                      value={settings.maximum_withdrawal_amount}
                      onChange={(e) => handleSettingChange('maximum_withdrawal_amount', parseInt(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('maximum_withdrawal_amount')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="session_timeout_minutes">Session Timeout</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="session_timeout_minutes"
                      type="number"
                      min="1"
                      value={settings.session_timeout_minutes}
                      onChange={(e) => handleSettingChange('session_timeout_minutes', parseInt(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('session_timeout_minutes')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="max_file_upload_size_mb">Max File Upload Size</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="max_file_upload_size_mb"
                      type="number"
                      min="1"
                      value={settings.max_file_upload_size_mb}
                      onChange={(e) => handleSettingChange('max_file_upload_size_mb', parseInt(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">MB</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('max_file_upload_size_mb')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="max_concurrent_sessions">Max Concurrent Sessions</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="max_concurrent_sessions"
                      type="number"
                      min="1"
                      value={settings.max_concurrent_sessions}
                      onChange={(e) => handleSettingChange('max_concurrent_sessions', parseInt(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">per user</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('max_concurrent_sessions')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="platform_name">Platform Name</Label>
                  <Input
                    id="platform_name"
                    value={settings.platform_name}
                    onChange={(e) => handleSettingChange('platform_name', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('platform_name')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => handleSettingChange('support_email', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('support_email')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone}
                    onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('contact_phone')}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="platform_description">Platform Description</Label>
                <Textarea
                  id="platform_description"
                  value={settings.platform_description}
                  onChange={(e) => handleSettingChange('platform_description', e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {getSettingDescription('platform_description')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_live_sessions">Enable Live Sessions</Label>
                    <p className="text-sm text-muted-foreground">
                      {getSettingDescription('enable_live_sessions')}
                    </p>
                  </div>
                  <Switch
                    id="enable_live_sessions"
                    checked={settings.enable_live_sessions}
                    onCheckedChange={(checked) => handleSettingChange('enable_live_sessions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_wallet_system">Enable Wallet System</Label>
                    <p className="text-sm text-muted-foreground">
                      {getSettingDescription('enable_wallet_system')}
                    </p>
                  </div>
                  <Switch
                    id="enable_wallet_system"
                    checked={settings.enable_wallet_system}
                    onCheckedChange={(checked) => handleSettingChange('enable_wallet_system', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_notifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      {getSettingDescription('enable_notifications')}
                    </p>
                  </div>
                  <Switch
                    id="enable_notifications"
                    checked={settings.enable_notifications}
                    onCheckedChange={(checked) => handleSettingChange('enable_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_analytics">Enable Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      {getSettingDescription('enable_analytics')}
                    </p>
                  </div>
                  <Switch
                    id="enable_analytics"
                    checked={settings.enable_analytics}
                    onCheckedChange={(checked) => handleSettingChange('enable_analytics', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require_email_verification">Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      {getSettingDescription('require_email_verification')}
                    </p>
                  </div>
                  <Switch
                    id="require_email_verification"
                    checked={settings.require_email_verification}
                    onCheckedChange={(checked) => handleSettingChange('require_email_verification', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require_phone_verification">Require Phone Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      {getSettingDescription('require_phone_verification')}
                    </p>
                  </div>
                  <Switch
                    id="require_phone_verification"
                    checked={settings.require_phone_verification}
                    onCheckedChange={(checked) => handleSettingChange('require_phone_verification', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_two_factor_auth">Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      {getSettingDescription('enable_two_factor_auth')}
                    </p>
                  </div>
                  <Switch
                    id="enable_two_factor_auth"
                    checked={settings.enable_two_factor_auth}
                    onCheckedChange={(checked) => handleSettingChange('enable_two_factor_auth', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="password_min_length"
                      type="number"
                      min="6"
                      max="50"
                      value={settings.password_min_length}
                      onChange={(e) => handleSettingChange('password_min_length', parseInt(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">characters</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSettingDescription('password_min_length')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
