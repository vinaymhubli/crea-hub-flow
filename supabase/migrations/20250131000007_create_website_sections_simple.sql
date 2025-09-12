-- Create website_sections table to store dynamic website content
CREATE TABLE IF NOT EXISTS public.website_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page VARCHAR(50) NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  section_type VARCHAR(20) NOT NULL CHECK (section_type IN ('hero', 'content', 'features', 'card', 'testimonials', 'cta', 'footer')),
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  icon VARCHAR(50),
  background_color VARCHAR(100),
  text_color VARCHAR(20) DEFAULT '#000000',
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page, section_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_website_sections_page ON public.website_sections(page);
CREATE INDEX IF NOT EXISTS idx_website_sections_published ON public.website_sections(is_published);
CREATE INDEX IF NOT EXISTS idx_website_sections_sort ON public.website_sections(page, sort_order);

-- Enable RLS
ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view published website sections"
ON public.website_sections
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all website sections"
ON public.website_sections
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_website_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_website_sections_updated_at
  BEFORE UPDATE ON public.website_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_website_sections_updated_at();
