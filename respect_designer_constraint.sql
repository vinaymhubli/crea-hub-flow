-- RESPECT DESIGNER CONSTRAINT - Only one active session per designer allowed

-- 1) Check current active_sessions and the designer constraint
SELECT 'current_active_sessions_with_designer_constraint' AS section,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT designer_id) as unique_designers,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT designer_id) THEN 'CONSTRAINT_RESPECTED'
    ELSE 'CONSTRAINT_VIOLATED'
  END as constraint_status
FROM public.active_sessions;

-- 2) Show which designers already have active sessions
SELECT 'designers_with_existing_sessions' AS section,
  designer_id,
  session_id,
  customer_id,
  created_at
FROM public.active_sessions
ORDER BY created_at DESC;

-- 3) Show which designers from session_approval_requests DON'T have active sessions yet
SELECT 'designers_missing_active_sessions' AS section,
  sar.designer_id,
  sar.session_id,
  sar.customer_id,
  sar.created_at,
  'NEEDS_ACTIVE_SESSION' as status
FROM (
  -- Get the most recent session for each designer from approval requests
  SELECT DISTINCT ON (designer_id)
    designer_id,
    session_id,
    customer_id,
    created_at
  FROM public.session_approval_requests
  WHERE customer_id IS NOT NULL 
    AND designer_id IS NOT NULL
    AND session_id IS NOT NULL
  ORDER BY designer_id, created_at DESC
) sar
LEFT JOIN public.active_sessions asn ON asn.designer_id = sar.designer_id
WHERE asn.designer_id IS NULL;  -- Only designers without active sessions

-- 4) SAFE INSERT - Only add designers who don't already have active sessions
INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
SELECT 
  sar.session_id,
  sar.customer_id,
  sar.designer_id,
  sar.created_at,
  NOW() as updated_at
FROM (
  -- Get the most recent session for each designer
  SELECT DISTINCT ON (designer_id)
    designer_id,
    session_id,
    customer_id,
    created_at
  FROM public.session_approval_requests
  WHERE customer_id IS NOT NULL 
    AND designer_id IS NOT NULL
    AND session_id IS NOT NULL
  ORDER BY designer_id, created_at DESC
) sar
LEFT JOIN public.active_sessions asn ON asn.designer_id = sar.designer_id
WHERE asn.designer_id IS NULL;  -- Only insert designers without existing sessions

-- 5) Verify the fix - check final state
SELECT 'final_verification' AS section,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT designer_id) as unique_designers,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.active_sessions;

-- 6) Test AdminFinalFiles logic - should now show customer names
SELECT 'admin_final_files_test' AS section,
  sf.name as file_name,
  sf.uploaded_by_id as designer_id,
  asn.session_id as active_session_id,
  asn.customer_id,
  p.full_name as customer_name,
  CASE 
    WHEN p.full_name IS NOT NULL THEN 'SUCCESS_SHOWS_CUSTOMER_NAME'
    WHEN asn.customer_id IS NOT NULL THEN 'HAS_CUSTOMER_ID_BUT_NO_NAME'
    ELSE 'NO_CUSTOMER_LINK'
  END as result
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.designer_id = sf.uploaded_by_id
LEFT JOIN public.profiles p ON p.user_id = asn.customer_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
ORDER BY sf.created_at DESC
LIMIT 15;


