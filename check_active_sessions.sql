-- Check what's in active_sessions table
SELECT 
  session_id, 
  customer_id, 
  designer_id, 
  created_at
FROM public.active_sessions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check session_files table
SELECT 
  session_id, 
  name, 
  uploaded_by_type, 
  status,
  created_at
FROM public.session_files 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any matches
SELECT 
  sf.session_id as file_session_id,
  sf.name,
  sf.uploaded_by_type,
  sf.status,
  as.session_id as active_session_id,
  as.customer_id,
  as.designer_id
FROM public.session_files sf
LEFT JOIN public.active_sessions as ON (
  as.session_id = sf.session_id OR 
  as.session_id = CONCAT('live_', sf.session_id) OR
  as.session_id = REPLACE(sf.session_id, 'live_', '')
)
WHERE sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL
ORDER BY sf.created_at DESC
LIMIT 10;
