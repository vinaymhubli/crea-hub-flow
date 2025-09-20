-- Diagnose why active_sessions is empty or not joining properly

-- 1) Check if active_sessions table exists and has data
SELECT 'active_sessions_count' AS section, COUNT(*) as total_rows
FROM public.active_sessions;

-- 2) Show all active_sessions data (if any)
SELECT 'active_sessions_data' AS section, 
  session_id, 
  customer_id, 
  designer_id, 
  created_at
FROM public.active_sessions
ORDER BY created_at DESC;

-- 3) Check session_files data
SELECT 'session_files_sample' AS section,
  id,
  name,
  session_id,
  uploaded_by_id,
  uploaded_by_type,
  status,
  created_at
FROM public.session_files
WHERE (uploaded_by_type = 'designer' OR uploaded_by_type IS NULL)
  AND status = 'approved'
ORDER BY created_at DESC
LIMIT 10;

-- 4) Check if there are any bookings that might have session info
SELECT 'bookings_sample' AS section,
  id,
  customer_id,
  designer_id,
  created_at
FROM public.bookings
ORDER BY created_at DESC
LIMIT 10;

-- 5) Check if there are any session_approval_requests
SELECT 'session_approval_requests_count' AS section, COUNT(*) as total_rows
FROM public.session_approval_requests;

-- 6) Show session_approval_requests data (if any)
SELECT 'session_approval_requests_data' AS section,
  session_id,
  customer_id,
  designer_id,
  status,
  created_at
FROM public.session_approval_requests
ORDER BY created_at DESC
LIMIT 10;


