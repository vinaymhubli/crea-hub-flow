-- Add missing active_sessions for the specific file session_ids that are failing

-- 1) Show which file session_ids have no corresponding active_sessions
SELECT 'files_without_active_sessions' AS section,
  sf.session_id,
  COUNT(*) as file_count,
  STRING_AGG(sf.name, ', ') as file_names
FROM public.session_files sf
LEFT JOIN public.active_sessions asn ON asn.session_id = sf.session_id OR asn.session_id = CONCAT('live_', sf.session_id)
WHERE (sf.uploaded_by_type = 'designer' OR sf.uploaded_by_type IS NULL)
  AND sf.status = 'approved'
  AND asn.session_id IS NULL  -- No matching active session
  AND sf.session_id IN (
    '1757911070846_odrdsodut', '1757769775105_ij94si3o8', '1757769525975_4r12k6lf4',
    '1757769122187_d9vf4qpdr', '1757768407799_5fbq76mg2', '1757767991367_wz1oyeshc',
    '1757767715504_1bgta7ima', '1757767079478_6g6w3ztxw', '1757766766302_bcxhl8dz2',
    '1757760675284_a4e9hrxdr', '1757758985399_s9oqto12v', '1757757698312_0qn3946mo',
    '1757757455520_uds84aa3i', '1757756770687_2x5egm2sg'
  )
GROUP BY sf.session_id
ORDER BY sf.session_id;

-- 2) Find corresponding session_approval_requests for these session_ids
SELECT 'matching_approval_requests' AS section,
  sar.session_id,
  sar.customer_id,
  sar.designer_id,
  sar.status,
  'NEEDS_ACTIVE_SESSION' as action
FROM public.session_approval_requests sar
WHERE sar.session_id IN (
    '1757911070846_odrdsodut', '1757769775105_ij94si3o8', '1757769525975_4r12k6lf4',
    '1757769122187_d9vf4qpdr', '1757768407799_5fbq76mg2', '1757767991367_wz1oyeshc',
    '1757767715504_1bgta7ima', '1757767079478_6g6w3ztxw', '1757766766302_bcxhl8dz2',
    '1757760675284_a4e9hrxdr', '1757758985399_s9oqto12v', '1757757698312_0qn3946mo',
    '1757757455520_uds84aa3i', '1757756770687_2x5egm2sg'
  )
  AND sar.customer_id IS NOT NULL
  AND sar.designer_id IS NOT NULL
ORDER BY sar.session_id;

-- 3) SAFE INSERT - Add only the missing sessions for these specific files
-- Use ON CONFLICT to handle any existing data safely
INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
SELECT 
  sar.session_id,
  sar.customer_id,
  sar.designer_id,
  sar.created_at,
  NOW() as updated_at
FROM public.session_approval_requests sar
WHERE sar.session_id IN (
    '1757911070846_odrdsodut', '1757769775105_ij94si3o8', '1757769525975_4r12k6lf4',
    '1757769122187_d9vf4qpdr', '1757768407799_5fbq76mg2', '1757767991367_wz1oyeshc',
    '1757767715504_1bgta7ima', '1757767079478_6g6w3ztxw', '1757766766302_bcxhl8dz2',
    '1757760675284_a4e9hrxdr', '1757758985399_s9oqto12v', '1757757698312_0qn3946mo',
    '1757757455520_uds84aa3i', '1757756770687_2x5egm2sg'
  )
  AND sar.customer_id IS NOT NULL
  AND sar.designer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.active_sessions asn 
    WHERE asn.session_id = sar.session_id
  )
ON CONFLICT (session_id) DO NOTHING;

-- 4) Verify the fix
SELECT 'verification_active_sessions_added' AS section,
  session_id,
  customer_id,
  designer_id,
  'NEWLY_ADDED' as status
FROM public.active_sessions
WHERE session_id IN (
    '1757911070846_odrdsodut', '1757769775105_ij94si3o8', '1757769525975_4r12k6lf4',
    '1757769122187_d9vf4qpdr', '1757768407799_5fbq76mg2', '1757767991367_wz1oyeshc',
    '1757767715504_1bgta7ima', '1757767079478_6g6w3ztxw', '1757766766302_bcxhl8dz2',
    '1757760675284_a4e9hrxdr', '1757758985399_s9oqto12v', '1757757698312_0qn3946mo',
    '1757757455520_uds84aa3i', '1757756770687_2x5egm2sg'
  )
ORDER BY session_id;


