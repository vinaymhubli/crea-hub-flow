-- Test to check session ID mismatches between approval requests and session files

-- 1. Get all unique session IDs from approval requests
SELECT '=== UNIQUE SESSION IDs FROM APPROVAL REQUESTS ===' as section;
SELECT DISTINCT session_id 
FROM session_approval_requests 
ORDER BY session_id;

-- 2. Get all unique session IDs from session files
SELECT '=== UNIQUE SESSION IDs FROM SESSION FILES ===' as section;
SELECT DISTINCT session_id 
FROM session_files 
ORDER BY session_id;

-- 3. Find session IDs that exist in approval requests but NOT in session files
SELECT '=== SESSION IDs IN APPROVAL REQUESTS BUT NOT IN SESSION FILES ===' as section;
SELECT DISTINCT sar.session_id
FROM session_approval_requests sar
LEFT JOIN session_files sf ON sar.session_id = sf.session_id
WHERE sf.session_id IS NULL
ORDER BY sar.session_id;

-- 4. Check if there are any session files with different session ID formats
SELECT '=== ALL SESSION FILES WITH DETAILS ===' as section;
SELECT 
    id,
    session_id,
    name,
    uploaded_by,
    uploaded_by_type,
    uploaded_by_id,
    status,
    created_at
FROM session_files 
ORDER BY created_at DESC;

-- 5. Check the most recent approval requests to see their session IDs
SELECT '=== MOST RECENT APPROVAL REQUESTS ===' as section;
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
LIMIT 5;
