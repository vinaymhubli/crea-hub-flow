-- Comprehensive debug for designer earnings issue
-- Designer ID from console: 4cbfb2f4-0865-4555-9320-9b582c3d7bb9

-- 1. Check if designer exists in profiles table
SELECT 'Designer Profile Check' as test_name, 
       id, email, full_name, role 
FROM profiles 
WHERE id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';

-- 2. Check if designer exists in designers table
SELECT 'Designer Record Check' as test_name,
       id, user_id, specialty, hourly_rate
FROM designers 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';

-- 3. Check ALL wallet transactions for this designer
SELECT 'Designer Wallet Transactions' as test_name,
       COUNT(*) as total_count,
       COUNT(CASE WHEN transaction_type = 'deposit' THEN 1 END) as deposit_count,
       COUNT(CASE WHEN transaction_type = 'payment' THEN 1 END) as payment_count,
       SUM(CASE WHEN transaction_type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END) as total_deposits
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';

-- 4. Show all wallet transactions for this designer with details
SELECT 'All Designer Transactions' as test_name,
       id, transaction_type, amount, status, description, created_at
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'
ORDER BY created_at DESC;

-- 5. Test the get_total_earnings function
SELECT 'RPC Function Test' as test_name,
       get_total_earnings('4cbfb2f4-0865-4555-9320-9b582c3d7bb9') as total_earnings;

-- 6. Check if there are ANY wallet transactions at all
SELECT 'All Wallet Transactions Count' as test_name,
       COUNT(*) as total_transactions,
       COUNT(DISTINCT user_id) as unique_users
FROM wallet_transactions;

-- 7. Show recent wallet transactions (last 10)
SELECT 'Recent Transactions' as test_name,
       user_id, transaction_type, amount, status, description, created_at
FROM wallet_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- 8. Check if there are any active sessions for this designer
SELECT 'Active Sessions for Designer' as test_name,
       session_id, customer_id, designer_id, status, created_at
FROM active_sessions 
WHERE designer_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'
ORDER BY created_at DESC;

-- 9. Check session approval requests for this designer
SELECT 'Session Approval Requests' as test_name,
       session_id, customer_id, designer_id, status, created_at
FROM session_approval_requests 
WHERE designer_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'
ORDER BY created_at DESC;
