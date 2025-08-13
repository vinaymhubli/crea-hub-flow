-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.get_wallet_balance(user_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type IN ('deposit', 'refund') THEN amount
      WHEN transaction_type IN ('payment', 'withdrawal') THEN -amount
      ELSE 0
    END
  ), 0.00)
  FROM public.wallet_transactions
  WHERE user_id = user_uuid AND status = 'completed';
$$;

-- Create a function to get current user role for RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;