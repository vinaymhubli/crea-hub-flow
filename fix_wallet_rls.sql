-- First, let's check current policies
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

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Enhanced system transactions" ON public.wallet_transactions;

-- Create comprehensive policies
CREATE POLICY "wallet_transactions_select_policy" ON public.wallet_transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallet_transactions_insert_policy" ON public.wallet_transactions
FOR INSERT WITH CHECK (
  -- Users can create transactions for themselves
  auth.uid() = user_id 
  OR
  -- Allow system-level deposits for designer payments (bypass user check for deposits)
  transaction_type = 'deposit'
);

CREATE POLICY "wallet_transactions_update_policy" ON public.wallet_transactions
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wallet_transactions_delete_policy" ON public.wallet_transactions
FOR DELETE USING (auth.uid() = user_id);

-- Verify the policies were created
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
