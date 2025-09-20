-- Simple fix: Populate active_sessions without ON CONFLICT
-- First check the table structure

-- 1) Check active_sessions table structure
SELECT 'active_sessions_structure' AS section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'active_sessions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2) Check constraints on active_sessions
SELECT 'active_sessions_constraints' AS section,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.active_sessions'::regclass;

-- 3) Clear existing active_sessions (if any)
DELETE FROM public.active_sessions;

-- 4) Populate active_sessions from session_approval_requests
-- Use the most recent request for each designer
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

-- 5) Verify the population
SELECT 'active_sessions_after_population' AS section,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT designer_id) as unique_designers,
  COUNT(DISTINCT customer_id) as unique_customers
FROM public.active_sessions;

-- 6) Show the populated data
SELECT 'populated_sessions_data' AS section,
  session_id,
  customer_id,
  designer_id,
  created_at
FROM public.active_sessions
ORDER BY created_at DESC;

-- 7) Test the join - this should now show customer links
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


