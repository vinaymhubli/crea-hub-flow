-- Populate missing user names in profiles table
-- This script will populate first_name, last_name, and full_name columns

-- First, let's see what we have in the profiles table
SELECT id, email, first_name, last_name, full_name, role FROM public.profiles LIMIT 5;

-- Update profiles with email-based names if first_name and last_name are missing
UPDATE public.profiles 
SET 
  first_name = COALESCE(first_name, SPLIT_PART(email, '@', 1)),
  last_name = COALESCE(last_name, 'User')
WHERE first_name IS NULL OR last_name IS NULL;

-- Populate full_name column
UPDATE public.profiles 
SET full_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) 
WHERE full_name IS NULL OR full_name = '';

-- Clean up any extra spaces
UPDATE public.profiles 
SET full_name = TRIM(REGEXP_REPLACE(full_name, '\s+', ' ', 'g'))
WHERE full_name IS NOT NULL;

-- Verify the results
SELECT id, email, first_name, last_name, full_name, role FROM public.profiles LIMIT 10;
