-- SAFE MINIMAL FIX - Only add missing data, don't break existing
-- Based on constraints: unique session_id, foreign keys to bookings/profiles/designers

-- STEP 1: Only check if we need to add missing designers (read-only)
SELECT 'missing_designers_check' AS section,
  sar.designer_id,
  d.id as exists_in_designers,
  p.full_name as designer_name
FROM (
  SELECT DISTINCT designer_id 
  FROM public.session_approval_requests 
  WHERE designer_id IS NOT NULL
) sar
LEFT JOIN public.designers d ON d.user_id = sar.designer_id
LEFT JOIN public.profiles p ON p.user_id = sar.designer_id
WHERE d.id IS NULL  -- Only show missing ones
ORDER BY sar.designer_id;

-- STEP 2: Check current active_sessions count (read-only)
SELECT 'current_active_sessions_count' AS section,
  COUNT(*) as total_active_sessions,
  COUNT(DISTINCT designer_id) as unique_designers
FROM public.active_sessions;

-- STEP 3: Show which approved files have no customer link (read-only)
SELECT 'files_without_customer_link' AS section,
  COUNT(*) as files_without_customer_link
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.designer_id = sf.uploaded_by_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
  AND asn.customer_id IS NULL;

-- UNCOMMENT THE FOLLOWING SECTIONS ONE BY ONE AFTER REVIEWING THE RESULTS ABOVE

-- STEP 4: Add missing designers (only if needed)
-- INSERT INTO public.designers (user_id, created_at, updated_at)
-- SELECT DISTINCT 
--   sar.designer_id,
--   NOW() as created_at,
--   NOW() as updated_at
-- FROM public.session_approval_requests sar
-- INNER JOIN public.profiles p ON p.user_id = sar.designer_id
-- LEFT JOIN public.designers d ON d.user_id = sar.designer_id
-- WHERE d.id IS NULL
--   AND sar.designer_id IS NOT NULL;

-- STEP 5: Add missing active_sessions (only if needed and no conflicts)
-- INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
-- SELECT DISTINCT ON (sar.designer_id)
--   sar.session_id,
--   sar.customer_id,
--   sar.designer_id,
--   sar.created_at,
--   NOW() as updated_at
-- FROM public.session_approval_requests sar
-- LEFT JOIN public.active_sessions asn ON asn.designer_id = sar.designer_id
-- WHERE sar.customer_id IS NOT NULL 
--   AND sar.designer_id IS NOT NULL
--   AND sar.session_id IS NOT NULL
--   AND asn.id IS NULL  -- Only if designer doesn't already have an active session
-- ORDER BY sar.designer_id, sar.created_at DESC;

-- STEP 6: Verify the fix (read-only)
-- SELECT 'verification_after_fix' AS section,
--   sf.name as file_name,
--   sf.session_id as file_session_id,
--   asn.customer_id,
--   p.full_name as customer_name,
--   CASE 
--     WHEN asn.customer_id IS NOT NULL THEN 'HAS_CUSTOMER_LINK'
--     ELSE 'NO_CUSTOMER_LINK'
--   END as link_status
-- FROM public.session_files sf
-- LEFT JOIN public.active_sessions asn ON asn.designer_id = sf.uploaded_by_id
-- LEFT JOIN public.profiles p ON p.user_id = asn.customer_id
-- WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
--   AND sf.status = 'approved'
-- ORDER BY sf.created_at DESC
-- LIMIT 10;


