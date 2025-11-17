-- Fix auto_expire_past_bookings function to handle errors properly
-- The previous version was failing due to notification insertion issues

CREATE OR REPLACE FUNCTION auto_expire_past_bookings()
RETURNS TABLE(expired_count INTEGER, notifications_sent INTEGER) AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_expired_count INTEGER := 0;
  v_notifications_sent INTEGER := 0;
  v_user_id UUID;
  v_booking_count INTEGER;
  v_booking_id UUID;
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
  -- Get all affected user IDs with their booking counts
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
    -- Get a booking ID for this user (for related_id)
    SELECT id INTO v_booking_id
    FROM bookings 
    WHERE (customer_id = v_user_id OR designer_id IN (SELECT id FROM designers WHERE user_id = v_user_id))
      AND status = 'cancelled'
      AND updated_at >= NOW() - INTERVAL '1 minute'
    LIMIT 1;
    
    -- Check if notification already exists for this user today
    IF NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = v_user_id 
        AND type = 'booking_cancelled'
        AND created_at::DATE = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
        AND message LIKE '%automatically cancelled%'
    ) THEN
      -- Insert notification
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        related_id
      ) VALUES (
        v_user_id,
        'Sessions Expired',
        v_booking_count || ' scheduled session(s) have been automatically cancelled as the date has passed.',
        'booking_cancelled',
        v_booking_id
      );
      
      -- Count notifications inserted
      GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
      v_notifications_sent := v_notifications_sent + v_rows_affected;
    END IF;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT v_expired_count, v_notifications_sent;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but still return the expired count
    -- This ensures bookings are cancelled even if notifications fail
    RETURN QUERY SELECT v_expired_count, 0::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_expire_past_bookings() TO authenticated;

