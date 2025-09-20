-- Simple debug: Show session ID mismatches between files and active_sessions

-- 1) Show session IDs in session_files
SELECT 'session_files_session_ids' AS section, session_id, COUNT(*) as file_count
FROM public.session_files 
WHERE (uploaded_by_type = 'designer' OR uploaded_by_type IS NULL) 
  AND status = 'approved'
GROUP BY session_id
ORDER BY session_id;

-- 2) Show session IDs in active_sessions  
SELECT 'active_sessions_session_ids' AS section, session_id, customer_id, designer_id
FROM public.active_sessions
ORDER BY session_id;

-- 3) Show the exact mismatch - files that can't find their session
SELECT 'mismatch_debug' AS section,
  sf.session_id AS file_session_id,
  sf.name AS file_name,
  asn.session_id AS active_session_id,
  asn.customer_id,
  asn.designer_id,
  CASE 
    WHEN asn.session_id IS NULL THEN 'NO_MATCH'
    ELSE 'MATCHED'
  END AS status
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.session_id = sf.session_id
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL) 
  AND sf.status = 'approved'
ORDER BY sf.created_at DESC
LIMIT 20;
