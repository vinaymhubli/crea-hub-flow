-- Create featured designer video table for admin to set video URL

CREATE TABLE IF NOT EXISTS public.featured_designer_video (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_featured_designer_video_active ON public.featured_designer_video(is_active);

-- Insert default video
INSERT INTO public.featured_designer_video (youtube_url, title, description, is_active) 
VALUES (
  'https://youtu.be/example-video-id',
  'Featured Designers Video',
  'Video showcasing our featured designers',
  true
) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.featured_designer_video ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active featured designer video" ON public.featured_designer_video
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage featured designer video" ON public.featured_designer_video
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Alternative policy for INSERT (in case the above doesn't work)
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
