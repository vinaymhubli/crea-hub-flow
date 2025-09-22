-- Update currency defaults to INR throughout the system

-- Update user_settings table default currency from USD to INR
ALTER TABLE public.user_settings 
ALTER COLUMN currency SET DEFAULT 'INR';

-- Update existing user_settings records to use INR instead of USD
UPDATE public.user_settings 
SET currency = 'INR' 
WHERE currency = 'USD';

-- Update useUserSettings hook default currency
-- This will be handled in the frontend code

-- Update platform_settings to use INR currency symbol in descriptions
UPDATE public.platform_settings 
SET platform_description = 'Real-time design collaboration platform - All transactions in Indian Rupees (₹)'
WHERE singleton = true;

-- Add currency setting to platform_settings if not exists
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'INR';

-- Update the default currency setting
UPDATE public.platform_settings 
SET default_currency = 'INR'
WHERE singleton = true;

-- Create a comment for documentation
COMMENT ON COLUMN public.user_settings.currency IS 'User preferred currency - defaults to INR (Indian Rupees)';
COMMENT ON COLUMN public.platform_settings.default_currency IS 'Platform default currency - set to INR for Indian market';
