-- Fix RLS policies for featured_designer_video table

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view active featured designer video" ON public.featured_designer_video;
DROP POLICY IF EXISTS "Admins can manage featured designer video" ON public.featured_designer_video;
DROP POLICY IF EXISTS "Allow admin insert" ON public.featured_designer_video;
DROP POLICY IF EXISTS "Allow admin update" ON public.featured_designer_video;
DROP POLICY IF EXISTS "Allow admin delete" ON public.featured_designer_video;

-- Create new policies
CREATE POLICY "Anyone can view active featured designer video" ON public.featured_designer_video
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin insert" ON public.featured_designer_video
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow admin update" ON public.featured_designer_video
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete" ON public.featured_designer_video
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
