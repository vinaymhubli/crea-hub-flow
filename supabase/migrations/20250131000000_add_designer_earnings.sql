-- Add designer earnings functions and enhance wallet system

-- Create function to get total earnings for designers
CREATE OR REPLACE FUNCTION public.get_total_earnings(user_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0.00)
  FROM public.wallet_transactions
  WHERE user_id = user_uuid 
    AND transaction_type = 'deposit' 
    AND status = 'completed'
    AND metadata->>'earnings_type' = 'session_completion';
$$;

-- Create function to get total withdrawals for designers
CREATE OR REPLACE FUNCTION public.get_total_designer_withdrawals(user_uuid UUID)
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
    AND status = 'completed'
    AND metadata->>'user_type' = 'designer';
$$;

-- Create function to get available earnings (total earnings - withdrawals)
CREATE OR REPLACE FUNCTION public.get_available_earnings(user_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      (SELECT SUM(amount) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'deposit' 
         AND status = 'completed'
         AND metadata->>'earnings_type' = 'session_completion'), 0.00
    ) - COALESCE(
      (SELECT SUM(amount) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'withdrawal' 
         AND status = 'completed'
         AND metadata->>'user_type' = 'designer'), 0.00
    );
$$;

-- Create function to get earnings history for designers
CREATE OR REPLACE FUNCTION public.get_designer_earnings_history(user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  amount DECIMAL(10,2),
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  session_id TEXT,
  customer_id TEXT,
  session_type TEXT
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
    wt.metadata->>'session_id' as session_id,
    wt.metadata->>'customer_id' as customer_id,
    wt.metadata->>'session_type' as session_type
  FROM public.wallet_transactions wt
  WHERE wt.user_id = user_uuid 
    AND wt.transaction_type = 'deposit'
    AND wt.metadata->>'earnings_type' = 'session_completion'
  ORDER BY wt.created_at DESC
  LIMIT limit_count;
$$;

-- Create function to get monthly earnings for designers
CREATE OR REPLACE FUNCTION public.get_monthly_earnings(user_uuid UUID, year INTEGER, month INTEGER)
RETURNS TABLE (
  total_earnings DECIMAL(10,2),
  session_count INTEGER,
  average_session_value DECIMAL(10,2)
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(amount), 0.00) as total_earnings,
    COUNT(*)::INTEGER as session_count,
    CASE 
      WHEN COUNT(*) > 0 THEN COALESCE(SUM(amount), 0.00) / COUNT(*)
      ELSE 0.00
    END as average_session_value
  FROM public.wallet_transactions
  WHERE user_id = user_uuid 
    AND transaction_type = 'deposit'
    AND status = 'completed'
    AND metadata->>'earnings_type' = 'session_completion'
    AND EXTRACT(YEAR FROM created_at) = year
    AND EXTRACT(MONTH FROM created_at) = month;
$$;

-- Create function to check if user can withdraw (has verified bank account)
CREATE OR REPLACE FUNCTION public.can_designer_withdraw(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bank_accounts 
    WHERE user_id = user_uuid 
    AND is_verified = true
  );
$$;

-- Create function to get designer earnings summary
CREATE OR REPLACE FUNCTION public.get_designer_earnings_summary(user_uuid UUID)
RETURNS TABLE (
  total_earnings DECIMAL(10,2),
  total_withdrawals DECIMAL(10,2),
  available_earnings DECIMAL(10,2),
  session_count INTEGER,
  this_month_earnings DECIMAL(10,2),
  has_verified_bank_account BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      (SELECT SUM(amount) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'deposit' 
         AND status = 'completed'
         AND metadata->>'earnings_type' = 'session_completion'), 0.00
    ) as total_earnings,
    COALESCE(
      (SELECT SUM(amount) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'withdrawal' 
         AND status = 'completed'
         AND metadata->>'user_type' = 'designer'), 0.00
    ) as total_withdrawals,
    COALESCE(
      (SELECT SUM(amount) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'deposit' 
         AND status = 'completed'
         AND metadata->>'earnings_type' = 'session_completion'), 0.00
    ) - COALESCE(
      (SELECT SUM(amount) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'withdrawal' 
         AND status = 'completed'
         AND metadata->>'user_type' = 'designer'), 0.00
    ) as available_earnings,
    COALESCE(
      (SELECT COUNT(*) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'deposit' 
         AND status = 'completed'
         AND metadata->>'earnings_type' = 'session_completion'), 0
    )::INTEGER as session_count,
    COALESCE(
      (SELECT SUM(amount) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'deposit' 
         AND status = 'completed'
         AND metadata->>'earnings_type' = 'session_completion'
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now())
         AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM now())), 0.00
    ) as this_month_earnings,
    EXISTS (
      SELECT 1 FROM public.bank_accounts 
      WHERE user_id = user_uuid 
      AND is_verified = true
    ) as has_verified_bank_account;
$$;

-- Create index for better performance on earnings queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_earnings_type ON public.wallet_transactions((metadata->>'earnings_type'));
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_type ON public.wallet_transactions((metadata->>'user_type'));
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_session_id ON public.wallet_transactions((metadata->>'session_id'));

-- Create function to process session completion (called by session payment function)
CREATE OR REPLACE FUNCTION public.process_session_completion(
  session_uuid UUID,
  customer_uuid UUID,
  designer_uuid UUID,
  session_amount DECIMAL(10,2),
  session_type TEXT DEFAULT 'Design Session'
)
RETURNS TABLE (
  success BOOLEAN,
  customer_transaction_id UUID,
  designer_transaction_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_txn_id UUID;
  designer_txn_id UUID;
  customer_balance DECIMAL(10,2);
BEGIN
  -- Check customer balance
  SELECT get_wallet_balance(customer_uuid) INTO customer_balance;
  
  IF customer_balance < session_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'Insufficient customer balance'::TEXT;
    RETURN;
  END IF;
  
  -- Check if session payment already processed
  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions 
    WHERE metadata->>'session_id' = session_uuid::TEXT 
    AND transaction_type = 'payment' 
    AND status = 'completed'
  ) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'Session payment already processed'::TEXT;
    RETURN;
  END IF;
  
  -- Create customer payment transaction
  INSERT INTO public.wallet_transactions (
    user_id, amount, transaction_type, status, description, metadata
  ) VALUES (
    customer_uuid, session_amount, 'payment', 'completed', 
    'Session payment - ' || session_type,
    jsonb_build_object(
      'session_id', session_uuid::TEXT,
      'designer_id', designer_uuid::TEXT,
      'session_type', session_type,
      'payment_type', 'session_completion',
      'created_at', now()::TEXT
    )
  ) RETURNING id INTO customer_txn_id;
  
  -- Create designer earnings transaction
  INSERT INTO public.wallet_transactions (
    user_id, amount, transaction_type, status, description, metadata
  ) VALUES (
    designer_uuid, session_amount, 'deposit', 'completed',
    'Session earnings - ' || session_type,
    jsonb_build_object(
      'session_id', session_uuid::TEXT,
      'customer_id', customer_uuid::TEXT,
      'session_type', session_type,
      'earnings_type', 'session_completion',
      'created_at', now()::TEXT
    )
  ) RETURNING id INTO designer_txn_id;
  
  RETURN QUERY SELECT true, customer_txn_id, designer_txn_id, NULL::TEXT;
END;
$$;





