-- Simple test to check designer earnings
-- Designer ID: 4cbfb2f4-0865-4555-9320-9b582c3d7bb9

-- 1. Check if any wallet transactions exist for this designer
SELECT 
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'
AND transaction_type = 'deposit'
AND status = 'completed';

-- 2. Check all wallet transactions for this designer (with details)
SELECT 
  id,
  amount,
  transaction_type,
  status,
  description,
  created_at
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'
ORDER BY created_at DESC;

-- 3. Test the RPC function
SELECT get_total_earnings('4cbfb2f4-0865-4555-9320-9b582c3d7bb9') as total_earnings;
