-- Fix Customer Complaint Submission Issues

-- 1. Check if customer_complaints table exists and has correct structure
SELECT 
  'customer_complaints table check' as check_type,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'customer_complaints' 
ORDER BY ordinal_position;

-- 2. Check if the table has any data
SELECT 
  'customer_complaints data check' as check_type,
  COUNT(*) as total_complaints
FROM public.customer_complaints;

-- 3. Check if send_notification function exists
SELECT 
  'send_notification function check' as check_type,
  routine_name, 
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'send_notification';

-- 4. Test inserting a sample complaint (this will help identify the exact error)
-- Note: This will fail if the table doesn't exist, but will show the exact error
INSERT INTO public.customer_complaints (
  session_id,
  booking_id,
  customer_id,
  designer_id,
  file_id,
  complaint_type,
  title,
  description,
  status,
  priority
) VALUES (
  'test_session_123',
  NULL,
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'other',
  'Test Complaint',
  'This is a test complaint',
  'pending',
  'medium'
);

-- 5. If the above insert works, delete the test record
DELETE FROM public.customer_complaints 
WHERE title = 'Test Complaint' AND session_id = 'test_session_123';
