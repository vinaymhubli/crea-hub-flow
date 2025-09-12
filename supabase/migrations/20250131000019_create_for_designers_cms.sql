-- Create for designers page content table
CREATE TABLE IF NOT EXISTS public.for_designers_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- 'hero', 'cta_cards', 'stats', 'footer_cta'
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content TEXT,
  hero_data JSONB, -- For hero section data
  cta_cards JSONB, -- For CTA cards data
  stats_data JSONB, -- For statistics data
  background_image_url TEXT, -- For hero background image
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_for_designers_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER for_designers_content_updated_at
  BEFORE UPDATE ON public.for_designers_content
  FOR EACH ROW
  EXECUTE FUNCTION update_for_designers_content_updated_at();

-- Insert initial for designers data
INSERT INTO public.for_designers_content (section_type, title, subtitle, description, hero_data, sort_order, is_published) VALUES
-- Hero section
('hero', 'Ready to Start Your Creative Journey?', 'Join thousands of successful customers and designers who are already creating amazing work together. Your next great project is just one click away.', 'Creative Journey Hero Section', '{"highlight_text": "Creative Journey?", "background_gradient": "from-green-500 via-blue-500 to-purple-600"}', 0, true);

-- Insert CTA cards section
INSERT INTO public.for_designers_content (section_type, title, cta_cards, sort_order, is_published) VALUES
('cta_cards', 'Call to Action Cards', '{"cards": [{"title": "I Need Design Work", "description": "Find talented designers and bring your creative vision to life with professional results.", "button_text": "Browse Designers", "button_icon": "Search", "card_icon": "UserPlus", "card_color": "green", "button_color": "green"}, {"title": "I''m a Designer", "description": "Showcase your skills, connect with clients, and build a thriving design business.", "button_text": "Join as Designer", "button_icon": "User", "card_icon": "MessageCircle", "card_color": "blue", "button_color": "blue"}]}', 1, true);

-- Insert statistics section
INSERT INTO public.for_designers_content (section_type, title, stats_data, sort_order, is_published) VALUES
('stats', 'Platform Statistics', '{"statistics": [{"value": "10,000+", "label": "Happy Customers"}, {"value": "5,000+", "label": "Verified Designers"}, {"value": "50,000+", "label": "Projects Completed"}, {"value": "99.2%", "label": "Satisfaction Rate"}]}', 2, true);

-- Insert footer CTA section (for use on other pages)
INSERT INTO public.for_designers_content (section_type, title, subtitle, cta_cards, sort_order, is_published) VALUES
('footer_cta', 'Ready to Start Your Creative Journey?', 'Join thousands of successful customers and designers who are already creating amazing work together. Your next great project is just one click away.', '{"cards": [{"title": "I Need Design Work", "description": "Find talented designers and bring your creative vision to life with professional results.", "button_text": "Browse Designers", "button_icon": "Search", "card_icon": "UserPlus", "card_color": "green", "button_color": "green"}, {"title": "I''m a Designer", "description": "Showcase your skills, connect with clients, and build a thriving design business.", "button_text": "Join as Designer", "button_icon": "User", "card_icon": "MessageCircle", "card_color": "blue", "button_color": "blue"}]}', 3, true);

-- RLS policies
ALTER TABLE public.for_designers_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view published for designers content
CREATE POLICY "Anyone can view published for designers content" ON public.for_designers_content
  FOR SELECT USING (is_published = true);

-- Admins can manage all for designers content
CREATE POLICY "Admins can manage all for designers content" ON public.for_designers_content
  FOR ALL USING (is_admin(auth.uid()));
