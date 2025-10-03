se -- Test database connection and table access
-- Run this in Supabase SQL Editor

-- 1. Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'how_it_works_content') 
    THEN '✅ Table exists' 
    ELSE '❌ Table does not exist' 
  END as table_status;

-- 2. Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'how_it_works_content' 
ORDER BY ordinal_position;

-- 3. Check if data exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.how_it_works_content) 
    THEN '✅ Data exists' 
    ELSE '❌ No data found' 
  END as data_status;

-- 4. Show all data
SELECT * FROM public.how_it_works_content;

-- 5. Test public read access
SELECT 
  section_type,
  title,
  youtube_url,
  is_published
FROM public.how_it_works_content 
WHERE is_published = true;
