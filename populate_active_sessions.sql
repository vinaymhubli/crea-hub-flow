-- Populate active_sessions from session_approval_requests
-- This will fix the "Customer Link Pending" issue

-- 1) First, let's see what we have in session_approval_requests
SELECT 'session_approval_requests_summary' AS section,
  COUNT(*) as total_requests,
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(DISTINCT designer_id) as unique_designers,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.session_approval_requests;

-- 2) Show the data we'll use to populate active_sessions
SELECT 'data_to_populate' AS section,
  session_id,
  customer_id,
  designer_id,
  status,
  created_at
FROM public.session_approval_requests
ORDER BY created_at DESC
LIMIT 10;

-- 3) Populate active_sessions from session_approval_requests
-- We'll use the most recent request for each designer (since there's a unique constraint on designer_id)
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
ORDER BY designer_id, created_at DESC
ON CONFLICT (designer_id) DO UPDATE SET
  session_id = EXCLUDED.session_id,
  customer_id = EXCLUDED.customer_id,
  updated_at = NOW();

-- 4) Verify the population
SELECT 'active_sessions_after_population' AS section,
  session_id,
  customer_id,
  designer_id,
  created_at,
  updated_at
FROM public.active_sessions
ORDER BY created_at DESC;

-- 5) Test the join - this should now show customer links
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


