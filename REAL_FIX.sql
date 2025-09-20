-- REAL FIX: Update the existing active session to match file session_ids
-- The constraint allows only 1 session per designer, so update the existing one

-- 1) Show current active session
SELECT 'current_active_session' AS section,
  session_id,
  customer_id,
  designer_id
FROM public.active_sessions
WHERE designer_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';

-- 2) Update the existing session_id to match one of the file session_ids
-- Use the most recent file's session_id
UPDATE public.active_sessions 
SET session_id = '1757911070846_odrdsodut',
    updated_at = NOW()
WHERE designer_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';

-- 3) Verify the update
SELECT 'updated_active_session' AS section,
  session_id,
  customer_id,
  designer_id
FROM public.active_sessions
WHERE designer_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';


