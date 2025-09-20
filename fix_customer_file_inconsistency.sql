-- Fix the inconsistency: CustomerFiles works but AdminFinalFiles shows "Customer Link Pending"
-- Root cause: CustomerFiles uses active_sessions, AdminFinalFiles uses different logic

-- 1) Show how CustomerFiles.tsx actually finds files
SELECT 'customer_files_logic_simulation' AS section,
  'Step 1: Get active_sessions for customer' as step,
  COUNT(*) as active_sessions_count
FROM public.active_sessions 
WHERE customer_id = '137653af-050a-4ad7-8a1e-d14419a7795f';  -- Using the customer ID from your earlier results

-- 2) Show the session_ids that CustomerFiles would use
SELECT 'customer_session_ids' AS section,
  session_id,
  designer_id,
  booking_id
FROM public.active_sessions 
WHERE customer_id = '137653af-050a-4ad7-8a1e-d14419a7795f';

-- 3) Show how CustomerFiles processes session_ids (removes "live_" prefix)
SELECT 'customer_files_session_processing' AS section,
  session_id as original_session_id,
  REPLACE(session_id, 'live_', '') as processed_session_id
FROM public.active_sessions 
WHERE customer_id = '137653af-050a-4ad7-8a1e-d14419a7795f';

-- 4) Show which files CustomerFiles would find using this logic
SELECT 'files_customer_can_see' AS section,
  sf.id,
  sf.name,
  sf.session_id,
  sf.uploaded_by_type,
  sf.status,
  'CUSTOMER_CAN_SEE_THIS' as customer_access
FROM public.session_files sf
WHERE sf.session_id IN (
  SELECT REPLACE(asn.session_id, 'live_', '')
  FROM public.active_sessions asn
  WHERE asn.customer_id = '137653af-050a-4ad7-8a1e-d14419a7795f'
)
ORDER BY sf.created_at DESC;

-- 5) Now show why AdminFinalFiles shows "Customer Link Pending"
-- AdminFinalFiles tries to join session_files with active_sessions by designer_id
SELECT 'admin_files_logic_simulation' AS section,
  sf.id,
  sf.name,
  sf.session_id,
  sf.uploaded_by_id as designer_id,
  asn.customer_id,
  CASE 
    WHEN asn.customer_id IS NULL THEN 'CUSTOMER_LINK_PENDING'
    ELSE 'HAS_CUSTOMER_LINK'
  END as admin_view_status
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.designer_id = sf.uploaded_by_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
ORDER BY sf.created_at DESC
LIMIT 14;

-- 6) The FIX: We need to populate active_sessions properly
-- Create active_sessions entries that link files to customers via session_approval_requests
INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
SELECT DISTINCT 
  sar.session_id,
  sar.customer_id,
  sar.designer_id,
  sar.created_at,
  NOW() as updated_at
FROM public.session_approval_requests sar
WHERE sar.customer_id IS NOT NULL 
  AND sar.designer_id IS NOT NULL
  AND sar.session_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.active_sessions asn 
    WHERE asn.session_id = sar.session_id
  );

-- 7) Verify the fix - both CustomerFiles and AdminFinalFiles should now work
SELECT 'verification_after_fix' AS section,
  sf.id,
  sf.name,
  sf.session_id,
  sf.uploaded_by_id as designer_id,
  asn.customer_id,
  p.full_name as customer_name,
  CASE 
    WHEN asn.customer_id IS NOT NULL THEN 'FIXED_HAS_CUSTOMER_LINK'
    ELSE 'STILL_NO_CUSTOMER_LINK'
  END as final_status
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.designer_id = sf.uploaded_by_id
LEFT JOIN public.profiles p ON p.user_id = asn.customer_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
ORDER BY sf.created_at DESC
LIMIT 14;


