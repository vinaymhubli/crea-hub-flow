-- SIMPLE DEADLOCK FIX - Compatible with Supabase
-- Run this in Supabase SQL Editor IMMEDIATELY

-- 1. Drop ALL triggers on both tables immediately (this will break the deadlock)
DROP TRIGGER IF EXISTS sync_designer_status_to_activity ON public.designers;
DROP TRIGGER IF EXISTS sync_activity_status_to_designer ON public.designer_activity;
DROP TRIGGER IF EXISTS update_designer_activity_updated_at ON public.designer_activity;

-- 2. Drop the problematic functions
DROP FUNCTION IF EXISTS sync_designer_online_status() CASCADE;

-- 3. Check remaining triggers using information_schema (more compatible)
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('designers', 'designer_activity');

-- 4. Verify we can now access the tables (this should work if deadlock is broken)
SELECT 'Test - designers table' as test, COUNT(*) as count FROM public.designers;
SELECT 'Test - designer_activity table' as test, COUNT(*) as count FROM public.designer_activity;

-- 5. Check if there are any active connections still causing issues
SELECT 
    state,
    COUNT(*) as connection_count
FROM pg_stat_activity 
WHERE state IN ('active', 'idle in transaction')
GROUP BY state;

-- SUCCESS MESSAGE
SELECT 'DEADLOCK FIX COMPLETED - Database should be accessible now' as status;
