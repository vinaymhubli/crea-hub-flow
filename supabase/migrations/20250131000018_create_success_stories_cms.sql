-- Create success stories page content table
CREATE TABLE IF NOT EXISTS public.success_stories_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- 'hero', 'stats', 'story', 'testimonial', 'cta'
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content TEXT,
  category TEXT, -- 'SaaS', 'E-commerce', 'Healthcare', etc.
  duration TEXT, -- '18 months', '12 months', '24 months', etc.
  metrics JSONB, -- For revenue, growth, rating data
  achievements JSONB, -- For bullet points of achievements
  testimonial_data JSONB, -- For testimonial quotes and client info
  designer_data JSONB, -- For designer information
  stats_data JSONB, -- For statistics like success rate, ROI, etc.
  cta_data JSONB, -- For call-to-action buttons and content
  image_url TEXT, -- For background images or story images
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_success_stories_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER success_stories_content_updated_at
  BEFORE UPDATE ON public.success_stories_content
  FOR EACH ROW
  EXECUTE FUNCTION update_success_stories_content_updated_at();

-- Insert initial success stories data
INSERT INTO public.success_stories_content (section_type, title, subtitle, description, sort_order, is_published) VALUES
-- Hero section
('hero', 'Real Results, Real Impact', 'Discover how businesses like yours have transformed their growth with the help of our talented designers.', 'Success Stories', 0, true);

-- Insert statistics section
INSERT INTO public.success_stories_content (section_type, title, stats_data, sort_order, is_published) VALUES
('stats', 'Key Statistics', '{"statistics": [{"value": "98%", "label": "Success Rate", "icon": "Award"}, {"value": "350%", "label": "Average ROI", "icon": "TrendingUp"}, {"value": "10,000+", "label": "Happy Clients", "icon": "Users"}, {"value": "25,000+", "label": "Projects Completed", "icon": "Star"}]}', 1, true);

-- Insert transformative partnerships section
INSERT INTO public.success_stories_content (section_type, title, subtitle, sort_order, is_published) VALUES
('cta', 'Transformative Partnerships', 'See how our designers have helped businesses achieve extraordinary results', 2, true);

-- Insert success stories
INSERT INTO public.success_stories_content (section_type, title, category, duration, metrics, achievements, testimonial_data, designer_data, sort_order, is_published) VALUES
('story', 'From Startup to $10M in Revenue', 'SaaS', '18 months', '{"revenue": "$10M+", "growth": "300%", "rating": 5}', '["300% increase in conversion rate", "50% reduction in user acquisition cost", "Secured $5M Series A funding", "Award-winning design system"]', '{"quote": "Working with Sarah through Meet My Designer transformed our entire brand. Her strategic approach to UX design increased our conversion rate by 300% and helped us secure Series A funding.", "client_name": "Mark Rodriguez", "client_title": "CEO, TechFlow Solutions", "company": "TechFlow Solutions"}', '{"name": "Sarah Chen", "rating": 5, "reviews": 127}', 3, true),

('story', 'E-commerce Revolution', 'E-commerce', '12 months', '{"revenue": "$2M+", "growth": "450%", "rating": 5}', '["450% increase in sales", "60% improvement in mobile experience", "Featured in Design Awards 2024", "Expanded to 3 new markets"]', '{"quote": "Alex completely reimagined our user experience. The new design not only looks amazing but increased our sales by 450% in just one year.", "client_name": "Emily Watson", "client_title": "Founder, Artisan Marketplace", "company": "Artisan Marketplace"}', '{"name": "Alex Kumar", "rating": 5, "reviews": 127}', 4, true),

('story', 'Healthcare App Innovation', 'Healthcare', '24 months', '{"revenue": "$5M+", "growth": "200%", "rating": 5}', '["200% increase in user engagement", "HIPAA-compliant design system", "1M+ active users", "Partnership with major health systems"]', '{"quote": "Maria''s expertise in healthcare UX was exactly what we needed. She helped us create an app that''s both compliant and user-friendly, leading to rapid adoption.", "client_name": "Dr. James Park", "client_title": "CTO, HealthConnect", "company": "HealthConnect"}', '{"name": "Maria Garcia", "rating": 5, "reviews": 127}', 5, true);

-- Insert final CTA section
INSERT INTO public.success_stories_content (section_type, title, subtitle, cta_data, sort_order, is_published) VALUES
('cta', 'Ready to Write Your Success Story?', 'Join thousands of businesses that have transformed their growth with our platform', '{"buttons": [{"text": "Browse Designers", "type": "primary", "icon": "Search"}, {"text": "Get Started Free", "type": "secondary", "icon": "Play"}]}', 6, true);

-- Insert hero CTA section
INSERT INTO public.success_stories_content (section_type, title, subtitle, cta_data, sort_order, is_published) VALUES
('cta', 'Ready to Start Your Creative Journey?', 'Join thousands of successful customers and designers who are already creating amazing work together. Your next great project is just one click away.', '{"cards": [{"title": "I Need Design Work", "description": "Find talented designers and bring your creative vision to life with professional results.", "button_text": "Browse Designers", "button_icon": "Search", "icon": "UserPlus", "color": "green"}, {"title": "I''m a Designer", "description": "Showcase your skills, connect with clients, and build a thriving design business.", "button_text": "Join as Designer", "button_icon": "User", "icon": "MessageCircle", "color": "blue"}]}', 7, true);

-- Insert final stats section
INSERT INTO public.success_stories_content (section_type, title, stats_data, sort_order, is_published) VALUES
('stats', 'Platform Statistics', '{"statistics": [{"value": "10,000+", "label": "Happy Customers"}, {"value": "5,000+", "label": "Verified Designers"}, {"value": "50,000+", "label": "Projects Completed"}, {"value": "99.2%", "label": "Satisfaction Rate"}]}', 8, true);

-- RLS policies
ALTER TABLE public.success_stories_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view published success stories content
CREATE POLICY "Anyone can view published success stories content" ON public.success_stories_content
  FOR SELECT USING (is_published = true);

-- Admins can manage all success stories content
CREATE POLICY "Admins can manage all success stories content" ON public.success_stories_content
  FOR ALL USING (is_admin(auth.uid()));
