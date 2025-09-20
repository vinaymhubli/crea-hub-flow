-- Comprehensive read-only diagnostics for name/linkage inconsistencies
-- Purpose: find why designer/customer names appear as "Unknown" across files and complaints
-- This script DOES NOT modify data. It only SELECTs.

-- 0) Context: current auth id (if run in PostgREST it will be null)
SELECT 'context' AS section, current_user AS current_user, now() AS ts;

-- 1) Table existence
SELECT 'tables_exist' AS section, table_schema, table_name
FROM information_schema.tables
WHERE table_schema='public' AND table_name IN (
  'profiles','session_files','active_sessions','bookings','session_approval_requests','customer_complaints'
)
ORDER BY table_name;

-- 2) Structure: critical columns present
SELECT 'profiles_columns' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='profiles'
  AND column_name IN ('user_id','first_name','last_name','full_name','email','is_admin','role');

SELECT 'session_files_columns' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='session_files'
  AND column_name IN ('id','name','file_url','file_size','session_id','booking_id','uploaded_by_id','uploaded_by_type','status','created_at');

SELECT 'active_sessions_columns' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='active_sessions'
  AND column_name IN ('session_id','customer_id','designer_id','booking_id');

SELECT 'bookings_columns' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='bookings'
  AND column_name IN ('id','customer_id','designer_id','session_id');

SELECT 'approvals_columns' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='session_approval_requests'
  AND column_name IN ('session_id','customer_id','designer_id','status','created_at');

SELECT 'complaints_columns' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='customer_complaints'
  AND column_name IN ('id','session_id','booking_id','customer_id','designer_id','file_id','status','priority','created_at','title');

-- 3) High-level counts
SELECT 'counts' AS section,
  (SELECT COUNT(*) FROM public.profiles) AS profiles,
  (SELECT COUNT(*) FROM public.session_files) AS session_files,
  (SELECT COUNT(*) FROM public.active_sessions) AS active_sessions,
  (SELECT COUNT(*) FROM public.bookings) AS bookings,
  (SELECT COUNT(*) FROM public.session_approval_requests) AS session_approval_requests,
  (SELECT COUNT(*) FROM public.customer_complaints) AS customer_complaints;

-- 4) Inspect approved designer files and linkage to profiles
WITH approved_designer_files AS (
  SELECT sf.id AS file_id, sf.name, sf.session_id, sf.uploaded_by_id AS designer_id, sf.status, sf.created_at
  FROM public.session_files sf
  WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL) AND sf.status = 'approved'
)
SELECT 'approved_files_link_profiles' AS section,
  f.file_id, f.name AS file_name, f.session_id, f.designer_id,
  p.full_name, p.first_name, p.last_name, p.email,
  CASE WHEN p.user_id IS NULL THEN 'MISSING_PROFILE' ELSE 'OK' END AS profile_status
FROM approved_designer_files f
LEFT JOIN public.profiles p ON p.user_id = f.designer_id
ORDER BY f.created_at DESC
LIMIT 50;

-- 5) Session linkage: try to resolve customer from active_sessions/bookings/approvals
WITH files AS (
  SELECT sf.id AS file_id, sf.session_id, sf.uploaded_by_id AS designer_id, sf.created_at
  FROM public.session_files sf
  WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL) AND sf.status = 'approved'
),
resolved AS (
  SELECT f.file_id, f.session_id,
    COALESCE(asn.customer_id, bk.customer_id, apr.customer_id) AS customer_id,
    COALESCE(asn.designer_id, bk.designer_id, apr.designer_id) AS resolved_designer_id,
    CASE 
      WHEN asn.customer_id IS NOT NULL THEN 'active_sessions'
      WHEN bk.customer_id IS NOT NULL THEN 'bookings_via_active_sessions'
      WHEN apr.customer_id IS NOT NULL THEN 'approval_requests'
      ELSE 'none'
    END AS source
  FROM files f
  LEFT JOIN public.active_sessions asn 
    ON asn.session_id IN (f.session_id, CONCAT('live_', f.session_id))
  LEFT JOIN public.bookings bk 
    ON bk.id = asn.booking_id -- bookings may not have session_id; join through active_sessions
  LEFT JOIN public.session_approval_requests apr 
    ON apr.session_id IN (f.session_id, CONCAT('live_', f.session_id))
)
SELECT 'file_to_customer_resolution' AS section,
  r.file_id, r.session_id, r.source,
  r.customer_id,
  cp.full_name AS customer_full_name, cp.first_name AS customer_first, cp.last_name AS customer_last, cp.email AS customer_email,
  r.resolved_designer_id,
  dp.full_name AS designer_full_name, dp.first_name AS designer_first, dp.last_name AS designer_last, dp.email AS designer_email
