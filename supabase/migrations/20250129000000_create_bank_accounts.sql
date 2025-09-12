-- Create bank_accounts table for withdrawal functionality
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  account_type VARCHAR(50) DEFAULT 'savings' CHECK (account_type IN ('savings', 'current', 'salary')),
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for bank accounts
CREATE POLICY "Users can view their own bank accounts" 
ON public.bank_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank accounts" 
ON public.bank_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts" 
ON public.bank_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts" 
ON public.bank_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_primary ON public.bank_accounts(user_id, is_primary) WHERE is_primary = true;

-- Add withdrawal transaction type to wallet_transactions if not exists
-- (This should already exist from previous migrations, but adding for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wallet_transactions_transaction_type_check' 
    AND contype = 'c'
  ) THEN
    ALTER TABLE public.wallet_transactions 
    ADD CONSTRAINT wallet_transactions_transaction_type_check 
    CHECK (transaction_type IN ('deposit', 'payment', 'refund', 'withdrawal'));
  END IF;
END $$;

-- Create function to get withdrawal history
CREATE OR REPLACE FUNCTION public.get_withdrawal_history(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  amount DECIMAL(10,2),
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  bank_details JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    wt.id,
    wt.amount,
    wt.description,
    wt.status,
    wt.created_at,
    wt.metadata->'bank_details' as bank_details
  FROM public.wallet_transactions wt
  WHERE wt.user_id = user_uuid 
    AND wt.transaction_type = 'withdrawal'
  ORDER BY wt.created_at DESC
  LIMIT limit_count;
$$;

-- Create function to get total withdrawals
CREATE OR REPLACE FUNCTION public.get_total_withdrawals(user_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0.00)
  FROM public.wallet_transactions
  WHERE user_id = user_uuid 
    AND transaction_type = 'withdrawal' 
    AND status = 'completed';
$$;
