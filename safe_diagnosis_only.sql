-- SAFE DIAGNOSIS ONLY - NO CHANGES TO DATABASE
-- This script only reads data to understand the inconsistencies

-- 1) Check current active_sessions table structure and data
SELECT 'active_sessions_current_state' AS section,
  COUNT(*) as total_rows,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT designer_id) as unique_designers,
  COUNT(DISTINCT customer_id) as unique_customers
FROM public.active_sessions;

-- 2) Show current active_sessions data (if any)
SELECT 'active_sessions_current_data' AS section, 
  session_id,
  customer_id,
  designer_id,
  created_at
FROM public.active_sessions
ORDER BY created_at DESC
LIMIT 5;

-- 3) Check session_approval_requests data
SELECT 'session_approval_requests_state' AS section,
  COUNT(*) as total_requests,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT designer_id) as unique_designers,
  COUNT(DISTINCT customer_id) as unique_customers
FROM public.session_approval_requests;

-- 4) Check if designers exist in designers table
SELECT 'designers_table_check' AS section,
  sar.designer_id,
  d.id as exists_in_designers_table,
  p.full_name as designer_name
FROM (
  SELECT DISTINCT designer_id 
  FROM public.session_approval_requests 
  WHERE designer_id IS NOT NULL
) sar
LEFT JOIN public.designers d ON d.user_id = sar.designer_id
LEFT JOIN public.profiles p ON p.user_id = sar.designer_id
ORDER BY sar.designer_id;

-- 5) Check what's preventing the join in AdminFinalFiles
SELECT 'admin_final_files_join_analysis' AS section,
  sf.id as file_id,
  sf.name as file_name,
  sf.session_id as file_session_id,
  sf.uploaded_by_id as file_designer_id,
  asn.session_id as active_session_id,
  asn.designer_id as active_designer_id,
  asn.customer_id,
  CASE 
    WHEN asn.designer_id IS NULL THEN 'NO_ACTIVE_SESSION_FOR_DESIGNER'
    WHEN asn.customer_id IS NULL THEN 'ACTIVE_SESSION_BUT_NO_CUSTOMER'
    ELSE 'HAS_CUSTOMER_LINK'
  END as link_status
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.designer_id = sf.uploaded_by_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
ORDER BY sf.created_at DESC
LIMIT 10;

-- 6) Show what session data is available to link files to customers
SELECT 'available_session_data_for_linking' AS section,
  'session_approval_requests' as source_table,
  session_id,
  customer_id,
  designer_id,
  status
FROM public.session_approval_requests
WHERE session_id IN (
  SELECT DISTINCT session_id 
  FROM public.session_files 
  WHERE (uploaded_by_type = 'designer' OR uploaded_by_type IS NULL)
    AND status = 'approved'
    AND session_id IS NOT NULL
)
ORDER BY session_id;

-- 7) Check constraints on active_sessions table
SELECT 'active_sessions_constraints' AS section,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.active_sessions'::regclass;


