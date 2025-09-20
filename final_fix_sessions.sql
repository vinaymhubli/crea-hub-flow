-- Final fix: Clear and repopulate active_sessions properly

-- 1) Clear existing active_sessions completely
DELETE FROM public.active_sessions;

-- 2) Insert missing designers into designers table (if needed)
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

-- 3) Now populate active_sessions with unique session_ids
-- Use the most recent session for each designer
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

-- 4) Verify the population
SELECT 'active_sessions_after_population' AS section,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT designer_id) as unique_designers,
  COUNT(DISTINCT customer_id) as unique_customers
FROM public.active_sessions;

-- 5) Show the populated data
SELECT 'populated_sessions_data' AS section,
  session_id,
  customer_id,
  designer_id,
  created_at
FROM public.active_sessions
ORDER BY created_at DESC;

-- 6) Test the join - this should now show customer links
SELECT 'files_with_customer_links_test' AS section,
  sf.id as file_id,
  sf.name as file_name,
  sf.session_id as file_session_id,
  asn.session_id as active_session_id,
  asn.customer_id,
  asn.designer_id,
  CASE 
    WHEN asn.customer_id IS NOT NULL THEN 'HAS_CUSTOMER_LINK'
    ELSE 'NO_CUSTOMER_LINK'
  END as customer_status
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.designer_id = sf.uploaded_by_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
ORDER BY sf.created_at DESC
LIMIT 10;


