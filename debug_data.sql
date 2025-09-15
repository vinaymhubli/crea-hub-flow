-- Debug script to see what data exists
-- Run this to understand why files and user names aren't showing

-- 1. Check profiles table structure and data
SELECT 
  'PROFILES TABLE' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Check session_files table structure
SELECT 
  'SESSION_FILES TABLE' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'session_files' 
ORDER BY ordinal_position;

-- 3. Sample profiles data
SELECT 
  'SAMPLE PROFILES' as data_type,
  id, user_id, email, first_name, last_name, full_name, role
FROM public.profiles 
LIMIT 10;

-- 4. Sample session_files data
SELECT 
  'SAMPLE SESSION FILES' as data_type,
  id, name, uploaded_by_id, uploaded_by_type, booking_id, created_at
FROM public.session_files 
LIMIT 10;

-- 5. Count of files by uploader type
SELECT 
  'FILES BY TYPE' as data_type,
  uploaded_by_type, 
  COUNT(*) as count
FROM public.session_files 
GROUP BY uploaded_by_type;

-- 6. Check if there are any files uploaded by designers
SELECT 
  'DESIGNER FILES' as data_type,
  COUNT(*) as total_files,
  COUNT(DISTINCT uploaded_by_id) as unique_designers
FROM public.session_files 
WHERE uploaded_by_type = 'designer' OR uploaded_by_type IS NULL;
