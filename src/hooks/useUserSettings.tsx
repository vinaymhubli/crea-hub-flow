import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserSettings {
  language: string;
  timezone: string;
  currency: string;
  date_format: string;
  time_format: string;
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_sms: boolean;
  notifications_marketing: boolean;
  booking_reminders: boolean;
  message_notifications: boolean;
  privacy_profile_visible: boolean;
  privacy_contact_info_visible: boolean;
  privacy_activity_status: boolean;
  security_two_factor: boolean;
  security_login_alerts: boolean;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    notifications_email: true,
    notifications_push: true,
    notifications_sms: false,
    notifications_marketing: false,
    booking_reminders: true,
    message_notifications: true,
    privacy_profile_visible: true,
    privacy_contact_info_visible: false,
    privacy_activity_status: true,
    security_two_factor: false,
    security_login_alerts: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data) {
        setSettings({
          language: data.language,
          timezone: data.timezone,
          currency: data.currency,
          date_format: data.date_format,
          time_format: data.time_format,
          notifications_email: data.notifications_email,
          notifications_push: data.notifications_push,
          notifications_sms: data.notifications_sms,
          notifications_marketing: data.notifications_marketing,
          booking_reminders: data.booking_reminders,
          message_notifications: data.message_notifications,
          privacy_profile_visible: data.privacy_profile_visible,
          privacy_contact_info_visible: data.privacy_contact_info_visible,
          privacy_activity_status: data.privacy_activity_status,
          security_two_factor: data.security_two_factor,
          security_login_alerts: data.security_login_alerts
        });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating settings:', error);
        toast.error('Failed to save settings');
        return;
      }

      setSettings(updatedSettings);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    updateSettings({ [key]: value });
  };

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  return {
    settings,
    loading,
    saving,
    updateSetting,
    updateSettings,
    refetch: fetchSettings
  };
};