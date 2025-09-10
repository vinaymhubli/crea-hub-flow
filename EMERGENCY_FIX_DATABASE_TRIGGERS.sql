-- EMERGENCY FIX - DROP PROBLEMATIC TRIGGERS IMMEDIATELY
-- Run this in Supabase SQL Editor RIGHT NOW to stop the infinite loops

-- 1. Drop the sync triggers that are causing infinite loops
DROP TRIGGER IF EXISTS sync_designer_status_to_activity ON public.designers;
DROP TRIGGER IF EXISTS sync_activity_status_to_designer ON public.designer_activity;

-- 2. Drop the sync function that's causing recursion
DROP FUNCTION IF EXISTS sync_designer_online_status();

-- 3. Check if there are any other problematic triggers
SELECT 
    schemaname,
    tablename, 
    triggername,
    triggerdef
FROM pg_triggers 
WHERE schemaname = 'public' 
AND (tablename = 'designers' OR tablename = 'designer_activity')
ORDER BY tablename, triggername;

-- 4. Clean up any stuck connections (this might help with connection pool)
-- Note: This is informational, Supabase will handle connection cleanup

-- 5. Verify the tables are back to normal
SELECT 'designers table' as table_name, COUNT(*) as record_count FROM public.designers
UNION ALL
SELECT 'designer_activity table' as table_name, COUNT(*) as record_count FROM public.designer_activity;

-- 6. Check for any remaining active processes (informational)
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    LEFT(query, 100) as query_preview
FROM pg_stat_activity 
WHERE state = 'active' 
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;
