-- Comprehensive Database Test Script
-- Run this in Supabase SQL Editor to diagnose the issues

-- 1. Check all tables and their record counts
SELECT 'session_approval_requests' as table_name, COUNT(*) as record_count FROM session_approval_requests
UNION ALL
SELECT 'session_files' as table_name, COUNT(*) as record_count FROM session_files
UNION ALL
SELECT 'wallet_transactions' as table_name, COUNT(*) as record_count FROM wallet_transactions
UNION ALL
SELECT 'active_sessions' as table_name, COUNT(*) as record_count FROM active_sessions;

-- 2. Check session_approval_requests details
SELECT '=== SESSION APPROVAL REQUESTS ===' as section;
SELECT 
    id,
    session_id,
    customer_id,
    designer_id,
    status,
    total_amount,
    created_at
FROM session_approval_requests 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check session_files details
SELECT '=== SESSION FILES ===' as section;
SELECT 
    id,
    session_id,
    booking_id,
    name,
    uploaded_by,
    uploaded_by_type,
    uploaded_by_id,
    file_url,
    status,
    created_at
FROM session_files 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check wallet_transactions for both users
SELECT '=== WALLET TRANSACTIONS - CUSTOMER ===' as section;
SELECT 
    id,
    user_id,
    transaction_type,
    amount,
    description,
    status,
    created_at
FROM wallet_transactions 
WHERE user_id = '137653af-050a-4ad7-8a1e-d14419a7795f'::uuid
ORDER BY created_at DESC;

SELECT '=== WALLET TRANSACTIONS - DESIGNER ===' as section;
SELECT 
    id,
    user_id,
    transaction_type,
    amount,
    description,
    status,
    created_at
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'::uuid
ORDER BY created_at DESC;

-- 5. Test earnings function for both users
SELECT '=== EARNINGS FUNCTION TEST ===' as section;
SELECT 
    'customer' as user_type,
    get_total_earnings('137653af-050a-4ad7-8a1e-d14419a7795f'::uuid) as total_earnings
UNION ALL
SELECT 
    'designer' as user_type,
    get_total_earnings('4cbfb2f4-0865-4555-9320-9b582c3d7bb9'::uuid) as total_earnings;

-- 6. Check if there are any session_files with the specific session IDs
SELECT '=== SESSION FILES FOR SPECIFIC SESSIONS ===' as section;
SELECT 
    sf.id,
    sf.session_id,
    sf.name,
    sf.uploaded_by,
    sf.uploaded_by_type,
    sf.status,
    sf.created_at
FROM session_files sf
WHERE sf.session_id IN (
    'live_1757756499256_2hrfz4i9h',
    'live_1757757455520_uds84aa3i',
    'live_1757757698312_0qn3946mo'
)
ORDER BY sf.created_at DESC;

-- 7. Check active_sessions for these session IDs
SELECT '=== ACTIVE SESSIONS ===' as section;
SELECT 
    id,
    session_id,
    customer_id,
    designer_id,
    status,
    booking_id,
    created_at,
    ended_at
FROM active_sessions 
WHERE session_id IN (
    'live_1757756499256_2hrfz4i9h',
    'live_1757757455520_uds84aa3i',
    'live_1757757698312_0qn3946mo'
)
ORDER BY created_at DESC;

-- 8. Check if there are any deposit transactions for the designer
SELECT '=== DESIGNER DEPOSIT TRANSACTIONS ===' as section;
SELECT 
    id,
    user_id,
    transaction_type,
    amount,
    description,
    status,
    created_at
FROM wallet_transactions 
WHERE user_id = '4cbfb2f4-0865-4555-9320-9b582c3d7bb9'::uuid
AND transaction_type = 'deposit'
ORDER BY created_at DESC;

-- 9. Check if there are any payment transactions that should have created designer deposits
SELECT '=== PAYMENT TRANSACTIONS THAT SHOULD CREATE DESIGNER DEPOSITS ===' as section;
SELECT 
    wt.id,
    wt.user_id,
    wt.transaction_type,
    wt.amount,
    wt.description,
    wt.status,
    wt.created_at
FROM wallet_transactions wt
WHERE wt.transaction_type = 'payment'
AND wt.description LIKE '%session%'
ORDER BY wt.created_at DESC
LIMIT 10;
