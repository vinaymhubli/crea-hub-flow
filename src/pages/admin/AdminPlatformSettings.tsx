import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  DollarSign, 
  Receipt, 
  CreditCard, 
  TrendingUp,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
  is_active: boolean;
  updated_at: string;
}

interface PlatformEarnings {
  total_platform_fees: number;
  total_gst_collected: number;
  total_penalty_fees: number; // deprecated
  total_earnings: number;
  transaction_count: number;
}

export default function AdminPlatformSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [platformEarnings, setPlatformEarnings] = useState<PlatformEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchPlatformEarnings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch platform settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformEarnings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_platform_earnings_summary');
      if (error) throw error;
      setPlatformEarnings(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching platform earnings:', error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      for (const [key, value] of Object.entries(editedSettings)) {
        const setting = settings.find(s => s.setting_key === key);
        if (!setting) continue;

        const { error } = await supabase
          .from('platform_settings')
          .update({
            setting_value: value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          })
          .eq('setting_key', key);

        if (error) throw error;
      }

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: user?.id,
        p_action_type: 'platform_settings_update',
        p_target_type: 'settings',
        p_description: 'Updated platform settings',
        p_metadata: { updated_settings: Object.keys(editedSettings) }
      });

      toast({
        title: "Settings Updated",
        description: "Platform settings have been updated successfully",
      });

      setEditedSettings({});
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getSettingValue = (setting: PlatformSetting) => {
    const editedValue = editedSettings[setting.setting_key];
    if (editedValue !== undefined) {
      return editedValue;
    }
    return setting.setting_value;
  };

  const hasChanges = Object.keys(editedSettings).length > 0;

  const renderSettingInput = (setting: PlatformSetting) => {
    const value = getSettingValue(setting);
    const isPercentage = setting.setting_value?.type === 'percentage';
    const isCurrency = setting.setting_value?.type === 'currency';

    if (isPercentage || isCurrency) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value?.value || 0}
            onChange={(e) => handleSettingChange(setting.setting_key, {
              ...value,
              value: parseFloat(e.target.value) || 0
            })}
            className="w-32"
            min="0"
            step={isPercentage ? "0.1" : "1"}
          />
          <span className="text-sm text-gray-500">
            {isPercentage ? '%' : '₹'}
          </span>
        </div>
      );
    }

    return (
      <Input
        value={value || ''}
        onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
        className="w-full"
      />
    );
  };

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-gray-600">Manage GST rates, platform fees, and other platform settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges || saving}>
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Platform Earnings Summary */}
      {platformEarnings && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Platform Fees</p>
                  <p className="text-2xl font-bold">₹{platformEarnings.total_platform_fees.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">GST Collected</p>
                  <p className="text-2xl font-bold">₹{platformEarnings.total_gst_collected.toFixed(2)}</p>
                </div>
                <Receipt className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  {/* Penalty Fees removed */}
                  <p className="text-sm font-medium text-gray-600">Net Admin Earnings</p>
                  <p className="text-2xl font-bold">₹{(platformEarnings.total_commission_earned).toFixed(2)}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{platformEarnings.total_earnings.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="fees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fees">Fees & Rates</TabsTrigger>
          <TabsTrigger value="limits">Limits & Thresholds</TabsTrigger>
          <TabsTrigger value="other">Other Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Fee Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings
                .filter(s => s.setting_key.includes('rate') || s.setting_key.includes('fee'))
                .map((setting) => (
                  <div key={setting.setting_key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">
                        {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {renderSettingInput(setting)}
                      <Switch
                        checked={setting.is_active}
                        onCheckedChange={(checked) => handleSettingChange(setting.setting_key, {
                          ...getSettingValue(setting),
                          is_active: checked
                        })}
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Limits & Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings
                .filter(s => s.setting_key.includes('amount') || s.setting_key.includes('threshold'))
                .map((setting) => (
                  <div key={setting.setting_key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">
                        {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {renderSettingInput(setting)}
                      <Switch
                        checked={setting.is_active}
                        onCheckedChange={(checked) => handleSettingChange(setting.setting_key, {
                          ...getSettingValue(setting),
                          is_active: checked
                        })}
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Other Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings
                .filter(s => !s.setting_key.includes('rate') && !s.setting_key.includes('fee') && 
                           !s.setting_key.includes('amount') && !s.setting_key.includes('threshold'))
                .map((setting) => (
                  <div key={setting.setting_key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">
                        {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {renderSettingInput(setting)}
                      <Switch
                        checked={setting.is_active}
                        onCheckedChange={(checked) => handleSettingChange(setting.setting_key, {
                          ...getSettingValue(setting),
                          is_active: checked
                        })}
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Changes Indicator */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800 font-medium">
                You have unsaved changes. Click "Save Changes" to apply them.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-blue-800">
              <h4 className="font-medium mb-2">How Platform Fees Work</h4>
              <ul className="text-sm space-y-1">
                <li>• Platform fees are deducted from designer earnings before payment</li>
                <li>• GST is calculated on the total transaction amount</li>
                {/* <li>• Penalty fees are charged for complaints and policy violations</li> */}
                <li>• All fees are automatically transferred to the admin wallet</li>
                <li>• Changes to rates apply to new transactions only</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
