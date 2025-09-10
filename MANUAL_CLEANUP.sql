-- MANUAL DATABASE CLEANUP SCRIPT
-- Run this in Supabase SQL editor to clean up stale session data
-- This will fix the "Designer is currently busy with another session" issue

-- 1. Check what stale data exists first
SELECT 
    'Active Sessions' as table_name,
    COUNT(*) as stale_count
FROM public.active_sessions 
WHERE status = 'active' 
  AND created_at < NOW() - INTERVAL '6 hours'

UNION ALL

SELECT 
    'Live Session Requests' as table_name,
    COUNT(*) as stale_count
FROM public.live_session_requests 
WHERE status = 'accepted' 
  AND created_at < NOW() - INTERVAL '2 hours'

UNION ALL

SELECT 
    'In Progress Bookings' as table_name,
    COUNT(*) as stale_count
FROM public.bookings 
WHERE status = 'in_progress' 
  AND scheduled_date < NOW() - INTERVAL '12 hours';

-- 2. Clean up stale active sessions
UPDATE public.active_sessions 
SET status = 'ended', ended_at = NOW(), updated_at = NOW()
WHERE status = 'active' 
  AND created_at < NOW() - INTERVAL '6 hours';

-- 3. Clean up stale live session requests  
UPDATE public.live_session_requests 
SET status = 'rejected', updated_at = NOW()
WHERE status = 'accepted' 
  AND created_at < NOW() - INTERVAL '2 hours';

-- 4. Clean up stale bookings
UPDATE public.bookings 
SET status = 'completed', updated_at = NOW()
WHERE status = 'in_progress' 
  AND scheduled_date < NOW() - INTERVAL '12 hours';

-- 5. Verify cleanup
SELECT 
    'Active Sessions After Cleanup' as table_name,
    COUNT(*) as remaining_count
FROM public.active_sessions 
WHERE status = 'active' 

UNION ALL

SELECT 
    'Accepted Live Sessions After Cleanup' as table_name,
    COUNT(*) as remaining_count
FROM public.live_session_requests 
WHERE status = 'accepted'

UNION ALL

SELECT 
    'In Progress Bookings After Cleanup' as table_name,
    COUNT(*) as remaining_count
FROM public.bookings 
WHERE status = 'in_progress';
