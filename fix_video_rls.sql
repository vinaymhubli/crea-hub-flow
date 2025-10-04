-- Fix RLS policy for video content
-- Run this in Supabase SQL Editor

-- First, let's see what section_type the video actually has
SELECT section_type, title, youtube_url, is_published 
FROM public.how_it_works_content 
WHERE youtube_url IS NOT NULL AND youtube_url != '';

-- Update the video content to have the correct section_type if needed
UPDATE public.how_it_works_content 
SET section_type = 'video' 
WHERE youtube_url IS NOT NULL AND youtube_url != '' AND section_type != 'video';

-- Drop and recreate the RLS policies to ensure they work
DROP POLICY IF EXISTS "Public read access for how it works content" ON public.how_it_works_content;
DROP POLICY IF EXISTS "Admin full access for how it works content" ON public.how_it_works_content;

-- Create new policies
CREATE POLICY "Public read access for how it works content" ON public.how_it_works_content
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access for how it works content" ON public.how_it_works_content
  FOR ALL USING (public.is_admin(auth.uid()));

-- Test the query that's failing
SELECT * FROM public.how_it_works_content 
WHERE section_type = 'video' 
AND is_published = true 
ORDER BY sort_order ASC 
LIMIT 1;
