import { supabase } from '@/integrations/supabase/client';

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  reason?: string;
  isInSchedule?: boolean;
  isOnline?: boolean;
}

/**
 * Check if a designer is available for booking based on their slots and online status
 * This function considers both the designer's time slots and their online status
 */
export async function checkDesignerBookingAvailability(
  designerId: string
): Promise<AvailabilityCheckResult> {
  try {
    console.log('🔍 Checking availability for designer ID:', designerId);
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    
    console.log('📅 Current day:', currentDay, 'Current time:', currentTime, 'Today:', today);

    // First, check if designer is online
    const { data: designerData, error: designerError } = await supabase
      .from("designers")
      .select("is_online, user_id")
      .eq("id", designerId)
      .single();

    if (designerError) {
      console.error("Error fetching designer data:", designerError);
      return { isAvailable: false, reason: "Unable to verify designer status" };
    }

    const isOnline = designerData.is_online;

    // Check special days first (overrides weekly schedule)
    let { data: specialDays, error: specialError } = await supabase
      .from("designer_special_days")
      .select("is_available, start_time, end_time")
      .eq("designer_id", designerId)
      .eq("date", today);

    // Try with user_id if no results with designer_id
    if ((!specialDays || specialDays.length === 0) && designerData?.user_id) {
      const { data: specialDaysUserID, error: specialErrorUserID } = await supabase
        .from("designer_special_days")
        .select("is_available, start_time, end_time")
        .eq("designer_id", designerData.user_id)
        .eq("date", today);
      
      if (!specialErrorUserID && specialDaysUserID && specialDaysUserID.length > 0) {
        specialDays = specialDaysUserID;
        specialError = specialErrorUserID;
      }
    }

    const specialDay = specialDays && specialDays.length > 0 ? specialDays[0] : null;

    if (!specialError && specialDay) {
      // Special day exists - use it instead of weekly schedule
      if (!specialDay.is_available) {
        return {
          isAvailable: false,
          reason: "Designer is not available today (special day)",
          isInSchedule: false,
          isOnline,
        };
      }

      // Check if current time is within special day hours
      if (specialDay.start_time && specialDay.end_time) {
        const isInSpecialSchedule =
          currentTime >= specialDay.start_time &&
          currentTime <= specialDay.end_time;

        return {
          isAvailable: isInSpecialSchedule,
          reason: isInSpecialSchedule
            ? undefined
            : "Current time is outside special day hours",
          isInSchedule: isInSpecialSchedule,
          isOnline,
        };
      }
    }

    // Check designer slots - fetch all active slots for this day
    console.log('🗓️ Querying designer slots for designer_id:', designerId, 'day_of_week:', currentDay);
    
    let { data: designerSlots, error: slotsError } = await supabase
      .from("designer_slots")
      .select("start_time, end_time, is_active")
      .eq("designer_id", designerId)
      .eq("day_of_week", currentDay)
      .eq("is_active", true);
    
    console.log('📊 Designer slots query result:', { designerSlots, slotsError });
    
    // If no results and we have designerData.user_id, try with user_id
    if ((!designerSlots || designerSlots.length === 0) && designerData?.user_id) {
      console.log('🔄 Trying with user_id:', designerData.user_id);
      const { data: designerSlotsUserID, error: slotsErrorUserID } = await supabase
        .from("designer_slots")
        .select("start_time, end_time, is_active")
        .eq("designer_id", designerData.user_id)
        .eq("day_of_week", currentDay)
        .eq("is_active", true);
      
      if (!slotsErrorUserID && designerSlotsUserID && designerSlotsUserID.length > 0) {
        designerSlots = designerSlotsUserID;
        slotsError = slotsErrorUserID;
        console.log('📊 Designer slots query result (with user_id):', { designerSlots, slotsError });
      }
    }

    if (slotsError) {
      console.error("Error fetching designer slots:", slotsError);
      return {
        isAvailable: false,
        reason: "Error fetching availability schedule",
        isInSchedule: false,
        isOnline,
      };
    }

    if (!designerSlots || designerSlots.length === 0) {
      console.log('🔍 No slots found for designer');
      return {
        isAvailable: false,
        reason: "Designer has no time slots configured for today",
        isInSchedule: false,
        isOnline,
      };
    }

    // Check if designer has any available time slots for this day
    const availableSlots = designerSlots.filter(slot => slot.is_active);
    
    if (availableSlots.length === 0) {
      return {
        isAvailable: false,
        reason: "Designer has no active time slots for today",
        isInSchedule: false,
        isOnline,
      };
    }

    // Check if current time falls within any available slot
    const isInSchedule = availableSlots.some(slot => 
      currentTime >= slot.start_time && currentTime < slot.end_time
    );

    console.log('⏰ Current time check:', {
      currentTime,
      availableSlots: availableSlots.map(s => ({ start: s.start_time, end: s.end_time })),
      isInSchedule
    });

    return {
      isAvailable: isInSchedule,
      reason: isInSchedule ? undefined : "Designer is not available at this time, please choose different time slot",
      isInSchedule,
      isOnline,
    };

  } catch (error) {
    console.error("Error checking designer availability:", error);
    return {
      isAvailable: false,
      reason: "Error checking availability",
      isInSchedule: false,
      isOnline: false,
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
    const scheduledDateStr = scheduledDate.toISOString().split("T")[0];

    // Get designer data to access user_id if needed for special days
    const { data: designerDataForSpecial, error: designerErrorForSpecial } = await supabase
      .from("designers")
      .select("user_id")
      .eq("id", designerId)
      .single();

    // Check special days first
    let { data: specialDays, error: specialError } = await supabase
      .from("designer_special_days")
      .select("is_available, start_time, end_time")
      .eq("designer_id", designerId)
      .eq("date", scheduledDateStr);

    // Try with user_id if no results with designer_id
    if ((!specialDays || specialDays.length === 0) && designerDataForSpecial?.user_id) {
      const { data: specialDaysUserID, error: specialErrorUserID } = await supabase
        .from("designer_special_days")
        .select("is_available, start_time, end_time")
        .eq("designer_id", designerDataForSpecial.user_id)
        .eq("date", scheduledDateStr);
      
      if (!specialErrorUserID && specialDaysUserID && specialDaysUserID.length > 0) {
        specialDays = specialDaysUserID;
        specialError = specialErrorUserID;
      }
    }

    const specialDay = specialDays && specialDays.length > 0 ? specialDays[0] : null;

    if (!specialError && specialDay) {
      // Special day exists - use it instead of weekly schedule
      if (!specialDay.is_available) {
        return {
          isAvailable: false,
          reason: "Designer is not available on this date (special day)",
          isInSchedule: false,
          isOnline: false,
        };
      }

      // Check if scheduled time is within special day hours
      if (specialDay.start_time && specialDay.end_time) {
        const isInSpecialSchedule =
          scheduledTime >= specialDay.start_time &&
          scheduledTime <= specialDay.end_time;

        return {
          isAvailable: isInSpecialSchedule,
          reason: isInSpecialSchedule
            ? undefined
            : "Scheduled time is outside special day hours",
          isInSchedule: isInSpecialSchedule,
          isOnline: false,
        };
      }
    }

    // Check designer slots for the scheduled day
    let { data: designerSlots, error: slotsError } = await supabase
      .from("designer_slots")
      .select("start_time, end_time, is_active")
      .eq("designer_id", designerId)
      .eq("day_of_week", scheduledDay)
      .eq("is_active", true);

    // Try with user_id if no results with designer_id
    if ((!designerSlots || designerSlots.length === 0) && designerDataForSpecial?.user_id) {
      const { data: designerSlotsUserID, error: slotsErrorUserID } = await supabase
        .from("designer_slots")
        .select("start_time, end_time, is_active")
        .eq("designer_id", designerDataForSpecial.user_id)
        .eq("day_of_week", scheduledDay)
        .eq("is_active", true);
      
      if (!slotsErrorUserID && designerSlotsUserID && designerSlotsUserID.length > 0) {
        designerSlots = designerSlotsUserID;
        slotsError = slotsErrorUserID;
      }
    }

    if (slotsError) {
      console.error("Error fetching designer slots:", slotsError);
      return {
        isAvailable: false,
        reason: "Error fetching availability schedule",
        isInSchedule: false,
        isOnline: false,
      };
    }

    if (!designerSlots || designerSlots.length === 0) {
      return {
        isAvailable: false,
        reason: "Designer is not available for this day",
        isInSchedule: false,
        isOnline: false,
      };
    }

    // Check if scheduled time falls within any available slot
    const availableSlots = designerSlots.filter(slot => slot.is_active);
    const isInSchedule = availableSlots.some(slot => 
      scheduledTime >= slot.start_time && scheduledTime < slot.end_time
    );

    return {
      isAvailable: isInSchedule,
      reason: isInSchedule ? undefined : "Designer is not available at this time, please choose different time slot",
      isInSchedule,
      isOnline: false,
    };

  } catch (error) {
    console.error("Error checking designer availability for date/time:", error);
    return {
      isAvailable: false,
      reason: "Error checking availability",
      isInSchedule: false,
      isOnline: false,
    };
  }
}
