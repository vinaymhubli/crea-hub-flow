-- Create how_it_works_content table for managing How It Works section
CREATE TABLE IF NOT EXISTS public.how_it_works_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL DEFAULT 'how_it_works', -- 'how_it_works', 'video'
  title TEXT,
  subtitle TEXT,
  description TEXT,
  youtube_url TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_how_it_works_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER how_it_works_content_updated_at
  BEFORE UPDATE ON public.how_it_works_content
  FOR EACH ROW
  EXECUTE FUNCTION update_how_it_works_content_updated_at();

-- Insert initial how it works content
INSERT INTO public.how_it_works_content (section_type, title, subtitle, description, youtube_url, sort_order, is_published) VALUES
('how_it_works', 'How Our Platform Works', 'Connect with world-class designers in minutes. Our innovative platform makes hiring creative talent as easy as ordering your morning coffee.', 'Simple & Secure Process', '', 0, true),
('video', 'See How It Works', 'Watch our complete platform walkthrough', 'Discover how easy it is to find the perfect designer and get your project started in just a few simple steps.', '', 1, true);

-- Enable RLS
ALTER TABLE public.how_it_works_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access for how it works content" ON public.how_it_works_content
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access for how it works content" ON public.how_it_works_content
  FOR ALL USING (public.is_admin(auth.uid()));
