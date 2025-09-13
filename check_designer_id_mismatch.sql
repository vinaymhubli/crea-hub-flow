-- Check if there's a designer ID mismatch
-- Designer ID from console: 4cbfb2f4-0865-4555-9320-9b582c3d7bb9

-- 1. Check if this ID exists in profiles table
SELECT 'Profile Check' as test, id, email, full_name, role 
FROM profiles 
WHERE id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';

-- 2. Check if this ID exists in designers table as user_id
SELECT 'Designer Check' as test, id, user_id, specialty 
FROM designers 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';

-- 3. Check session approval requests for this designer
SELECT 'Session Approval Requests' as test, 
       session_id, designer_id, customer_id, status, total_amount, created_at
FROM session_approval_requests 
WHERE designer_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'
ORDER BY created_at DESC;

-- 4. Check if there are any wallet transactions for this user
SELECT 'Wallet Transactions' as test,
       COUNT(*) as count,
       SUM(CASE WHEN transaction_type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END) as total_deposits
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';

-- 5. Show all wallet transactions for this user
SELECT 'All Transactions' as test,
       id, transaction_type, amount, status, description, created_at
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'
ORDER BY created_at DESC;
