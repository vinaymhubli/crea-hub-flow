-- Comprehensive Fix for Admin Panel Issues
-- This script fixes both the "Unknown User" issue and ensures final files are visible

-- 1. Ensure all required columns exist in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Populate missing user names from email addresses
UPDATE public.profiles 
SET 
  first_name = COALESCE(first_name, SPLIT_PART(email, '@', 1)),
  last_name = COALESCE(last_name, 'User')
WHERE first_name IS NULL OR last_name IS NULL OR first_name = '' OR last_name = '';

-- 3. Populate full_name column
UPDATE public.profiles 
SET full_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
WHERE full_name IS NULL OR full_name = '';

-- 4. Clean up any extra spaces in full_name
UPDATE public.profiles 
SET full_name = TRIM(REGEXP_REPLACE(full_name, '\s+', ' ', 'g'))
WHERE full_name IS NOT NULL;

-- 5. Check if session_files table has the right structure
-- Add missing columns if they don't exist
ALTER TABLE public.session_files 
ADD COLUMN IF NOT EXISTS uploaded_by_type TEXT DEFAULT 'designer',
ADD COLUMN IF NOT EXISTS booking_id UUID;

-- 6. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_session_files_uploaded_by_type 
ON public.session_files(uploaded_by_type);

CREATE INDEX IF NOT EXISTS idx_session_files_booking_id 
ON public.session_files(booking_id);

-- 7. Verify the data
SELECT 
  'Profiles with names' as check_type,
  COUNT(*) as count
FROM public.profiles 
WHERE full_name IS NOT NULL AND full_name != ''

UNION ALL

SELECT 
  'Session files by designers' as check_type,
  COUNT(*) as count
FROM public.session_files 
WHERE uploaded_by_type = 'designer'

UNION ALL

SELECT 
  'Total profiles' as check_type,
  COUNT(*) as count
FROM public.profiles;

-- 8. Show sample data
-- Sample profiles
SELECT 
  'Sample profiles' as data_type,
  id, email, first_name, last_name, full_name, role
FROM public.profiles 
LIMIT 5;

-- Sample session files
SELECT 
  'Sample session files' as data_type,
  id::TEXT, name, uploaded_by_type, booking_id::TEXT, created_at::TEXT, 'N/A'
FROM public.session_files 
WHERE uploaded_by_type = 'designer'
LIMIT 5;
