
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformSettings {
  id: string;
  maintenance_mode: boolean;
  new_registrations: boolean;
  commission_rate: number;
  featured_designers_limit: number;
  updated_at: string;
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
        .single();

      if (error) throw error;
      
      setSettings(data);
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
      const { data, error } = await supabase
        .from('platform_settings')
        .update(updates)
        .eq('singleton', true)
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data);
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
