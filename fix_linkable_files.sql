-- Fix the 2 files that have session_approval_requests
-- This will reduce the "No Session Data" count from 14 to 12

-- 1) Add active_sessions for the 2 linkable files
INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
SELECT 
  sar.session_id,
  sar.customer_id,
  sar.designer_id,
  sar.created_at,
  NOW() as updated_at
FROM public.session_approval_requests sar
WHERE sar.session_id IN ('1757756770687_2x5egm2sg', '1757757455520_uds84aa3i')
  AND sar.customer_id IS NOT NULL
  AND sar.designer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.active_sessions asn 
    WHERE asn.session_id = sar.session_id
  )
ON CONFLICT (session_id) DO NOTHING;

-- 2) Verify they were added
SELECT 'newly_added_sessions' AS section,
  session_id,
  customer_id,
  designer_id
FROM public.active_sessions
WHERE session_id IN ('1757756770687_2x5egm2sg', '1757757455520_uds84aa3i');


