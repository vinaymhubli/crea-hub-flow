-- Check what's actually in active_sessions right now
SELECT 'current_database_state' AS section,
  session_id,
  customer_id,
  designer_id,
  updated_at
FROM public.active_sessions
ORDER BY updated_at DESC;


