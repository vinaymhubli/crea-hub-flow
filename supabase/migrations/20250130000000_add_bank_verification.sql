-- Create bank_account_verifications table for OTP and verification tracking
CREATE TABLE IF NOT EXISTS public.bank_account_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  otp VARCHAR(10),
  method VARCHAR(50) NOT NULL CHECK (method IN ('sms', 'email', 'bank_api', 'micro_deposit')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_account_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for bank account verifications
CREATE POLICY "Users can view their own bank account verifications" 
ON public.bank_account_verifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts 
    WHERE bank_accounts.id = bank_account_verifications.bank_account_id 
    AND bank_accounts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own bank account verifications" 
ON public.bank_account_verifications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bank_accounts 
    WHERE bank_accounts.id = bank_account_verifications.bank_account_id 
    AND bank_accounts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own bank account verifications" 
ON public.bank_account_verifications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts 
    WHERE bank_accounts.id = bank_account_verifications.bank_account_id 
    AND bank_accounts.user_id = auth.uid()
  )
);

-- Add verification fields to bank_accounts table
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50) CHECK (verification_method IN ('auto', 'otp', 'manual'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bank_account_verifications_updated_at
  BEFORE UPDATE ON public.bank_account_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bank_account_verifications_bank_account_id ON public.bank_accounts(id);
CREATE INDEX IF NOT EXISTS idx_bank_account_verifications_status ON public.bank_account_verifications(status);
CREATE INDEX IF NOT EXISTS idx_bank_account_verifications_expires_at ON public.bank_account_verifications(expires_at);

-- Create function to clean up expired verifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.bank_account_verifications 
  SET status = 'expired' 
  WHERE status = 'pending' 
  AND expires_at < now();
$$;

-- Create function to get verification status
CREATE OR REPLACE FUNCTION public.get_bank_account_verification_status(account_uuid UUID)
RETURNS TABLE (
  is_verified BOOLEAN,
  verification_method VARCHAR(50),
  verified_at TIMESTAMP WITH TIME ZONE,
  pending_verification BOOLEAN,
  verification_expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    ba.is_verified,
    ba.verification_method,
    ba.verified_at,
    CASE WHEN bav.id IS NOT NULL AND bav.status = 'pending' THEN true ELSE false END as pending_verification,
    bav.expires_at as verification_expires_at
  FROM public.bank_accounts ba
  LEFT JOIN public.bank_account_verifications bav ON ba.id = bav.bank_account_id AND bav.status = 'pending'
  WHERE ba.id = account_uuid;
$$;

-- Create function to check if user can verify account
CREATE OR REPLACE FUNCTION public.can_verify_bank_account(account_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bank_accounts 
    WHERE id = account_uuid 
    AND user_id = user_uuid 
    AND is_verified = false
  );
$$;





