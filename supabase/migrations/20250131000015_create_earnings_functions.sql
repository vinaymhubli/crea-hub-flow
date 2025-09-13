-- Create RPC functions for designer earnings

-- Function to get total earnings for a designer
CREATE OR REPLACE FUNCTION get_total_earnings(designer_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) 
     FROM wallet_transactions 
     WHERE user_id = designer_user_id 
     AND transaction_type = 'deposit' 
     AND status = 'completed'), 
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly earnings for a designer
CREATE OR REPLACE FUNCTION get_monthly_earnings(designer_user_id UUID, target_month DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) 
     FROM wallet_transactions 
     WHERE user_id = designer_user_id 
     AND transaction_type = 'deposit' 
     AND status = 'completed'
     AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', target_month)), 
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get earnings history for a designer
CREATE OR REPLACE FUNCTION get_earnings_history(designer_user_id UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  amount DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wt.id,
    wt.amount,
    wt.description,
    wt.created_at,
    wt.status
  FROM wallet_transactions wt
  WHERE wt.user_id = designer_user_id 
  AND wt.transaction_type = 'deposit'
  ORDER BY wt.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_total_earnings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_earnings(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_earnings_history(UUID, INTEGER) TO authenticated;
