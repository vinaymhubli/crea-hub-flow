-- Make the existing user with email 'viaan9885@gmail.com' an admin for testing
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'viaan9885@gmail.com';