-- Simple cleanup migration to fix the "designer busy" issue
-- This version avoids constraint conflicts by using existing status values

-- 1. Clean up old active_sessions that should have ended
-- Remove sessions older than 24 hours that are still marked as active
UPDATE public.active_sessions 
SET status = 'ended', ended_at = NOW(), updated_at = NOW()
WHERE status = 'active' 
  AND created_at < NOW() - INTERVAL '24 hours';

-- 2. Clean up old live_session_requests that are stuck in 'accepted' status
-- Set them to 'rejected' instead of 'expired' to avoid constraint issues
UPDATE public.live_session_requests 
SET status = 'rejected', updated_at = NOW()
WHERE status = 'accepted' 
  AND created_at < NOW() - INTERVAL '6 hours';

-- 3. Clean up bookings stuck in 'in_progress' status
-- This shouldn't happen often, but clean up any that are unreasonably old
UPDATE public.bookings 
SET status = 'completed', updated_at = NOW()
WHERE status = 'in_progress' 
  AND scheduled_date < NOW() - INTERVAL '12 hours';

-- 4. Create a simple cleanup function that works with existing constraints
CREATE OR REPLACE FUNCTION cleanup_stale_sessions_simple()
RETURNS void AS $$
BEGIN
    -- Clean up active sessions older than 6 hours
    UPDATE public.active_sessions 
    SET status = 'ended', ended_at = NOW(), updated_at = NOW()
    WHERE status = 'active' 
      AND created_at < NOW() - INTERVAL '6 hours';

    -- Clean up accepted live session requests older than 2 hours
    -- Using 'rejected' status to avoid constraint issues
    UPDATE public.live_session_requests 
    SET status = 'rejected', updated_at = NOW()
    WHERE status = 'accepted' 
      AND created_at < NOW() - INTERVAL '2 hours';

    -- Log cleanup activity
    RAISE NOTICE 'Cleaned up stale sessions at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Create indexes to speed up cleanup and availability queries
CREATE INDEX IF NOT EXISTS idx_active_sessions_status_created 
ON public.active_sessions(status, created_at);

CREATE INDEX IF NOT EXISTS idx_live_session_requests_status_created 
ON public.live_session_requests(status, created_at);

CREATE INDEX IF NOT EXISTS idx_bookings_status_scheduled 
ON public.bookings(status, scheduled_date);

-- 6. Run the cleanup function once to clean up any existing stale data
SELECT cleanup_stale_sessions_simple();
