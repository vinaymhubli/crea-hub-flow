-- Debug designer earnings issue
-- Designer ID from console: 4cbfb2f4-0865-4555-9320-9b582c3d7bb9

-- 1. Check all wallet transactions for this designer
SELECT 
  'Wallet Transactions' as check_type,
  id,
  user_id,
  amount,
  transaction_type,
  description,
  created_at
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'
ORDER BY created_at DESC;

-- 2. Check if designer exists in designers table
SELECT 
  'Designer Record' as check_type,
  user_id,
  average_rating,
  created_at
FROM designers 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';

-- 3. Test the get_total_earnings function directly
SELECT 
  'RPC Function Test' as check_type,
  get_total_earnings('4cbfb2f4-0865-4555-9320-9b582c3d7bb9') as total_earnings;

-- 4. Check all wallet transactions (to see if any exist at all)
SELECT 
  'All Wallet Transactions' as check_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9' THEN 1 END) as designer_count
FROM wallet_transactions;

-- 5. Check recent wallet transactions (last 10)
SELECT 
  'Recent Transactions' as check_type,
  user_id,
  amount,
  transaction_type,
  description,
  created_at
FROM wallet_transactions 
ORDER BY created_at DESC 
LIMIT 10;
