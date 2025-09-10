-- Aggressive cleanup for accepted live session requests that are stuck

-- First, let's see what we're dealing with
-- This will show us the current accepted live session requests
-- (commented out for migration, but useful for debugging)
-- SELECT id, designer_id, customer_id, status, created_at, updated_at 
-- FROM public.live_session_requests 
-- WHERE status = 'accepted'
-- ORDER BY updated_at DESC;

-- Clean up accepted live session requests that are older than 30 minutes
-- These are likely stale sessions that didn't properly transition
-- Note: Using 'rejected' because 'completed' is not allowed by the check constraint
UPDATE public.live_session_requests 
SET 
    status = 'rejected',
    updated_at = NOW()
WHERE status = 'accepted' 
AND updated_at < NOW() - INTERVAL '30 minutes';

-- Also clean up any accepted requests that don't have corresponding active sessions
-- If a session was accepted but no active session was created, it's stale
UPDATE public.live_session_requests 
SET 
    status = 'rejected',
    updated_at = NOW()
WHERE status = 'accepted' 
AND id NOT IN (
    SELECT lsr.id 
    FROM public.live_session_requests lsr
    INNER JOIN public.active_sessions asess ON lsr.designer_id = asess.designer_id
    WHERE lsr.status = 'accepted' 
    AND asess.status = 'active'
);

-- Update our cleanup function to be more aggressive with accepted sessions
CREATE OR REPLACE FUNCTION cleanup_stale_sessions_aggressive()
RETURNS TABLE(
    cleaned_active_sessions INTEGER,
    cleaned_live_requests INTEGER,
    cleaned_bookings INTEGER
) AS $$
DECLARE
    active_count INTEGER := 0;
    requests_count INTEGER := 0;
    bookings_count INTEGER := 0;
BEGIN
    -- Clean up stale active sessions (older than 6 hours)
    UPDATE active_sessions 
    SET status = 'ended', updated_at = NOW()
    WHERE status = 'active' 
    AND created_at < NOW() - INTERVAL '6 hours';
    
    GET DIAGNOSTICS active_count = ROW_COUNT;

    -- Clean up accepted live session requests older than 30 minutes
    -- OR that don't have corresponding active sessions
    -- Note: Using 'rejected' because 'completed' is not allowed by the check constraint
    UPDATE live_session_requests 
    SET status = 'rejected', updated_at = NOW()
    WHERE status = 'accepted' 
    AND (
        updated_at < NOW() - INTERVAL '30 minutes'
        OR id NOT IN (
            SELECT lsr.id 
            FROM live_session_requests lsr
            INNER JOIN active_sessions asess ON lsr.designer_id = asess.designer_id
            WHERE lsr.status = 'accepted' 
            AND asess.status = 'active'
        )
    );
    
    GET DIAGNOSTICS requests_count = ROW_COUNT;

    -- Clean up stale bookings (older than 12 hours)
    UPDATE bookings 
    SET status = 'completed', updated_at = NOW()
    WHERE status = 'in_progress' 
    AND created_at < NOW() - INTERVAL '12 hours';
    
    GET DIAGNOSTICS bookings_count = ROW_COUNT;

    RETURN QUERY SELECT active_count, requests_count, bookings_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_stale_sessions_aggressive() TO authenticated;

-- For immediate cleanup, run the function
SELECT * FROM cleanup_stale_sessions_aggressive();
