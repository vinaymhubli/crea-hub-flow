-- CRITICAL DEADLOCK FIX - TERMINATE ALL PROBLEMATIC CONNECTIONS
-- Run this in Supabase SQL Editor IMMEDIATELY

-- 1. First, let's see what processes are causing the deadlock
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    LEFT(query, 150) as query_preview,
    wait_event_type,
    wait_event
FROM pg_stat_activity 
WHERE state IN ('active', 'idle in transaction')
AND pid != pg_backend_pid()  -- Don't kill our own connection
ORDER BY query_start;

-- 2. EMERGENCY: Terminate all connections to these tables
-- This will break the deadlock cycle
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity 
WHERE state IN ('active', 'idle in transaction')
AND pid != pg_backend_pid()  -- Don't kill our own connection
AND (
    query ILIKE '%designer_activity%' 
    OR query ILIKE '%designers%'
    OR application_name = 'PostgREST'
);

-- 3. Drop ALL triggers on both tables immediately
DROP TRIGGER IF EXISTS sync_designer_status_to_activity ON public.designers;
DROP TRIGGER IF EXISTS sync_activity_status_to_designer ON public.designer_activity;
DROP TRIGGER IF EXISTS update_designer_activity_updated_at ON public.designer_activity;

-- 4. Drop the problematic functions
DROP FUNCTION IF EXISTS sync_designer_online_status() CASCADE;

-- 5. Check if there are any remaining triggers
SELECT 
    schemaname,
    tablename, 
    triggername
FROM pg_triggers 
WHERE schemaname = 'public' 
AND (tablename = 'designers' OR tablename = 'designer_activity');

-- 6. Emergency: If deadlock persists, we may need to drop and recreate the problematic migration
-- This is the nuclear option - only if above doesn't work
-- DROP TABLE IF EXISTS public.designer_activity CASCADE;

-- 7. Verify we can now access the tables
SELECT 'Test query - designers' as test, COUNT(*) FROM public.designers LIMIT 1;
SELECT 'Test query - designer_activity' as test, COUNT(*) FROM public.designer_activity LIMIT 1;
