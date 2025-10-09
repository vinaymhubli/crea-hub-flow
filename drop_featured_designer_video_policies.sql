-- Drop all RLS policies for featured_designer_video table

DROP POLICY IF EXISTS "Anyone can view active featured designer video" ON public.featured_designer_video;
DROP POLICY IF EXISTS "Admins can manage featured designer video" ON public.featured_designer_video;
DROP POLICY IF EXISTS "Allow admin insert" ON public.featured_designer_video;
DROP POLICY IF EXISTS "Allow admin update" ON public.featured_designer_video;
DROP POLICY IF EXISTS "Allow admin delete" ON public.featured_designer_video;

-- Disable RLS temporarily (optional)
-- ALTER TABLE public.featured_designer_video DISABLE ROW LEVEL SECURITY;
