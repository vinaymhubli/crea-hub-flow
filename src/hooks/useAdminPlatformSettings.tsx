
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: {
    value: number;
    type: 'percentage' | 'currency';
  };
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

interface PlatformSettings {
  gst_rate: number;
  platform_fee_rate: number;
  minimum_withdrawal_amount: number;
  maximum_withdrawal_amount: number;
  penalty_fee_amount: number;
  auto_approve_threshold: number;
}

export const useAdminPlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      // Transform the data into a more usable format
      const transformedSettings: PlatformSettings = {
        gst_rate: 18,
        platform_fee_rate: 10,
        minimum_withdrawal_amount: 100,
        maximum_withdrawal_amount: 50000,
        penalty_fee_amount: 50,
        auto_approve_threshold: 1000,
      };

      // Map the settings from the database
      if (data) {
        data.forEach((setting: PlatformSetting) => {
          const key = setting.setting_key as keyof PlatformSettings;
          if (key in transformedSettings) {
            transformedSettings[key] = setting.setting_value.value;
          }
        });
      }
      
      setSettings(transformedSettings);
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      toast({
        title: "Error",
        description: "Failed to load platform settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<PlatformSettings>) => {
    try {
      // Update each setting individually
      const updatePromises = Object.entries(updates).map(async ([key, value]) => {
        const { error } = await supabase
          .from('platform_settings')
          .update({
            setting_value: { value, type: key.includes('rate') ? 'percentage' : 'currency' },
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', key);

        if (error) throw error;
      });

      await Promise.all(updatePromises);
      
      // Refresh settings after update
      await fetchSettings();
      
      toast({
        title: "Success",
        description: "Platform settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating platform settings:', error);
      toast({
        title: "Error",
        description: "Failed to update platform settings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
};
