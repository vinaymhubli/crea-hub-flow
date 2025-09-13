-- Check actual table structures first

-- 1. Check profiles table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Check designers table structure  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'designers' 
ORDER BY ordinal_position;

-- 3. Check wallet_transactions table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallet_transactions' 
ORDER BY ordinal_position;
