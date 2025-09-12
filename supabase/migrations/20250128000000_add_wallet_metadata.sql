-- Add metadata column to wallet_transactions table for storing additional payment information
ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index on metadata for better query performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_metadata 
ON public.wallet_transactions USING GIN (metadata);

-- Add index on transaction_type for better filtering
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type 
ON public.wallet_transactions (transaction_type);

-- Add index on status for better filtering
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status 
ON public.wallet_transactions (status);

-- Create function to get wallet balance with better performance
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

-- Create function to check if user has sufficient balance
CREATE OR REPLACE FUNCTION public.check_sufficient_balance(user_uuid UUID, required_amount DECIMAL(10,2))
RETURNS BOOLEAN
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
  ), 0.00) >= required_amount
  FROM public.wallet_transactions
  WHERE user_id = user_uuid AND status = 'completed';
$$;

-- Create function to get recent transactions
CREATE OR REPLACE FUNCTION public.get_recent_transactions(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  transaction_type TEXT,
  amount DECIMAL(10,2),
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    wt.id,
    wt.transaction_type,
    wt.amount,
    wt.description,
    wt.status,
    wt.created_at,
    wt.metadata
  FROM public.wallet_transactions wt
  WHERE wt.user_id = user_uuid
  ORDER BY wt.created_at DESC
  LIMIT limit_count;
$$;
