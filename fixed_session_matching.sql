-- Fixed SQL query to check session matching (without reserved word 'as')
SELECT 
  sf.session_id as file_session_id,
  sf.name,
  sf.uploaded_by_type,
  sf.status,
  act_sess.session_id as active_session_id,
  act_sess.customer_id,
  act_sess.designer_id
FROM public.session_files sf
LEFT JOIN public.active_sessions act_sess ON (
  act_sess.session_id = sf.session_id OR 
  act_sess.session_id = CONCAT('live_', sf.session_id) OR
  act_sess.session_id = REPLACE(sf.session_id, 'live_', '')
)
WHERE sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL
ORDER BY sf.created_at DESC
LIMIT 10;
