-- Safe fix for missing sessions - works with unique designer constraint
-- The issue: active_sessions has unique constraint on designer_id (one session per designer)
-- But files exist from multiple sessions for the same designer

-- 1) Check the constraint
SELECT 'constraint_check' AS section,
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.active_sessions'::regclass;

-- 2) See what we're dealing with
SELECT 'current_active_sessions' AS section,
  session_id,
  customer_id,
  designer_id,
  created_at
FROM public.active_sessions
ORDER BY created_at DESC;

-- 3) Show the mismatch - files vs active sessions
SELECT 'files_vs_sessions' AS section,
  sf.session_id as file_session_id,
  sf.uploaded_by_id as file_designer_id,
  asn.session_id as active_session_id,
  asn.designer_id as active_designer_id,
  CASE 
    WHEN asn.session_id IS NULL THEN 'NO_ACTIVE_SESSION'
    WHEN sf.session_id != asn.session_id THEN 'SESSION_MISMATCH'
    ELSE 'MATCHED'
  END as status
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.designer_id = sf.uploaded_by_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
ORDER BY sf.created_at DESC
LIMIT 20;

-- 4) SOLUTION: Update the existing active session to use the most recent session_id
-- This will link all files from that designer to the customer in the active session
UPDATE public.active_sessions 
SET session_id = (
  SELECT sf.session_id 
  FROM public.session_files sf 
  WHERE sf.uploaded_by_id = active_sessions.designer_id 
    AND (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
    AND sf.status = 'approved'
  ORDER BY sf.created_at DESC 
  LIMIT 1
),
updated_at = NOW()
WHERE designer_id IN (
  SELECT DISTINCT sf.uploaded_by_id 
  FROM public.session_files sf 
  WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
    AND sf.status = 'approved'
    AND sf.uploaded_by_id IS NOT NULL
);

-- 5) Verify the fix
SELECT 'after_fix_verification' AS section,
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
LIMIT 20;


