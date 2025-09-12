-- Create support page content table
CREATE TABLE IF NOT EXISTS public.support_page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- 'hero', 'tabs', 'faq', 'guides', 'system_status', 'contact', 'urgent_help'
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content TEXT,
  tab_name TEXT, -- For tab navigation
  card_data JSONB, -- For card information (title, read_time, badge, etc.)
  form_fields JSONB, -- For contact form fields
  status_data JSONB, -- For system status information
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_support_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_page_content_updated_at
  BEFORE UPDATE ON public.support_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_support_page_content_updated_at();

-- Insert initial support page data
INSERT INTO public.support_page_content (section_type, title, subtitle, description, sort_order, is_published) VALUES
-- Hero section
('hero', 'How can we help you?', 'Find answers, get support, and make the most of Meet My Designer', 'Find answers, get support, and make the most of Meet My Designer', 0, true),

-- Tabs section
('tabs', 'Support Navigation', 'FAQ, Guides, System Status, Contact', 'Support Navigation Tabs', 1, true),

-- Urgent Help section
('urgent_help', 'Need Urgent Help?', 'For critical issues affecting live projects or urgent technical problems', 'Emergency Support: +1 (555) 123-4567', 2, true);

-- Insert FAQ cards
INSERT INTO public.support_page_content (section_type, title, tab_name, card_data, sort_order, is_published) VALUES
('faq', 'Getting Started as a Client', 'FAQ', '{"read_time": "5 min read", "badge": null, "content": "Learn how to get started as a client on our platform"}', 3, true),
('faq', 'How do I get started as a client?', 'FAQ', '{"read_time": "3 min read", "badge": null, "content": "Step-by-step guide to becoming a client"}', 4, true),
('faq', 'What''s included in the designer verification process?', 'FAQ', '{"read_time": "4 min read", "badge": null, "content": "Understanding our designer verification process"}', 5, true),
('faq', 'How does the payment system work?', 'FAQ', '{"read_time": "6 min read", "badge": null, "content": "Complete guide to our payment system"}', 6, true),
('faq', 'What happens if I''m not satisfied with the work?', 'FAQ', '{"read_time": "5 min read", "badge": null, "content": "Our quality guarantee and refund policy"}', 7, true),
('faq', 'Can I work with multiple designers on one project?', 'FAQ', '{"read_time": "4 min read", "badge": null, "content": "Collaboration options and project management"}', 8, true),
('faq', 'How quickly can I find a designer?', 'FAQ', '{"read_time": "3 min read", "badge": null, "content": "Timeline for designer matching and availability"}', 9, true);

-- Insert Guide cards
INSERT INTO public.support_page_content (section_type, title, tab_name, card_data, sort_order, is_published) VALUES
('guides', 'How to Choose the Right Designer', 'Guides', '{"read_time": "8 min read", "badge": "Tips", "content": "Expert tips for selecting the perfect designer for your project"}', 10, true),
('guides', 'Designer Onboarding Guide', 'Guides', '{"read_time": "10 min read", "badge": "Designers", "content": "Complete guide for new designers joining our platform"}', 11, true),
('guides', 'Project Management Best Practices', 'Guides', '{"read_time": "6 min read", "badge": "Projects", "content": "Best practices for managing design projects effectively"}', 12, true),
('guides', 'Understanding Platform Fees', 'Guides', '{"read_time": "3 min read", "badge": "Billing", "content": "Detailed breakdown of platform fees and pricing"}', 13, true),
('guides', 'Quality Assurance Process', 'Guides', '{"read_time": "7 min read", "badge": "Quality", "content": "How we ensure quality in every project"}', 14, true);

-- Insert System Status data
INSERT INTO public.support_page_content (section_type, title, tab_name, status_data, sort_order, is_published) VALUES
('system_status', 'All Systems Operational', 'System Status', '{"overall_status": "Healthy", "last_updated": "12/09/2025, 17:49:52", "services": [{"name": "Platform", "uptime": "99.9%", "status": "Operational"}, {"name": "Payments", "uptime": "99.8%", "status": "Operational"}, {"name": "Video Calls", "uptime": "99.7%", "status": "Operational"}, {"name": "File Storage", "uptime": "99.9%", "status": "Operational"}]}', 15, true);

-- Insert Contact form data
INSERT INTO public.support_page_content (section_type, title, tab_name, form_fields, sort_order, is_published) VALUES
('contact', 'Contact Our Support Team', 'Contact', '{"form_title": "Send Us a Message", "form_description": "Fill out the form below and we''ll get back to you as soon as possible.", "fields": [{"name": "full_name", "label": "Full Name", "type": "text", "required": true, "placeholder": "Enter your full name"}, {"name": "email", "label": "Email Address", "type": "email", "required": true, "placeholder": "Enter your email address"}, {"name": "phone", "label": "Phone Number", "type": "tel", "required": false, "placeholder": "Enter your phone number"}, {"name": "user_type", "label": "I am a", "type": "select", "required": true, "placeholder": "Select user type", "options": ["Client", "Designer", "Other"]}, {"name": "subject", "label": "Subject", "type": "text", "required": true, "placeholder": "What''s this about?"}, {"name": "priority", "label": "Priority Level", "type": "select", "required": false, "placeholder": "Select priority", "options": ["Low", "Medium", "High", "Urgent"]}, {"name": "message", "label": "Message", "type": "textarea", "required": true, "placeholder": "Please describe your inquiry in detail...", "max_length": 500}]}', 16, true);

-- RLS policies
ALTER TABLE public.support_page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view published support page content
CREATE POLICY "Anyone can view published support page content" ON public.support_page_content
  FOR SELECT USING (is_published = true);

-- Admins can manage all support page content
CREATE POLICY "Admins can manage all support page content" ON public.support_page_content
  FOR ALL USING (is_admin(auth.uid()));
