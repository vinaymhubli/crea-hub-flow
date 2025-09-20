-- Check what's ACTUALLY in the database right now
-- Don't overthink it, just see what exists

-- 1) All active_sessions currently in database
SELECT 'all_active_sessions' AS section,
  session_id,
  customer_id,
  designer_id
FROM public.active_sessions
ORDER BY created_at DESC;

-- 2) All session_approval_requests currently in database  
SELECT 'all_session_approval_requests' AS section,
  session_id,
  customer_id,
  designer_id,
  status
FROM public.session_approval_requests
ORDER BY created_at DESC;

-- 3) Sample of the exact files that are failing (the 14 files from console)
SELECT 'failing_files' AS section,
  sf.session_id,
  sf.name,
  sf.uploaded_by_id as designer_id,
  sf.status
FROM public.session_files sf
WHERE sf.session_id IN (
  '1757911070846_odrdsodut', '1757769775105_ij94si3o8', '1757769525975_4r12k6lf4',
  '1757769122187_d9vf4qpdr', '1757768407799_5fbq76mg2', '1757767991367_wz1oyeshc',
  '1757767715504_1bgta7ima', '1757767079478_6g6w3ztxw', '1757766766302_bcxhl8dz2',
  '1757760675284_a4e9hrxdr', '1757758985399_s9oqto12v', '1757757698312_0qn3946mo',
  '1757757455520_uds84aa3i', '1757756770687_2x5egm2sg'
)
ORDER BY sf.session_id;


