-- Quick Fix for Admin Panel Issues
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Populate user names from email addresses
UPDATE public.profiles 
SET 
  first_name = COALESCE(first_name, SPLIT_PART(email, '@', 1)),
  last_name = COALESCE(last_name, 'User')
WHERE first_name IS NULL OR last_name IS NULL OR first_name = '' OR last_name = '';

-- 3. Create full_name from first_name and last_name
UPDATE public.profiles 
SET full_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
WHERE full_name IS NULL OR full_name = '';

-- 4. Clean up extra spaces
UPDATE public.profiles 
SET full_name = TRIM(REGEXP_REPLACE(full_name, '\s+', ' ', 'g'))
WHERE full_name IS NOT NULL;

-- 5. Add missing columns to session_files table
ALTER TABLE public.session_files 
ADD COLUMN IF NOT EXISTS uploaded_by_type TEXT DEFAULT 'designer',
ADD COLUMN IF NOT EXISTS booking_id UUID;

-- 6. Update existing session_files to have uploaded_by_type = 'designer'
UPDATE public.session_files 
SET uploaded_by_type = 'designer'
WHERE uploaded_by_type IS NULL;

-- 7. Verify the fixes
SELECT 'Profiles with names' as check_type, COUNT(*) as count
FROM public.profiles 
WHERE full_name IS NOT NULL AND full_name != '';

SELECT 'Session files by designers' as check_type, COUNT(*) as count
FROM public.session_files 
WHERE uploaded_by_type = 'designer';

-- 8. Show sample data
SELECT 'Sample profiles' as data_type, id, email, first_name, last_name, full_name, role
FROM public.profiles 
LIMIT 5;

SELECT 'Sample session files' as data_type, id, name, uploaded_by_type, booking_id, created_at
FROM public.session_files 
WHERE uploaded_by_type = 'designer'
LIMIT 5;
