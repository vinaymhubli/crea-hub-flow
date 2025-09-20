-- Fix missing sessions by creating active_sessions entries for files that don't have them
-- This will resolve the "Customer Link Pending" issue

-- 1) First, let's see what sessions are missing
SELECT 'missing_sessions_analysis' AS section,
  sf.session_id,
  COUNT(*) as file_count,
  STRING_AGG(sf.name, ', ') as file_names,
  sf.uploaded_by_id as designer_id,
  CASE WHEN asn.session_id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as active_session_status
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.session_id = sf.session_id OR asn.session_id = CONCAT('live_', sf.session_id)
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
GROUP BY sf.session_id, sf.uploaded_by_id, asn.session_id
ORDER BY file_count DESC;

-- 2) Create missing active_sessions entries
-- We'll use the file's uploaded_by_id as the designer_id and create a dummy customer_id
-- You'll need to update these with real customer IDs later
INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
SELECT DISTINCT 
  sf.session_id,
  '00000000-0000-0000-0000-000000000000'::uuid as customer_id, -- Dummy customer ID - UPDATE THIS
  sf.uploaded_by_id as designer_id,
  NOW() as created_at,
  NOW() as updated_at
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.session_id = sf.session_id OR asn.session_id = CONCAT('live_', sf.session_id)
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
  AND asn.session_id IS NULL
  AND sf.uploaded_by_id IS NOT NULL
ON CONFLICT (session_id) DO NOTHING;

-- 3) Also create entries for sessions with "live_" prefix
INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
SELECT DISTINCT 
  CONCAT('live_', sf.session_id) as session_id,
  '00000000-0000-0000-0000-000000000000'::uuid as customer_id, -- Dummy customer ID - UPDATE THIS
  sf.uploaded_by_id as designer_id,
  NOW() as created_at,
  NOW() as updated_at
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.session_id = CONCAT('live_', sf.session_id)
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
  AND asn.session_id IS NULL
  AND sf.uploaded_by_id IS NOT NULL
  AND sf.session_id NOT LIKE 'live_%' -- Only for sessions without live_ prefix
ON CONFLICT (session_id) DO NOTHING;

-- 4) Verify the fix
SELECT 'verification' AS section,
  COUNT(*) as total_active_sessions,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.active_sessions;

-- 5) Show which files should now have customer links
SELECT 'files_with_customer_links' AS section,
  sf.id as file_id,
  sf.name as file_name,
  sf.session_id,
  asn.customer_id,
  asn.designer_id,
  CASE WHEN asn.customer_id = '00000000-0000-0000-0000-000000000000' THEN 'NEEDS_REAL_CUSTOMER_ID' ELSE 'OK' END as status
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.session_id = sf.session_id OR asn.session_id = CONCAT('live_', sf.session_id)
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
ORDER BY sf.created_at DESC
LIMIT 20;



