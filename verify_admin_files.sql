-- Verify Admin Final Files - Check if showing correct approved designer files

-- 1. Count total session files
SELECT 'Total session files' as check_type, COUNT(*) as count
FROM public.session_files;

-- 2. Count files uploaded by designers
SELECT 'Files uploaded by designers' as check_type, COUNT(*) as count
FROM public.session_files 
WHERE uploaded_by_type = 'designer' OR uploaded_by_type IS NULL;

-- 3. Count approved designer files (what admin should see)
SELECT 'Approved designer files' as check_type, COUNT(*) as count
FROM public.session_files 
WHERE (uploaded_by_type = 'designer' OR uploaded_by_type IS NULL) 
AND status = 'approved';

-- 4. Count pending designer files
SELECT 'Pending designer files' as check_type, COUNT(*) as count
FROM public.session_files 
WHERE (uploaded_by_type = 'designer' OR uploaded_by_type IS NULL) 
AND status = 'pending';

-- 5. Show sample approved designer files (what admin should see)
SELECT 
  'Sample approved designer files' as data_type,
  id,
  name,
  uploaded_by_type,
  status,
  session_id,
  created_at
FROM public.session_files 
WHERE (uploaded_by_type = 'designer' OR uploaded_by_type IS NULL) 
AND status = 'approved'
ORDER BY created_at DESC
LIMIT 15;

-- 6. Check file status distribution
SELECT 
  'File status distribution' as data_type,
  status,
  uploaded_by_type,
  COUNT(*) as count
FROM public.session_files 
GROUP BY status, uploaded_by_type
ORDER BY status, uploaded_by_type;
