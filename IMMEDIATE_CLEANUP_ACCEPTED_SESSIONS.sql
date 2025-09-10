-- IMMEDIATE CLEANUP FOR STUCK ACCEPTED LIVE SESSIONS
-- Run this directly in Supabase SQL Editor to clean up the 2 accepted sessions

-- First, let's see what we're dealing with
SELECT 
    id, 
    designer_id, 
    customer_id, 
    status, 
    created_at, 
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_old
FROM public.live_session_requests 
WHERE status = 'accepted'
ORDER BY updated_at DESC;

-- Clean up ALL accepted live session requests immediately
-- These are clearly stuck and preventing designers from accepting new sessions
UPDATE public.live_session_requests 
SET 
    status = 'completed',
    updated_at = NOW()
WHERE status = 'accepted';

-- Check the results
SELECT 
    'AFTER CLEANUP' as status,
    COUNT(*) as count
FROM public.live_session_requests 
WHERE status = 'accepted';

-- Also clean up any orphaned active sessions for this designer
UPDATE public.active_sessions 
SET 
    status = 'ended',
    ended_at = NOW(),
    updated_at = NOW()
WHERE designer_id = '0892ae71-13e6-4956-8abf-e6303e9f1ec4'
AND status = 'active';

-- Final verification - should show 0 accepted sessions
SELECT 
    status,
    COUNT(*) as count
FROM public.live_session_requests 
WHERE designer_id = '0892ae71-13e6-4956-8abf-e6303e9f1ec4'
GROUP BY status
ORDER BY status;
