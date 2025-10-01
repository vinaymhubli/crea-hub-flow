import { supabase } from "../integrations/supabase/client";

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

    // Check weekly schedule - fetch all entries for this day
    console.log('🗓️ Querying weekly schedule for designer_id:', designerId, 'day_of_week:', currentDay);
    
    // First try with the designer ID as is
    let { data: weeklySchedules, error: weeklyError } = await supabase
      .from("designer_weekly_schedule")
      .select("is_available, start_time, end_time")
      .eq("designer_id", designerId)
      .eq("day_of_week", currentDay);
    
    console.log('📊 Weekly schedule query result (with designer.id):', { weeklySchedules, weeklyError });
    
    // If no results and we have designerData.user_id, try with user_id
    if ((!weeklySchedules || weeklySchedules.length === 0) && designerData?.user_id) {
      console.log('🔄 Trying with user_id:', designerData.user_id);
      const { data: weeklySchedulesUserID, error: weeklyErrorUserID } = await supabase
        .from("designer_weekly_schedule")
        .select("is_available, start_time, end_time")
        .eq("designer_id", designerData.user_id)
        .eq("day_of_week", currentDay);
      
      console.log('📊 Weekly schedule query result (with user_id):', { weeklySchedulesUserID, weeklyErrorUserID });
      
      if (!weeklyErrorUserID && weeklySchedulesUserID && weeklySchedulesUserID.length > 0) {
        weeklySchedules = weeklySchedulesUserID;
        weeklyError = weeklyErrorUserID;
      }
    }

    if (weeklyError) {
      console.error("Error fetching weekly schedule:", weeklyError);
      return {
        isAvailable: false,
        reason: "Error fetching availability schedule",
        isInSchedule: false,
        isOnline,
      };
    }

    if (!weeklySchedules || weeklySchedules.length === 0) {
      // Let's also check what data exists in the table for debugging
      console.log('🔍 No schedule found, checking what data exists in designer_weekly_schedule table...');
      const { data: allSchedules, error: allError } = await supabase
        .from("designer_weekly_schedule")
        .select("designer_id, day_of_week, is_available, start_time, end_time")
        .limit(10);
      
      console.log('📋 Sample data from designer_weekly_schedule table:', { allSchedules, allError });
      
      // Let's also check what designer_ids exist in the table
      const { data: designerIds, error: idsError } = await supabase
        .from("designer_weekly_schedule")
        .select("designer_id")
        .limit(20);
      
      console.log('🆔 Designer IDs in weekly schedule table:', designerIds?.map(d => d.designer_id));
      console.log('🔍 Looking for designer_id:', designerId);
      console.log('🔍 Looking for user_id:', designerData?.user_id);
      
      // No schedule found - designer is not available
      return {
        isAvailable: false,
        reason: "No availability schedule found for this day",
        isInSchedule: false,
        isOnline,
      };
    }

    // Check if any of the time slots are available and current time falls within them
    let isInSchedule = false;
    let hasAvailableSlot = false;

    for (const schedule of weeklySchedules) {
      if (schedule.is_available) {
        hasAvailableSlot = true;
        // Check if current time is within this time slot
        if (schedule.start_time && schedule.end_time) {
          if (currentTime >= schedule.start_time && currentTime <= schedule.end_time) {
            isInSchedule = true;
            break;
          }
        }
      }
    }

    if (!hasAvailableSlot) {
      return {
        isAvailable: false,
        reason: "Designer is not available on this day",
        isInSchedule: false,
        isOnline,
      };
    }

    return {
      isAvailable: isInSchedule,
      reason: isInSchedule
        ? undefined
        : "Current time is outside scheduled hours",
      isInSchedule,
      isOnline,
    };
  } catch (error) {
    console.error("Error checking designer availability:", error);
    return {
      isAvailable: false,
      reason: "Error checking availability",
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
      if (!specialDay.is_available) {
        return {
          isAvailable: false,
          reason: "Designer is not available on this date (special day)",
          isInSchedule: false,
        };
      }

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
        };
      }
    }

    // Check weekly schedule - fetch all entries for this day
    console.log('🗓️ Querying weekly schedule for scheduled time - designer_id:', designerId, 'day_of_week:', scheduledDay);
    
    let { data: weeklySchedules, error: weeklyError } = await supabase
      .from("designer_weekly_schedule")
      .select("is_available, start_time, end_time")
      .eq("designer_id", designerId)
      .eq("day_of_week", scheduledDay);

    console.log('📊 Weekly schedule query result (with designer.id):', { weeklySchedules, weeklyError });
    
    // If no results and we have user_id from the special days query, try with user_id
    if ((!weeklySchedules || weeklySchedules.length === 0) && designerDataForSpecial?.user_id) {
      console.log('🔄 Trying with user_id:', designerDataForSpecial.user_id);
      const { data: weeklySchedulesUserID, error: weeklyErrorUserID } = await supabase
        .from("designer_weekly_schedule")
        .select("is_available, start_time, end_time")
        .eq("designer_id", designerDataForSpecial.user_id)
        .eq("day_of_week", scheduledDay);
      
      console.log('📊 Weekly schedule query result (with user_id):', { weeklySchedulesUserID, weeklyErrorUserID });
      
      if (!weeklyErrorUserID && weeklySchedulesUserID && weeklySchedulesUserID.length > 0) {
        weeklySchedules = weeklySchedulesUserID;
        weeklyError = weeklyErrorUserID;
      }
    }

    if (weeklyError) {
      console.error("Error fetching weekly schedule:", weeklyError);
      return {
        isAvailable: false,
        reason: "Error fetching availability schedule",
        isInSchedule: false,
      };
    }

    if (!weeklySchedules || weeklySchedules.length === 0) {
      console.log('❌ No schedule found for scheduled time');
      return {
        isAvailable: false,
        reason: "No availability schedule found for this day",
        isInSchedule: false,
      };
    }

    // Check if any of the time slots are available and scheduled time falls within them
    let isInSchedule = false;
    let hasAvailableSlot = false;

    for (const schedule of weeklySchedules) {
      if (schedule.is_available) {
        hasAvailableSlot = true;
        // Check if scheduled time is within this time slot
        if (schedule.start_time && schedule.end_time) {
          if (scheduledTime >= schedule.start_time && scheduledTime <= schedule.end_time) {
            isInSchedule = true;
            break;
          }
        }
      }
    }

    if (!hasAvailableSlot) {
      return {
        isAvailable: false,
        reason: "Designer is not available on this day",
        isInSchedule: false,
      };
    }

    return {
      isAvailable: isInSchedule,
      reason: isInSchedule
        ? undefined
        : "Scheduled time is outside scheduled hours",
      isInSchedule,
    };
  } catch (error) {
    console.error("Error checking designer availability for date/time:", error);
    return {
      isAvailable: false,
      reason: "Error checking availability",
    };
  }
}
