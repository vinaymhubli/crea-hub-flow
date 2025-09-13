SELECT 
    policyname, 
    cmd, 
    permissive, 
    roles, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'wallet_transactions' 
AND schemaname = 'public';
