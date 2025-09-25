-- Create social_media_links table
CREATE TABLE IF NOT EXISTS public.social_media_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform VARCHAR(50) NOT NULL UNIQUE,
  url TEXT NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage social media links" ON public.social_media_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR is_admin = true)
    )
  );

CREATE POLICY "Anyone can read active social media links" ON public.social_media_links
  FOR SELECT USING (is_active = true);

-- Grant permissions
GRANT ALL ON public.social_media_links TO authenticated;
GRANT SELECT ON public.social_media_links TO anon;

-- Insert default social media links
INSERT INTO public.social_media_links (platform, url, icon, sort_order) VALUES
  ('Facebook', 'https://facebook.com/meetmydesigner', 'facebook', 1),
  ('Twitter', 'https://twitter.com/meetmydesigner', 'twitter', 2),
  ('Instagram', 'https://instagram.com/meetmydesigner', 'instagram', 3),
  ('LinkedIn', 'https://linkedin.com/company/meetmydesigner', 'linkedin', 4)
ON CONFLICT (platform) DO NOTHING;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_social_media_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_social_media_links_updated_at
  BEFORE UPDATE ON public.social_media_links
  FOR EACH ROW
  EXECUTE FUNCTION update_social_media_links_updated_at();
