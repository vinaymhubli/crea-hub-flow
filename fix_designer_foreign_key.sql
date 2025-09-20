-- Fix designer foreign key issue
-- The designer_id from session_approval_requests doesn't exist in designers table

-- 1) Check what's in the designers table
SELECT 'designers_table_data' AS section,
  id,
  user_id,
  created_at
FROM public.designers
ORDER BY created_at DESC
LIMIT 10;

-- 2) Check what designer_ids are in session_approval_requests
SELECT 'session_approval_designer_ids' AS section,
  designer_id,
  COUNT(*) as request_count
FROM public.session_approval_requests
GROUP BY designer_id
ORDER BY request_count DESC;

-- 3) Check if these designer_ids exist in profiles table
SELECT 'designer_ids_in_profiles' AS section,
  sar.designer_id,
  p.id as profile_id,
  p.user_id,
  p.full_name,
  p.role
FROM public.session_approval_requests sar
LEFT JOIN public.profiles p ON p.user_id = sar.designer_id
GROUP BY sar.designer_id, p.id, p.user_id, p.full_name, p.role
ORDER BY sar.designer_id;

-- 4) Check if these designer_ids exist in designers table
SELECT 'designer_ids_in_designers_table' AS section,
  sar.designer_id,
  d.id as designer_table_id,
  d.user_id as designer_user_id
FROM public.session_approval_requests sar
LEFT JOIN public.designers d ON d.user_id = sar.designer_id
GROUP BY sar.designer_id, d.id, d.user_id
ORDER BY sar.designer_id;

-- 5) SOLUTION: Insert missing designers into designers table
-- Use the designer_ids from session_approval_requests that exist in profiles but not in designers
INSERT INTO public.designers (user_id, created_at, updated_at)
SELECT DISTINCT 
  sar.designer_id,
  NOW() as created_at,
  NOW() as updated_at
FROM public.session_approval_requests sar
INNER JOIN public.profiles p ON p.user_id = sar.designer_id
LEFT JOIN public.designers d ON d.user_id = sar.designer_id
WHERE d.id IS NULL  -- Only insert if not already in designers table
  AND sar.designer_id IS NOT NULL;

-- 6) Verify the fix
SELECT 'designers_after_insert' AS section,
  COUNT(*) as total_designers
FROM public.designers;

-- 7) Now try to populate active_sessions again
INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
SELECT DISTINCT ON (designer_id)
  session_id,
  customer_id,
  designer_id,
  created_at,
  NOW() as updated_at
FROM public.session_approval_requests
WHERE customer_id IS NOT NULL 
  AND designer_id IS NOT NULL
  AND session_id IS NOT NULL
ORDER BY designer_id, created_at DESC;

-- 8) Final verification
SELECT 'final_verification' AS section,
  COUNT(*) as total_active_sessions,
  COUNT(DISTINCT designer_id) as unique_designers,
  COUNT(DISTINCT customer_id) as unique_customers
FROM public.active_sessions;


