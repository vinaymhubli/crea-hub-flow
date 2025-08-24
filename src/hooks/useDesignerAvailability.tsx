import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDesignerProfile } from './useDesignerProfile';
import { useToast } from '@/hooks/use-toast';

interface AvailabilitySettings {
  id?: string;
  designer_id: string;
  buffer_time_minutes: number;
  auto_accept_bookings: boolean;
  working_hours_start: string;
  working_hours_end: string;
}

interface WeeklySchedule {
  id?: string;
  designer_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  is_available: boolean;
  start_time: string;
  end_time: string;
}

interface SpecialDay {
  id?: string;
  designer_id: string;
  date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export const useDesignerAvailability = () => {
  const { designerProfile } = useDesignerProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([]);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);

  // Fetch availability data
  const fetchAvailabilityData = async () => {
    if (!designerProfile?.id) return;

    try {
      setLoading(true);
      
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('designer_availability_settings')
        .select('*')
        .eq('designer_id', designerProfile.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      setSettings(settingsData);

      // Fetch weekly schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('designer_weekly_schedule')
        .select('*')
        .eq('designer_id', designerProfile.id)
        .order('day_of_week');

      if (scheduleError) throw scheduleError;
      setWeeklySchedule(scheduleData || []);

      // Fetch special days
      const { data: specialDaysData, error: specialDaysError } = await supabase
        .from('designer_special_days')
        .select('*')
        .eq('designer_id', designerProfile.id)
        .order('date');

      if (specialDaysError) throw specialDaysError;
      setSpecialDays(specialDaysData || []);

    } catch (error) {
      console.error('Error fetching availability data:', error);
      toast({
        title: "Error",
        description: "Failed to load availability data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update settings
  const updateSettings = async (updates: Partial<AvailabilitySettings>) => {
    if (!designerProfile?.id) return;

    try {
      const settingsData = {
        designer_id: designerProfile.id,
        ...updates
      };

      const { data, error } = await supabase
        .from('designer_availability_settings')
        .upsert(settingsData, { onConflict: 'designer_id' })
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast({
        title: "Settings updated",
        description: "Availability settings saved successfully",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  // Update weekly schedule
  const updateWeeklySchedule = async (dayOfWeek: number, scheduleData: Partial<WeeklySchedule>) => {
    if (!designerProfile?.id) return;

    try {
      const data = {
        designer_id: designerProfile.id,
        day_of_week: dayOfWeek,
        ...scheduleData
      };

      const { error } = await supabase
        .from('designer_weekly_schedule')
        .upsert(data, { onConflict: 'designer_id,day_of_week' });

      if (error) throw error;

      await fetchAvailabilityData();
      toast({
        title: "Schedule updated",
        description: "Weekly schedule updated successfully",
      });
    } catch (error) {
      console.error('Error updating weekly schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    }
  };

  // Add special day
  const addSpecialDay = async (specialDay: Omit<SpecialDay, 'id' | 'designer_id'>) => {
    if (!designerProfile?.id) return;

    try {
      const data = {
        designer_id: designerProfile.id,
        ...specialDay
      };

      const { error } = await supabase
        .from('designer_special_days')
        .upsert(data, { onConflict: 'designer_id,date' });

      if (error) throw error;

      await fetchAvailabilityData();
      toast({
        title: "Special day added",
        description: "Special day schedule updated successfully",
      });
    } catch (error) {
      console.error('Error adding special day:', error);
      toast({
        title: "Error",
        description: "Failed to add special day",
        variant: "destructive",
      });
    }
  };

  // Delete special day
  const deleteSpecialDay = async (id: string) => {
    try {
      const { error } = await supabase
        .from('designer_special_days')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAvailabilityData();
      toast({
        title: "Special day removed",
        description: "Special day deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting special day:', error);
      toast({
        title: "Error",
        description: "Failed to delete special day",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAvailabilityData();
  }, [designerProfile?.id]);

  return {
    loading,
    settings,
    weeklySchedule,
    specialDays,
    updateSettings,
    updateWeeklySchedule,
    addSpecialDay,
    deleteSpecialDay,
    refetch: fetchAvailabilityData,
  };
};