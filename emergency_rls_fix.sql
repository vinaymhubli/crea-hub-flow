-- Emergency RLS fix for wallet_transactions
-- This will temporarily disable RLS to allow all operations

-- First check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'wallet_transactions';

-- Temporarily disable RLS entirely on wallet_transactions
ALTER TABLE public.wallet_transactions DISABLE ROW LEVEL SECURITY;

-- Check again to confirm RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'wallet_transactions';

-- Show current policies (should still exist but won't be enforced)
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'wallet_transactions' AND schemaname = 'public';
