-- Complete designer earnings debug - Designer ID: 4cbfb2f4-0865-4555-9320-9b582c3d7bb9

-- 1. Check if designer exists in profiles table
SELECT '1. Designer Profile' as check_type, 
       user_id::text as id, email, first_name, last_name, user_type, role
FROM profiles 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'

UNION ALL

-- 2. Check if designer exists in designers table
SELECT '2. Designer Record' as check_type,
       user_id::text, specialty, hourly_rate::text, 'null' as extra1, 'null' as extra2, 'null' as extra3
FROM designers 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'

UNION ALL

-- 3. Check wallet transactions count and total
SELECT '3. Wallet Summary' as check_type,
       COUNT(*)::text as total_transactions,
       SUM(CASE WHEN transaction_type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END)::text as total_deposits,
       'null' as extra1, 'null' as extra2, 'null' as extra3, 'null' as extra4
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'

UNION ALL

-- 4. Test RPC function
SELECT '4. RPC Function' as check_type,
       get_total_earnings('4cbfb2f4-0865-4555-9320-9b582c3d7bb9')::text as total_earnings,
       'null' as extra1, 'null' as extra2, 'null' as extra3, 'null' as extra4, 'null' as extra5
FROM (SELECT 1) as dummy

UNION ALL

-- 5. Show all wallet transactions for this designer
SELECT '5. Transaction' as check_type,
       transaction_type, amount::text, status, description, 'null' as extra1, 'null' as extra2
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9';
