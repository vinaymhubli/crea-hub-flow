-- Check if tables exist and their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'designer_weekly_schedule',
    'designer_availability_settings',
    'designer_slots',
    'bookings',
    'designer_special_days'
)
ORDER BY table_name, ordinal_position;

-- Check existing triggers on bookings table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'bookings';

-- Check if the auto-accept function already exists
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname LIKE '%auto_accept%' OR proname LIKE '%initialize_designer_weekly%';

-- Check sample data from designer_weekly_schedule
SELECT 
    designer_id,
    day_of_week,
    is_available,
    start_time,
    end_time
FROM public.designer_weekly_schedule
LIMIT 10;

-- Check if any designers exist without weekly schedule entries
SELECT 
    d.id as designer_id,
    COUNT(dws.id) as schedule_entries
FROM public.designers d
LEFT JOIN public.designer_weekly_schedule dws ON d.id = dws.designer_id
GROUP BY d.id
HAVING COUNT(dws.id) < 7
LIMIT 10;

