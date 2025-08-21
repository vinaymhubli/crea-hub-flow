-- Create a pre-confirmed admin user directly
-- First, let's update the existing admin@demo.com user to be confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = '',
  role = 'authenticated'
WHERE email = 'admin@demo.com';

-- Also update the other emails that were created
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = '',
  role = 'authenticated'
WHERE email IN ('lnvb200@gmail.com', 'viaan9885@gmail.com');

-- Make sure all these users are admin in profiles
UPDATE public.profiles 
SET is_admin = true 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@demo.com', 'lnvb200@gmail.com', 'viaan9885@gmail.com')
);