FROM resolved r
LEFT JOIN public.profiles cp ON cp.user_id = r.customer_id
LEFT JOIN public.profiles dp ON dp.user_id = r.resolved_designer_id
ORDER BY r.source DESC
LIMIT 50;

-- 6) Orphans: files whose uploaded_by_id has no profile
SELECT 'file_orphan_designers' AS section, sf.id AS file_id, sf.name, sf.uploaded_by_id AS designer_id
FROM public.session_files sf
LEFT JOIN public.profiles p ON p.user_id = sf.uploaded_by_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
  AND p.user_id IS NULL
LIMIT 50;

-- 6b) Designer ID mismatches: file.uploader vs resolved session designer
WITH files AS (
  SELECT sf.id AS file_id, sf.session_id, sf.uploaded_by_id AS uploader_designer_id
  FROM public.session_files sf
  WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
),
resolved AS (
  SELECT f.file_id, f.session_id,
         COALESCE(asn.designer_id, apr.designer_id) AS resolved_designer_id
  FROM files f
  LEFT JOIN public.active_sessions asn ON asn.session_id IN (f.session_id, CONCAT('live_', f.session_id))
  LEFT JOIN public.session_approval_requests apr ON apr.session_id IN (f.session_id, CONCAT('live_', f.session_id))
)
SELECT 'designer_id_mismatches' AS section,
  f.file_id,
  f.uploader_designer_id,
  r.resolved_designer_id,
  CASE WHEN f.uploader_designer_id IS DISTINCT FROM r.resolved_designer_id THEN 'MISMATCH' ELSE 'OK' END AS status
FROM files f
LEFT JOIN resolved r USING (file_id)
WHERE f.uploader_designer_id IS DISTINCT FROM r.resolved_designer_id
LIMIT 100;

-- 7) Complaints linkage quality
SELECT 'complaints_link_quality' AS section,
  c.id AS complaint_id, c.title, c.session_id, c.file_id,
  c.customer_id, pc.full_name AS customer_full_name, pc.first_name AS customer_first, pc.last_name AS customer_last, pc.email AS customer_email,
  c.designer_id, pd.full_name AS designer_full_name, pd.first_name AS designer_first, pd.last_name AS designer_last, pd.email AS designer_email,
  f.name AS file_name,
  CASE WHEN pc.user_id IS NULL THEN 'MISSING_CUSTOMER_PROFILE' ELSE 'OK' END AS customer_profile_status,
  CASE WHEN pd.user_id IS NULL THEN 'MISSING_DESIGNER_PROFILE' ELSE 'OK' END AS designer_profile_status,
  CASE WHEN f.id IS NULL THEN 'MISSING_FILE' ELSE 'OK' END AS file_status
FROM public.customer_complaints c
LEFT JOIN public.profiles pc ON pc.user_id = c.customer_id
LEFT JOIN public.profiles pd ON pd.user_id = c.designer_id
LEFT JOIN public.session_files f ON f.id = c.file_id
ORDER BY c.created_at DESC
LIMIT 100;

-- 8) Session ID prefix mismatches visible in complaints
SELECT 'complaints_session_prefix_check' AS section,
  c.id AS complaint_id, c.session_id,
  asn.session_id AS active_session_match,
  asn2.session_id AS active_session_prefix_match
