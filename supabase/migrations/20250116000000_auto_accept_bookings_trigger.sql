-- Auto-accept bookings trigger
-- This trigger automatically accepts booking requests when:
-- 1. Designer has auto_accept_bookings enabled
-- 2. Booking time matches a designer slot
-- 3. Designer is free during that time (no overlapping bookings)
-- 4. Buffer time is respected

-- Function to check if a booking should be auto-accepted
CREATE OR REPLACE FUNCTION public.check_and_auto_accept_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_designer_id UUID;
  v_auto_accept BOOLEAN;
  v_buffer_minutes INTEGER;
  v_scheduled_date TIMESTAMP WITH TIME ZONE;
  v_duration_hours INTEGER;
  v_scheduled_day INTEGER;
  v_scheduled_time TIME;
  v_scheduled_date_str DATE;
  v_has_slot BOOLEAN;
  v_day_available BOOLEAN;
  v_has_overlap BOOLEAN;
  v_slot_start TIME;
  v_slot_end TIME;
  v_booking_start TIMESTAMP WITH TIME ZONE;
  v_booking_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only process pending bookings
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get designer ID
  v_designer_id := NEW.designer_id;
  v_scheduled_date := NEW.scheduled_date;
  v_duration_hours := NEW.duration_hours;
  
  -- Extract day of week (0=Sunday, 6=Saturday)
  v_scheduled_day := EXTRACT(DOW FROM v_scheduled_date);
  v_scheduled_time := v_scheduled_date::TIME;
  v_scheduled_date_str := v_scheduled_date::DATE;

  -- Get designer availability settings
  SELECT auto_accept_bookings, buffer_time_minutes
  INTO v_auto_accept, v_buffer_minutes
  FROM public.designer_availability_settings
  WHERE designer_id = v_designer_id;

  -- If auto-accept is not enabled, return
  IF NOT v_auto_accept THEN
    RETURN NEW;
  END IF;

  -- Default buffer time if not set
  IF v_buffer_minutes IS NULL THEN
    v_buffer_minutes := 15;
  END IF;

  -- Check if day is available in weekly schedule
  SELECT is_available INTO v_day_available
  FROM public.designer_weekly_schedule
  WHERE designer_id = v_designer_id
    AND day_of_week = v_scheduled_day;

  -- If day is explicitly unavailable, don't auto-accept
  IF v_day_available = false THEN
    RETURN NEW;
  END IF;

  -- Check for special day override
  DECLARE
    v_special_day_available BOOLEAN;
  BEGIN
    SELECT is_available INTO v_special_day_available
    FROM public.designer_special_days
    WHERE designer_id = v_designer_id
      AND date = v_scheduled_date_str;

    -- If special day exists and is unavailable, don't auto-accept
    IF v_special_day_available IS NOT NULL AND v_special_day_available = false THEN
      RETURN NEW;
    END IF;
  END;

  -- Check if scheduled time matches any active slot for that day
  SELECT EXISTS (
    SELECT 1
    FROM public.designer_slots
    WHERE designer_id = v_designer_id
      AND day_of_week = v_scheduled_day
      AND is_active = true
      AND v_scheduled_time >= start_time
      AND v_scheduled_time < end_time
  ) INTO v_has_slot;

  -- If no matching slot, don't auto-accept
  IF NOT v_has_slot THEN
    RETURN NEW;
  END IF;

  -- Calculate booking start and end times (with buffer)
  v_booking_start := v_scheduled_date - (v_buffer_minutes::text || ' minutes')::INTERVAL;
  v_booking_end := v_scheduled_date + (v_duration_hours::text || ' hours')::INTERVAL + (v_buffer_minutes::text || ' minutes')::INTERVAL;

  -- Check for overlapping bookings (confirmed or in_progress)
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE designer_id = v_designer_id
      AND id != NEW.id
      AND status IN ('confirmed', 'in_progress')
      AND scheduled_date < v_booking_end
      AND (scheduled_date + (duration_hours::text || ' hours')::INTERVAL) > v_booking_start
  ) INTO v_has_overlap;

  -- If there's an overlap, don't auto-accept
  IF v_has_overlap THEN
    RETURN NEW;
  END IF;

  -- All conditions met - auto-accept the booking
  NEW.status := 'confirmed';
  
  -- Create notification for customer
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id
  ) VALUES (
    NEW.customer_id,
    'Booking Confirmed',
    'Your booking has been automatically confirmed!',
    'booking_confirmed',
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Create trigger that runs before insert
CREATE TRIGGER auto_accept_booking_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_auto_accept_booking();

-- Also handle updates (in case booking is created as pending and then updated)
CREATE TRIGGER auto_accept_booking_update_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'pending')
  EXECUTE FUNCTION public.check_and_auto_accept_booking();

