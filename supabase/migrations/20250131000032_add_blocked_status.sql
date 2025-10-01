-- Add blocked status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE;

-- Add blocked_at timestamp
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

-- Add blocked_reason
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON public.profiles(blocked);

-- Update existing rejected designers to be blocked
UPDATE public.profiles 
SET blocked = TRUE, 
    blocked_at = NOW(),
    blocked_reason = 'Account rejected by admin'
WHERE user_id IN (
  SELECT user_id FROM public.designers 
  WHERE verification_status = 'rejected'
);

-- Add RLS policy for blocked users
CREATE POLICY "Blocked users cannot access their own data"
  ON public.profiles FOR ALL
  USING (NOT blocked OR auth.uid() != user_id);