FROM public.customer_complaints c
LEFT JOIN public.active_sessions asn ON asn.session_id = c.session_id
LEFT JOIN public.active_sessions asn2 ON asn2.session_id = CONCAT('live_', c.session_id)
ORDER BY c.created_at DESC
LIMIT 50;

-- 9) Profiles missing names (full_name and first/last empty) for any users referenced by files/complaints
WITH involved_users AS (
  SELECT uploaded_by_id AS user_id FROM public.session_files WHERE uploaded_by_id IS NOT NULL
  UNION
  SELECT customer_id FROM public.customer_complaints
  UNION
  SELECT designer_id FROM public.customer_complaints
)
SELECT 'profiles_missing_names' AS section,
  p.user_id, p.full_name, p.first_name, p.last_name, p.email
FROM public.profiles p
JOIN involved_users u ON u.user_id = p.user_id
WHERE COALESCE(TRIM(p.full_name),'') = ''
  AND COALESCE(TRIM(p.first_name || ' ' || p.last_name),'') = ''
ORDER BY p.user_id
LIMIT 100;

-- 10) Session linking inconsistency: how different pages would resolve the same files
WITH sample_files AS (
  SELECT sf.id AS file_id, sf.name, sf.session_id, sf.uploaded_by_id AS designer_id
  FROM public.session_files sf
  WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL) 
    AND sf.status = 'approved'
  LIMIT 10
),
admin_logic AS (
  -- How AdminFinalFiles.tsx resolves (complex session matching)
  SELECT f.file_id, f.session_id,
    COALESCE(asn.customer_id, bk.customer_id, apr.customer_id) AS customer_id,
    COALESCE(asn.designer_id, bk.designer_id, apr.designer_id) AS designer_id,
    CASE 
      WHEN asn.customer_id IS NOT NULL THEN 'active_sessions'
      WHEN bk.customer_id IS NOT NULL THEN 'bookings_via_active_sessions' 
      WHEN apr.customer_id IS NOT NULL THEN 'approval_requests'
      ELSE 'none'
    END AS source
  FROM sample_files f
  LEFT JOIN public.active_sessions asn ON asn.session_id IN (f.session_id, CONCAT('live_', f.session_id))
  LEFT JOIN public.bookings bk ON bk.id = asn.booking_id
  LEFT JOIN public.session_approval_requests apr ON apr.session_id IN (f.session_id, CONCAT('live_', f.session_id))
),
customer_logic AS (
  -- How CustomerFiles.tsx resolves (via active_sessions only)
  SELECT f.file_id, f.session_id,
    asn.customer_id,
    asn.designer_id,
    'active_sessions_only' AS source
  FROM sample_files f
  LEFT JOIN public.active_sessions asn ON asn.session_id = f.session_id
)
SELECT 'session_linking_inconsistency' AS section,
  f.file_id, f.name, f.session_id,
  a.customer_id AS admin_customer_id, a.designer_id AS admin_designer_id, a.source AS admin_source,
  c.customer_id AS customer_customer_id, c.designer_id AS customer_designer_id, c.source AS customer_source,
  CASE 
    WHEN a.customer_id IS NULL AND c.customer_id IS NOT NULL THEN 'ADMIN_MISSING_CUSTOMER'
    WHEN a.customer_id IS NOT NULL AND c.customer_id IS NULL THEN 'CUSTOMER_MISSING_CUSTOMER'
    WHEN a.designer_id IS DISTINCT FROM c.designer_id THEN 'DESIGNER_ID_MISMATCH'
    ELSE 'CONSISTENT'
  END AS inconsistency_type
FROM sample_files f
LEFT JOIN admin_logic a ON a.file_id = f.file_id
LEFT JOIN customer_logic c ON c.file_id = f.file_id;

-- 11) RLS sanity checks: list policies for referenced tables (visibility only)
SELECT 'rls_policies' AS section, schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname='public' AND tablename IN (
  'profiles','session_files','active_sessions','bookings','session_approval_requests','customer_complaints'
)
ORDER BY tablename, policyname;


