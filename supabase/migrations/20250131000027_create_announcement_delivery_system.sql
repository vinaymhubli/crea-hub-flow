-- Create announcement delivery system
-- This migration creates functions to automatically deliver announcements to users

-- Function to get target user IDs based on announcement target
CREATE OR REPLACE FUNCTION get_target_user_ids(
  p_target TEXT,
  p_announcement_id UUID
) RETURNS TABLE(user_id UUID) AS $$
BEGIN
  -- Return user IDs based on target audience
  IF p_target = 'all' THEN
    RETURN QUERY 
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.user_id IS NOT NULL;
    
  ELSIF p_target = 'designers' THEN
    RETURN QUERY 
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.role = 'designer' 
    OR profiles.user_type = 'designer';
    
  ELSIF p_target = 'clients' THEN
    RETURN QUERY 
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.role = 'customer' 
    OR profiles.user_type = 'client';
    
  ELSIF p_target = 'admins' THEN
    RETURN QUERY 
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.role = 'admin' 
    OR profiles.is_admin = true;
    
  ELSE
    -- Default to all users
    RETURN QUERY 
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.user_id IS NOT NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to deliver announcement to target users
CREATE OR REPLACE FUNCTION deliver_announcement_to_users(
  p_announcement_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_announcement RECORD;
  v_user_id UUID;
  v_delivered_count INTEGER := 0;
BEGIN
  -- Get announcement details
  SELECT * INTO v_announcement 
  FROM announcements 
  WHERE id = p_announcement_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Announcement not found: %', p_announcement_id;
  END IF;
  
  -- Only deliver if announcement is active
  IF NOT v_announcement.is_active THEN
    RETURN 0;
  END IF;
  
  -- Loop through target users and create notifications
  FOR v_user_id IN 
    SELECT get_target_user_ids(v_announcement.target, p_announcement_id)
  LOOP
    -- Insert notification for each target user with announcement type
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_id,
      is_read,
      created_at
    ) VALUES (
      v_user_id,
      v_announcement.title,
      v_announcement.message,
      'announcement_' || v_announcement.type, -- Preserve announcement type
      p_announcement_id,
      false,
      NOW()
    );
    
    v_delivered_count := v_delivered_count + 1;
  END LOOP;
  
  -- Update announcement with delivery count
  UPDATE announcements 
  SET sent_count = v_delivered_count,
      updated_at = NOW()
  WHERE id = p_announcement_id;
  
  RETURN v_delivered_count;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically deliver announcements when they become active
CREATE OR REPLACE FUNCTION auto_deliver_announcements()
RETURNS TRIGGER AS $$
DECLARE
  v_delivered_count INTEGER;
BEGIN
  -- Process for both INSERT and UPDATE
  IF TG_OP = 'INSERT' THEN
    -- For INSERT: deliver if announcement is active
    IF NEW.is_active = true AND COALESCE(NEW.sent_count, 0) = 0 THEN
      SELECT deliver_announcement_to_users(NEW.id) INTO v_delivered_count;
      
      -- Log the delivery
      INSERT INTO admin_activity_log (
        admin_id,
        action_type,
        target_type,
        target_id,
        description,
        metadata,
        created_at
      ) VALUES (
        NEW.created_by,
        'announcement_delivered',
        'announcement',
        NEW.id,
        'Announcement delivered to users',
        json_build_object(
          'title', NEW.title,
          'target', NEW.target,
          'delivered_count', v_delivered_count
        ),
        NOW()
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- For UPDATE: only process if announcement is being activated
    IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL) THEN
      -- Check if already delivered (sent_count > 0)
      IF COALESCE(NEW.sent_count, 0) = 0 THEN
        -- Deliver to target users
        SELECT deliver_announcement_to_users(NEW.id) INTO v_delivered_count;
        
        -- Log the delivery
        INSERT INTO admin_activity_log (
          admin_id,
          action_type,
          target_type,
          target_id,
          description,
          metadata,
          created_at
        ) VALUES (
          NEW.created_by,
          'announcement_delivered',
          'announcement',
          NEW.id,
          'Announcement delivered to users',
          json_build_object(
            'title', NEW.title,
            'target', NEW.target,
            'delivered_count', v_delivered_count
          ),
          NOW()
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-deliver announcements
DROP TRIGGER IF EXISTS auto_deliver_announcements_trigger ON announcements;
CREATE TRIGGER auto_deliver_announcements_trigger
  AFTER INSERT OR UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION auto_deliver_announcements();

-- Add sent_count and read_count columns to announcements table
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS read_count INTEGER DEFAULT 0;

-- Function to update read count when notifications are read
-- COMMENTED OUT - Read tracking disabled
-- CREATE OR REPLACE FUNCTION update_announcement_read_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Only process if notification is being marked as read
--   IF NEW.is_read = true AND (OLD.is_read = false OR OLD.is_read IS NULL) THEN
--     -- Update read count for the related announcement
--     UPDATE announcements 
--     SET read_count = read_count + 1,
--         updated_at = NOW()
--     WHERE id = NEW.related_id 
--     AND type = 'announcement';
--   END IF;
--   
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Create trigger to update read count
-- COMMENTED OUT - Read tracking disabled
-- DROP TRIGGER IF EXISTS update_announcement_read_count_trigger ON notifications;
-- CREATE TRIGGER update_announcement_read_count_trigger
--   AFTER UPDATE ON notifications
--   FOR EACH ROW
--   EXECUTE FUNCTION update_announcement_read_count();

-- Update notifications table to allow announcement types with icons
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['booking_confirmation'::text, 'booking_update'::text, 'message'::text, 'payment'::text, 'promotion'::text, 'reminder'::text, 'announcement'::text, 'announcement_info'::text, 'announcement_warning'::text, 'announcement_success'::text, 'announcement_error'::text]));

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_target_user_ids(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION deliver_announcement_to_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_deliver_announcements() TO authenticated;
GRANT EXECUTE ON FUNCTION update_announcement_read_count() TO authenticated;
