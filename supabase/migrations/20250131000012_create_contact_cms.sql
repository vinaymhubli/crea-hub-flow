-- Create contact page content table
CREATE TABLE IF NOT EXISTS public.contact_page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- 'hero' or 'contact_method'
  title TEXT,
  description TEXT,
  content TEXT,
  icon TEXT,
  contact_info TEXT,
  action_text TEXT,
  color_scheme TEXT, -- 'green', 'blue', 'purple', 'orange'
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_contact_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_page_content_updated_at
  BEFORE UPDATE ON public.contact_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_page_content_updated_at();

-- Insert initial contact page data
INSERT INTO public.contact_page_content (section_type, title, description, content, icon, contact_info, action_text, color_scheme, sort_order, is_published) VALUES
-- Hero section
('hero', 'Get in Touch', 'Have questions about our platform? Need help finding the perfect designer? Our team is here to help you succeed. Reach out to us anytime!', 'Get in Touch', null, null, null, null, 0, true),

-- Contact method cards
('contact_method', 'Email Support', 'Send us a detailed message and we''ll get back to you within 2 hours.', 'Email Support', 'ri-mail-line', 'support@meetmydesigner.com', 'Send Email', 'green', 1, true),
('contact_method', 'Phone Support', 'Speak directly with our support team for immediate assistance.', 'Phone Support', 'ri-phone-line', '+1 (555) 123-4567', 'Call Now', 'blue', 2, true),
('contact_method', 'Live Chat', 'Chat with our team in real-time for quick answers to your questions.', 'Live Chat', 'ri-chat-3-line', 'Available 24/7', 'Start Chat', 'purple', 3, true),
('contact_method', 'Visit Our Office', 'Meet us in person at our headquarters in the heart of Mumbai.', 'Visit Our Office', 'ri-map-pin-line', 'Plot No. C-54, G Block, BKC, Mumbai', 'Get Directions', 'orange', 4, true);

-- RLS policies
ALTER TABLE public.contact_page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view published contact page content
CREATE POLICY "Anyone can view published contact page content" ON public.contact_page_content
  FOR SELECT USING (is_published = true);

-- Admins can manage all contact page content
CREATE POLICY "Admins can manage all contact page content" ON public.contact_page_content
  FOR ALL USING (is_admin(auth.uid()));
