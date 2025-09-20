-- FINAL FIX: Create active_sessions for all the file session_ids
-- Use the existing customer/designer from the working session

-- First, let's see what customer/designer we should use
SELECT 'existing_session_info' AS section,
  customer_id,
  designer_id
FROM public.active_sessions
WHERE session_id = 'live_1757602102189_8yx9t6ji9';

-- Now create active_sessions for ALL the file session_ids using the same customer/designer
INSERT INTO public.active_sessions (session_id, customer_id, designer_id, created_at, updated_at)
SELECT 
  file_session_id,
  '137653af-050a-4ad7-8a1e-d14419a7795f' as customer_id, -- Use existing customer
  '4cbfb2f4-0865-4555-9320-9b582c3d7bb9' as designer_id,  -- Use existing designer
  NOW() as created_at,
  NOW() as updated_at
FROM (
  VALUES 
    ('1757911070846_odrdsodut'),
    ('1757769775105_ij94si3o8'),
    ('1757769525975_4r12k6lf4'),
    ('1757769122187_d9vf4qpdr'),
    ('1757768407799_5fbq76mg2'),
    ('1757767991367_wz1oyeshc'),
    ('1757767715504_1bgta7ima'),
    ('1757767079478_6g6w3ztxw'),
    ('1757766766302_bcxhl8dz2'),
    ('1757760675284_a4e9hrxdr'),
    ('1757758985399_s9oqto12v'),
    ('1757757698312_0qn3946mo'),
    ('1757757455520_uds84aa3i'),
    ('1757756770687_2x5egm2sg')
) AS files(file_session_id)
ON CONFLICT (session_id) DO NOTHING;

-- Verify all sessions are now created
SELECT 'verification_all_sessions_added' AS section,
  COUNT(*) as total_active_sessions
FROM public.active_sessions;


