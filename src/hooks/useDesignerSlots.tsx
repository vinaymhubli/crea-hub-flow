import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DesignerSlot {
  id: string;
  designer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useDesignerSlots() {
  const [slots, setSlots] = useState<DesignerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current designer ID
  const getDesignerId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: designer } = await supabase
      .from('designers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    return designer?.id || null;
  }, []);

  // Fetch all slots for the current designer
  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const designerId = await getDesignerId();
      if (!designerId) {
        throw new Error('Designer not found');
      }

      const { data, error } = await (supabase as any)
        .from('designer_slots')
        .select('*')
        .eq('designer_id', designerId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      setSlots(data || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch slots');
      toast({
        title: "Error",
        description: "Failed to load your time slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getDesignerId, toast]);

  // Get slots for a specific day
  const getSlotsForDay = useCallback((dayOfWeek: number) => {
    return slots.filter(slot => slot.day_of_week === dayOfWeek && slot.is_active);
  }, [slots]);

  // Save slots for a specific day
  const saveSlotsForDay = useCallback(async (dayOfWeek: number, newSlots: Omit<DesignerSlot, 'id' | 'designer_id' | 'day_of_week' | 'created_at' | 'updated_at'>[]) => {
    try {
      setLoading(true);
      setError(null);

      const designerId = await getDesignerId();
      if (!designerId) {
        throw new Error('Designer not found');
      }

      // First, deactivate all existing slots for this day
      await (supabase as any)
        .from('designer_slots')
        .update({ is_active: false })
        .eq('designer_id', designerId)
        .eq('day_of_week', dayOfWeek);

      // Then insert new slots (filter out any slots with temporary IDs)
      if (newSlots.length > 0) {
        const slotsToInsert = newSlots
          .map(slot => ({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: slot.is_active,
            designer_id: designerId,
            day_of_week: dayOfWeek,
          }));

        if (slotsToInsert.length > 0) {
          const { error } = await (supabase as any)
            .from('designer_slots')
            .insert(slotsToInsert);

          if (error) throw error;
        }
      }

      // Refresh slots
      await fetchSlots();

      toast({
        title: "Success",
        description: `Time slots for ${getDayName(dayOfWeek)} have been saved`,
      });
    } catch (err) {
      console.error('Error saving slots:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save slots';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getDesignerId, fetchSlots, toast]);

  // Delete a specific slot
  const deleteSlot = useCallback(async (slotId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await (supabase as any)
        .from('designer_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      // Refresh slots
      await fetchSlots();

      toast({
        title: "Success",
        description: "Time slot has been deleted",
      });
    } catch (err) {
      console.error('Error deleting slot:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete slot';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSlots, toast]);

  // Check if designer is available at a specific time
  const isAvailableAtTime = useCallback((dayOfWeek: number, time: string) => {
    const daySlots = getSlotsForDay(dayOfWeek);
    return daySlots.some(slot => 
      slot.is_active && 
      time >= slot.start_time && 
      time < slot.end_time
    );
  }, [getSlotsForDay]);

  // Get all available time ranges for a day
  const getAvailableTimeRanges = useCallback((dayOfWeek: number) => {
    const daySlots = getSlotsForDay(dayOfWeek);
    return daySlots.map(slot => ({
      start: slot.start_time,
      end: slot.end_time,
      duration: getDuration(slot.start_time, slot.end_time)
    }));
  }, [getSlotsForDay]);

  // Helper function to get day name
  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  // Helper function to calculate duration
  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours;
  };

  // Calculate total hours per week
  const getTotalWeeklyHours = useCallback(() => {
    return slots
      .filter(slot => slot.is_active)
      .reduce((total, slot) => total + getDuration(slot.start_time, slot.end_time), 0);
  }, [slots]);

  // Get slots count per day
  const getSlotsCountPerDay = useCallback(() => {
    const counts: { [key: number]: number } = {};
    for (let i = 0; i < 7; i++) {
      counts[i] = getSlotsForDay(i).length;
    }
    return counts;
  }, [getSlotsForDay]);

  // Copy slots from one day to all other days
  const copySlotsToAllDays = useCallback(async (sourceDay: number) => {
    try {
      setLoading(true);
      setError(null);

      const designerId = await getDesignerId();
      if (!designerId) {
        throw new Error('Designer not found');
      }

      // Get slots from source day
      const sourceSlots = slots.filter(slot => slot.day_of_week === sourceDay && slot.is_active);
      
      if (sourceSlots.length === 0) {
        throw new Error('No slots found for the selected day');
      }

      // Copy to all other days (0-6, excluding source day)
      for (let day = 0; day <= 6; day++) {
        if (day !== sourceDay) {
          // First, deactivate existing slots for this day
          await (supabase as any)
            .from('designer_slots')
            .update({ is_active: false })
            .eq('designer_id', designerId)
            .eq('day_of_week', day);

          // Insert copied slots
          const slotsToInsert = sourceSlots.map(slot => ({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: true,
            designer_id: designerId,
            day_of_week: day,
          }));

          if (slotsToInsert.length > 0) {
            const { error } = await (supabase as any)
              .from('designer_slots')
              .insert(slotsToInsert);

            if (error) throw error;
          }
        }
      }

      // Refresh slots
      await fetchSlots();

      toast({
        title: "Success",
        description: `Slots copied from ${getDayName(sourceDay)} to all other days`,
      });
    } catch (error) {
      console.error('Error copying slots:', error);
      setError(error instanceof Error ? error.message : 'Failed to copy slots');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to copy slots',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [slots, getDesignerId, fetchSlots, getDayName, toast]);

  // Load slots on mount
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return {
    slots,
    loading,
    error,
    fetchSlots,
    getSlotsForDay,
    saveSlotsForDay,
    deleteSlot,
    isAvailableAtTime,
    getAvailableTimeRanges,
    getTotalWeeklyHours,
    getSlotsCountPerDay,
    getDayName,
    getDuration,
    copySlotsToAllDays
  };
}
