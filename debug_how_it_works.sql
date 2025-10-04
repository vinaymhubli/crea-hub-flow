-- Debug script to check how_it_works_content table
-- Run this in your Supabase SQL Editor to check the current state

-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'how_it_works_content';

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'how_it_works_content'
ORDER BY ordinal_position;

-- Check if data exists
SELECT * FROM public.how_it_works_content;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'how_it_works_content';

-- Test public read access (this should work without authentication)
SELECT * FROM public.how_it_works_content 
WHERE is_published = true;
