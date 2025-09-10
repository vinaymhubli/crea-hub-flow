-- WORKING CLEANUP - FIXED VERSION
-- Run this in Supabase SQL Editor to clean up everything

-- 1. Clean up ALL active sessions (status can be 'completed')
UPDATE public.active_sessions 
SET 
    status = 'ended',
    ended_at = NOW(),
    updated_at = NOW()
WHERE status != 'ended';

-- 2. Clean up ALL live session requests (MUST use 'rejected' not 'completed')
-- The check constraint only allows: 'pending', 'accepted', 'rejected'
UPDATE public.live_session_requests 
SET 
    status = 'rejected',
    updated_at = NOW()
WHERE status != 'rejected';

-- 3. Clean up ALL in-progress bookings (status can be 'completed')
UPDATE public.bookings 
SET 
    status = 'completed',
    updated_at = NOW()
WHERE status = 'in_progress';

-- 4. Check the results
SELECT 'active_sessions' as table_name, status, COUNT(*) as count
FROM public.active_sessions 
GROUP BY status
UNION ALL
SELECT 'live_session_requests' as table_name, status, COUNT(*) as count
FROM public.live_session_requests 
GROUP BY status
UNION ALL
SELECT 'bookings' as table_name, status, COUNT(*) as count
FROM public.bookings 
GROUP BY status
ORDER BY table_name, status;

-- 5. Verify specific designer is now free
SELECT 
    'Designer 0892ae71-13e6-4956-8abf-e6303e9f1ec4 sessions:' as info,
    COUNT(*) as total_sessions,
    SUM(CASE WHEN status IN ('ended', 'rejected', 'completed') THEN 1 ELSE 0 END) as ended_sessions,
    SUM(CASE WHEN status NOT IN ('ended', 'rejected', 'completed') THEN 1 ELSE 0 END) as active_sessions
FROM (
    SELECT status FROM public.active_sessions WHERE designer_id = '0892ae71-13e6-4956-8abf-e6303e9f1ec4'
    UNION ALL
    SELECT status FROM public.live_session_requests WHERE designer_id = '0892ae71-13e6-4956-8abf-e6303e9f1ec4'
    UNION ALL
    SELECT status FROM public.bookings WHERE designer_id = '0892ae71-13e6-4956-8abf-e6303e9f1ec4'
) as all_sessions;
