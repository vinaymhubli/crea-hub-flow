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
  total_commission_earned?: number; // optional for backward compatibility
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
  // New: platform minimum rate per minute
  const [minRate, setMinRate] = useState<number>(5.0);
  const [minRateLoading, setMinRateLoading] = useState<boolean>(false);
  const [minRateSaving, setMinRateSaving] = useState<boolean>(false);
  // Designers rate overview
  const [designers, setDesigners] = useState<Array<{
    id: string;
    user_id: string;
    name: string;
    hourly_rate: number | null; // stored as per-minute in some UIs, but DB trigger enforces minimum * 60 if hourly
  }>>([]);
  const [designersLoading, setDesignersLoading] = useState<boolean>(false);
  const [designerSearch, setDesignerSearch] = useState<string>("");
  const [designerPage, setDesignerPage] = useState<number>(1);
  const [designerPageSize] = useState<number>(10);
  const [designerTotal, setDesignerTotal] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchPlatformEarnings();
      loadMinRate();
      loadDesignersRates();
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

      // Always persist platform minimum rate as part of Save Changes
      await saveMinRate();

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

  // New: load/save platform minimum rate per minute from platform_settings column
  const loadMinRate = async () => {
    try {
      setMinRateLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('id, min_rate_per_minute')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setMinRate(parseFloat(data[0].min_rate_per_minute ?? 5.0));
      } else {
        setMinRate(5.0);
      }
    } catch (e) {
      console.error('Error loading min rate:', e);
    } finally {
      setMinRateLoading(false);
    }
  };

  const saveMinRate = async () => {
    try {
      setMinRateSaving(true);
      // Try update latest row; if none, insert one
      const { data: rows, error: selErr } = await supabase
        .from('platform_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (selErr) throw selErr;

      if (rows && rows.length > 0) {
        const id = rows[0].id;
        const { error: updErr } = await supabase
          .from('platform_settings')
          .update({ min_rate_per_minute: minRate, updated_at: new Date().toISOString(), updated_by: user?.id })
          .eq('id', id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('platform_settings')
          .insert({ min_rate_per_minute: minRate, updated_at: new Date().toISOString(), updated_by: user?.id });
        if (insErr) throw insErr;
      }

      toast({
        title: 'Minimum rate updated',
        description: `Platform minimum rate set to ₹${minRate.toFixed(2)} / min`,
      });
    } catch (e: any) {
      console.error('Error saving min rate:', e);
      toast({ title: 'Error', description: e?.message ?? 'Failed to save minimum rate', variant: 'destructive' });
    } finally {
      setMinRateSaving(false);
    }
  };

  const loadDesignersRates = async () => {
    try {
      setDesignersLoading(true);
      const from = (designerPage - 1) * designerPageSize;
      const to = from + designerPageSize - 1;
      let filteredUserIds: string[] | null = null;
      if (designerSearch.trim()) {
        // Search across ALL designers by matching profiles first, then filter designers by those user_ids
        const term = `%${designerSearch.trim()}%`;
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_type', 'designer')
          .or(`first_name.ilike.${term},last_name.ilike.${term}`);
        if (profErr) throw profErr;
        filteredUserIds = (profs || []).map((p: any) => p.user_id).filter(Boolean);
        if ((filteredUserIds?.length || 0) === 0) {
          setDesigners([]);
          setDesignerTotal(0);
          return;
        }
      }

      let query = supabase
        .from('designers')
        .select('id, user_id, hourly_rate, profiles:user_id(first_name,last_name)', { count: 'exact' })
        .order('id', { ascending: true });

      if (filteredUserIds) {
        query = query.in('user_id', filteredUserIds as any);
      }

      // get count with same filter
      const { count: totalCount, error: countErr } = await query;
      if (countErr) throw countErr;

      // apply pagination on the same filter
      const { data, error } = await query.range(from, to);
      if (error) throw error;
      const list = (data || []).map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        name: `${d.profiles?.first_name || ''} ${d.profiles?.last_name || ''}`.trim() || 'Designer',
        hourly_rate: d.hourly_rate ?? null,
      }));
      setDesigners(list);
      if (typeof totalCount === 'number') setDesignerTotal(totalCount);
    } catch (e) {
      console.error('Error loading designers rates:', e);
    } finally {
      setDesignersLoading(false);
    }
  };

  const saveDesignerRate = async (designerId: string, newPerMinute: number) => {
    try {
      // Validate against platform min
      const { data: minData } = await supabase.rpc('get_min_rate_per_minute');
      const platformMin = parseFloat((Array.isArray(minData) ? minData?.[0] : minData) ?? minRate ?? 5.0);
      if (newPerMinute < platformMin) {
        toast({
          title: 'Below platform minimum',
          description: `You cannot set below ₹${platformMin.toFixed(2)} / min`,
          variant: 'destructive'
        });
        return;
      }

      // designers.hourly_rate stores rate (some UIs use per-minute). We keep consistency with existing UI: per-minute input here.
      const newHourly = newPerMinute * 60.0;
      const { error } = await supabase
        .from('designers')
        .update({ hourly_rate: newHourly, updated_at: new Date().toISOString() })
        .eq('id', designerId);
      if (error) throw error;
      toast({ title: 'Rate updated', description: `Designer rate set to ₹${newPerMinute.toFixed(2)} / min` });
      await loadDesignersRates();
    } catch (e: any) {
      console.error('Error saving designer rate:', e);
      toast({ title: 'Error', description: e?.message ?? 'Failed to save designer rate', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (user) {
      loadDesignersRates();
    }
  }, [designerSearch, designerPage, user]);

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
      {platformEarnings && platformEarnings.total_platform_fees !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Platform Fees</p>
                  <p className="text-2xl font-bold">₹{(platformEarnings.total_platform_fees || 0).toFixed(2)}</p>
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
                  <p className="text-2xl font-bold">₹{(platformEarnings.total_gst_collected || 0).toFixed(2)}</p>
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
                  <p className="text-2xl font-bold">₹{(platformEarnings.total_commission_earned || 0).toFixed(2)}</p>
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
                  <p className="text-2xl font-bold">₹{(platformEarnings.total_earnings || 0).toFixed(2)}</p>
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
          {/* <TabsTrigger value="limits">Limits & Thresholds</TabsTrigger> */}
          {/* <TabsTrigger value="other">Other Settings</TabsTrigger> */}
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
              {/* Platform minimum rate per minute */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-medium">Minimum Rate Per Minute (₹)</Label>
                  <p className="text-sm text-gray-600 mt-1">Designers cannot set a rate below this amount. Applies immediately.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    className="w-32"
                    min={0}
                    step={0.1}
                    value={minRate}
                    onChange={(e) => setMinRate(parseFloat(e.target.value) || 0)}
                  disabled={minRateLoading || saving}
                  />
                {/* Saved via the top Save Changes button */}
                </div>
              </div>

              {settings
                .filter(s => s.setting_key === 'platform_fee_rate')
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

          {/* Designers rate overview - restored */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Designers Rates Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search designer by name"
                    className="w-64"
                    value={designerSearch}
                    onChange={(e) => { setDesignerPage(1); setDesignerSearch(e.target.value); }}
                  />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>
                    Page {designerPage} · {Math.min((designerPage - 1) * designerPageSize + 1, Math.max(designerTotal, 0))}-{Math.min(designerPage * designerPageSize, Math.max(designerTotal, 0))} of {designerTotal}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" disabled={designerPage === 1 || designersLoading} onClick={() => setDesignerPage(p => Math.max(1, p - 1))}>Prev</Button>
                    <Button variant="outline" disabled={designerPage * designerPageSize >= designerTotal || designersLoading} onClick={() => setDesignerPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              </div>
              {designersLoading ? (
                <div className="text-sm text-gray-500">Loading designers...</div>
              ) : (
                <div className="space-y-2">
                  {designers.map((d) => {
                    const perMinute = d.hourly_rate ? Number(d.hourly_rate) / 60.0 : 0;
                    return (
                      <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="font-medium truncate">{d.name}</div>
                          <div className="text-xs text-gray-500">Designer ID: {d.id}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">₹</span>
                          <Input
                            type="number"
                            className="w-24"
                            step={0.1}
                            min={0}
                            defaultValue={perMinute.toFixed(2)}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value || '0');
                              if (isNaN(val)) return;
                              saveDesignerRate(d.id, val);
                            }}
                          />
                          <span className="text-gray-500">/min</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* <TabsContent value="limits" className="space-y-6"> ... </TabsContent> */}
        {/* <TabsContent value="other" className="space-y-6"> ... </TabsContent> */}
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
