-- FINAL SAFE FIX - Handle existing data and avoid duplicates

-- 1) First, let's see what's currently in active_sessions
SELECT 'current_active_sessions_data' AS section,
  session_id,
  customer_id,
  designer_id,
  created_at
FROM public.active_sessions
ORDER BY created_at DESC;

-- 2) Check which session_approval_requests are NOT in active_sessions yet
SELECT 'missing_sessions_to_add' AS section,
  sar.session_id,
  sar.customer_id,
  sar.designer_id,
  sar.status as approval_status
FROM public.session_approval_requests sar
LEFT JOIN public.active_sessions asn ON asn.session_id = sar.session_id
WHERE asn.session_id IS NULL  -- Only sessions not already in active_sessions
  AND sar.customer_id IS NOT NULL 
  AND sar.designer_id IS NOT NULL
  AND sar.session_id IS NOT NULL
ORDER BY sar.created_at DESC;

-- 3) SAFE INSERT - Only add sessions that don't already exist
INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
SELECT 
  sar.session_id,
  sar.customer_id,
  sar.designer_id,
  sar.created_at,
  NOW() as updated_at
FROM public.session_approval_requests sar
LEFT JOIN public.active_sessions asn ON asn.session_id = sar.session_id
WHERE asn.session_id IS NULL  -- Only insert if session doesn't exist
  AND sar.customer_id IS NOT NULL 
  AND sar.designer_id IS NOT NULL
  AND sar.session_id IS NOT NULL;

-- 4) Show how many new sessions were added
SELECT 'sessions_added_count' AS section,
  COUNT(*) as total_active_sessions_now
FROM public.active_sessions;

-- 5) Final verification - Test the AdminFinalFiles logic
SELECT 'admin_final_files_fixed_test' AS section,
  sf.id as file_id,
  sf.name as file_name,
  sf.session_id as file_session_id,
  sf.uploaded_by_id as designer_id,
  asn.customer_id,
  p.full_name as customer_name,
  CASE 
    WHEN asn.customer_id IS NOT NULL AND p.full_name IS NOT NULL THEN 'FIXED_SHOWS_CUSTOMER_NAME'
    WHEN asn.customer_id IS NOT NULL THEN 'HAS_CUSTOMER_BUT_NO_NAME'
    ELSE 'STILL_NO_CUSTOMER_LINK'
  END as admin_panel_status
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.designer_id = sf.uploaded_by_id
LEFT JOIN public.profiles p ON p.user_id = asn.customer_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
ORDER BY sf.created_at DESC
LIMIT 15;


