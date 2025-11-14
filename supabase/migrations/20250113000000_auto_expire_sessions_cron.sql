-- Auto-expire sessions that have passed their scheduled date
-- This function runs daily at 6 AM IST to cancel all bookings with scheduled_date before today

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to auto-expire past bookings
CREATE OR REPLACE FUNCTION auto_expire_past_bookings()
RETURNS TABLE(expired_count INTEGER, notifications_sent INTEGER) AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_expired_count INTEGER := 0;
  v_notifications_sent INTEGER := 0;
  v_booking_record RECORD;
  v_user_id UUID;
  v_booking_count INTEGER;
  v_rows_affected INTEGER;
BEGIN
  -- Get today's date at 00:00:00 IST
  -- IST is UTC+5:30
  -- Convert current time to IST, get date, then convert back to UTC
  v_today_start := ((NOW() AT TIME ZONE 'Asia/Kolkata')::DATE::TIMESTAMPTZ) AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC';
  
  -- Update all expired bookings to cancelled
  WITH expired_bookings AS (
    SELECT id, customer_id, designer_id
    FROM bookings
    WHERE status IN ('pending', 'confirmed')
      AND scheduled_date < v_today_start
  ),
  cancelled_bookings AS (
    UPDATE bookings
    SET 
      status = 'cancelled',
      updated_at = NOW()
    WHERE id IN (SELECT id FROM expired_bookings)
    RETURNING id, customer_id, designer_id
  )
  SELECT COUNT(*) INTO v_expired_count
  FROM cancelled_bookings;
  
  -- If no bookings expired, return early
  IF v_expired_count = 0 THEN
    RETURN QUERY SELECT 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Create notifications for affected users
  -- First, get all affected user IDs with their booking counts
  FOR v_user_id, v_booking_count IN
    -- Customers
    SELECT 
      customer_id as user_id,
      COUNT(*) as booking_count
    FROM bookings
    WHERE status = 'cancelled'
      AND updated_at >= NOW() - INTERVAL '1 minute'  -- Only just cancelled ones
      AND customer_id IS NOT NULL
    GROUP BY customer_id
    
    UNION ALL
    
    -- Designers
    SELECT 
      d.user_id,
      COUNT(*) as booking_count
    FROM bookings b
    JOIN designers d ON d.id = b.designer_id
    WHERE b.status = 'cancelled'
      AND b.updated_at >= NOW() - INTERVAL '1 minute'  -- Only just cancelled ones
      AND d.user_id IS NOT NULL
    GROUP BY d.user_id
  LOOP
    -- Insert notification for this user (avoid duplicates)
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_id
    )
    SELECT 
      v_user_id,
      'Sessions Expired',
      v_booking_count || ' scheduled session(s) have been automatically cancelled as the date has passed.',
      'booking_cancelled',
      (SELECT id FROM bookings 
       WHERE (customer_id = v_user_id OR designer_id IN (SELECT id FROM designers WHERE user_id = v_user_id))
         AND status = 'cancelled'
         AND updated_at >= NOW() - INTERVAL '1 minute'
       LIMIT 1)
    WHERE NOT EXISTS (
      -- Avoid duplicate notifications for the same user on the same day
      SELECT 1 FROM notifications 
      WHERE user_id = v_user_id 
        AND type = 'booking_cancelled'
        AND created_at::DATE = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
        AND message LIKE '%automatically cancelled%'
    );
    
    -- Count notifications inserted
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    v_notifications_sent := v_notifications_sent + v_rows_affected;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT v_expired_count, v_notifications_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_expire_past_bookings() TO authenticated;

-- Schedule the function to run daily at 6 AM IST (00:30 UTC)
-- IST is UTC+5:30, so 6 AM IST = 12:30 AM UTC (next day)
-- Cron format: minute hour day month day-of-week
-- 30 0 * * * = 00:30 UTC every day = 6:00 AM IST every day
SELECT cron.schedule(
  'auto-expire-past-bookings-daily',
  '30 0 * * *',  -- 00:30 UTC = 6:00 AM IST
  $$SELECT auto_expire_past_bookings();$$
);

-- Note: To manually test the function, run:
-- SELECT * FROM auto_expire_past_bookings();

-- Note: To check scheduled jobs, run:
-- SELECT * FROM cron.job;

-- Note: To unschedule, run:
-- SELECT cron.unschedule('auto-expire-past-bookings-daily');

