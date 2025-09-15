-- Fix Admin Issues
-- This script fixes the 404 errors and "Unknown User" issues

-- 1. First, run the migration to create missing functions and columns
-- (This should be done via: npx supabase db push)

-- 2. Populate missing user names in profiles table
UPDATE public.profiles 
SET 
  first_name = COALESCE(first_name, SPLIT_PART(email, '@', 1)),
  last_name = COALESCE(last_name, 'User')
WHERE first_name IS NULL OR last_name IS NULL;

-- 3. Populate full_name column
UPDATE public.profiles 
SET full_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
WHERE full_name IS NULL OR full_name = '';

-- 4. Clean up any extra spaces
UPDATE public.profiles 
SET full_name = TRIM(REGEXP_REPLACE(full_name, '\s+', ' ', 'g'))
WHERE full_name IS NOT NULL;

-- 5. Verify the results
SELECT id, email, first_name, last_name, full_name, role FROM public.profiles LIMIT 10;
