import { supabase } from '../integrations/supabase/client';

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  reason?: string;
  isInSchedule?: boolean;
  isOnline?: boolean;
}

/**
 * Check if a designer is available for booking based on their schedule and online status
 * This function considers both the designer's availability schedule and their online status
 */
export async function checkDesignerBookingAvailability(designerId: string): Promise<AvailabilityCheckResult> {
  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // First, check if designer is online
    const { data: designerData, error: designerError } = await supabase
      .from('designers')
      .select('is_online, user_id')
      .eq('id', designerId)
      .single();

    if (designerError) {
      console.error('Error fetching designer data:', designerError);
      return { isAvailable: false, reason: 'Unable to verify designer status' };
    }

    const isOnline = designerData.is_online;

    // Check special days first (overrides weekly schedule)
    const { data: specialDay, error: specialError } = await supabase
      .from('designer_special_days')
      .select('is_available, start_time, end_time')
      .eq('designer_id', designerId)
      .eq('date', today)
      .single();

    if (!specialError && specialDay) {
      // Special day exists - use it instead of weekly schedule
      if (!specialDay.is_available) {
        return { 
          isAvailable: false, 
          reason: 'Designer is not available today (special day)',
          isInSchedule: false,
          isOnline
        };
      }

      // Check if current time is within special day hours
      if (specialDay.start_time && specialDay.end_time) {
        const isInSpecialSchedule = currentTime >= specialDay.start_time && 
                                  currentTime <= specialDay.end_time;
        
        return {
          isAvailable: isInSpecialSchedule,
          reason: isInSpecialSchedule ? undefined : 'Current time is outside special day hours',
          isInSchedule: isInSpecialSchedule,
          isOnline
        };
      }
    }

    // Check weekly schedule
    const { data: weeklySchedule, error: weeklyError } = await supabase
      .from('designer_weekly_schedule')
      .select('is_available, start_time, end_time')
      .eq('designer_id', designerId)
      .eq('day_of_week', currentDay)
      .single();

    if (weeklyError || !weeklySchedule) {
      // No schedule found - designer is not available
      return { 
        isAvailable: false, 
        reason: 'No availability schedule found for this day',
        isInSchedule: false,
        isOnline
      };
    }

    if (!weeklySchedule.is_available) {
      return { 
        isAvailable: false, 
        reason: 'Designer is not available on this day',
        isInSchedule: false,
        isOnline
      };
    }

    // Check if current time is within scheduled hours
    const isInSchedule = currentTime >= weeklySchedule.start_time && 
                        currentTime <= weeklySchedule.end_time;

    return {
      isAvailable: isInSchedule,
      reason: isInSchedule ? undefined : 'Current time is outside scheduled hours',
      isInSchedule,
      isOnline
    };

  } catch (error) {
    console.error('Error checking designer availability:', error);
    return { 
      isAvailable: false, 
      reason: 'Error checking availability',
      isOnline: false
    };
  }
}

/**
 * Check if a designer is available for a specific date/time (for scheduled bookings)
 */
export async function checkDesignerAvailabilityForDateTime(
  designerId: string, 
  scheduledDateTime: string
): Promise<AvailabilityCheckResult> {
  try {
    const scheduledDate = new Date(scheduledDateTime);
    const scheduledDay = scheduledDate.getDay();
    const scheduledTime = scheduledDate.toTimeString().slice(0, 5);
    const scheduledDateStr = scheduledDate.toISOString().split('T')[0];

    // Check special days first
    const { data: specialDay, error: specialError } = await supabase
      .from('designer_special_days')
      .select('is_available, start_time, end_time')
      .eq('designer_id', designerId)
      .eq('date', scheduledDateStr)
      .single();

    if (!specialError && specialDay) {
      if (!specialDay.is_available) {
        return { 
          isAvailable: false, 
          reason: 'Designer is not available on this date (special day)',
          isInSchedule: false
        };
      }

      if (specialDay.start_time && specialDay.end_time) {
        const isInSpecialSchedule = scheduledTime >= specialDay.start_time && 
                                  scheduledTime <= specialDay.end_time;
        
        return {
          isAvailable: isInSpecialSchedule,
          reason: isInSpecialSchedule ? undefined : 'Scheduled time is outside special day hours',
          isInSchedule: isInSpecialSchedule
        };
      }
    }

    // Check weekly schedule
    const { data: weeklySchedule, error: weeklyError } = await supabase
      .from('designer_weekly_schedule')
      .select('is_available, start_time, end_time')
      .eq('designer_id', designerId)
      .eq('day_of_week', scheduledDay)
      .single();

    if (weeklyError || !weeklySchedule) {
      return { 
        isAvailable: false, 
        reason: 'No availability schedule found for this day',
        isInSchedule: false
      };
    }

    if (!weeklySchedule.is_available) {
      return { 
        isAvailable: false, 
        reason: 'Designer is not available on this day',
        isInSchedule: false
      };
    }

    const isInSchedule = scheduledTime >= weeklySchedule.start_time && 
                        scheduledTime <= weeklySchedule.end_time;

    return {
      isAvailable: isInSchedule,
      reason: isInSchedule ? undefined : 'Scheduled time is outside scheduled hours',
      isInSchedule
    };

  } catch (error) {
    console.error('Error checking designer availability for date/time:', error);
    return { 
      isAvailable: false, 
      reason: 'Error checking availability'
    };
  }
}
