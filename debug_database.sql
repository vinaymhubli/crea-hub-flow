-- Debug SQL queries to check database state

-- 1. Check if earnings functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%earnings%';

-- 2. Check session_approval_requests table
SELECT COUNT(*) as approval_requests_count FROM session_approval_requests;
SELECT * FROM session_approval_requests ORDER BY created_at DESC LIMIT 5;

-- 3. Check session_files table
SELECT COUNT(*) as session_files_count FROM session_files;
SELECT * FROM session_files ORDER BY created_at DESC LIMIT 5;

-- 4. Check wallet_transactions table
SELECT COUNT(*) as wallet_transactions_count FROM wallet_transactions;
SELECT * FROM wallet_transactions ORDER BY created_at DESC LIMIT 10;

-- 5. Check active_sessions table
SELECT COUNT(*) as active_sessions_count FROM active_sessions;
SELECT * FROM active_sessions ORDER BY created_at DESC LIMIT 5;

-- 6. Test the earnings function with a sample user ID
-- Replace 'your-user-id-here' with an actual user ID from your database
SELECT get_total_earnings('137653af-050a-4ad7-8a1e-d14419a7795f'::uuid) as total_earnings;

-- 7. Check if there are any wallet transactions for the specific user
SELECT * FROM wallet_transactions 
WHERE user_id = '137653af-050a-4ad7-8a1e-d14419a7795f'::uuid
ORDER BY created_at DESC;
