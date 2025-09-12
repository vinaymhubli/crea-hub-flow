-- Create privacy policy page content table
CREATE TABLE IF NOT EXISTS public.privacy_policy_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- 'hero', 'content', 'card'
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content TEXT,
  icon TEXT, -- For card icons
  card_items JSONB, -- For bullet points and list items
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_privacy_policy_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER privacy_policy_content_updated_at
  BEFORE UPDATE ON public.privacy_policy_content
  FOR EACH ROW
  EXECUTE FUNCTION update_privacy_policy_content_updated_at();

-- Insert initial privacy policy data
INSERT INTO public.privacy_policy_content (section_type, title, subtitle, description, sort_order, is_published) VALUES
-- Hero section
('hero', 'Your Privacy Matters', 'Last updated: January 1, 2024', 'Privacy Policy', 0, true);

-- Insert content sections
INSERT INTO public.privacy_policy_content (section_type, title, description, sort_order, is_published) VALUES
('content', 'Information We Collect', 'At Meet My Designer, we collect information you provide directly to us, such as when you create an account, update your profile, make a purchase, or contact us for support.', 1, true),
('content', 'How We Use Your Information', 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.', 2, true),
('content', 'Information Sharing', 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.', 3, true),
('content', 'Data Security', 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.', 4, true),
('content', 'Your Rights', 'You have the right to access, update, or delete your personal information. You can also opt out of certain communications and request a copy of your data.', 5, true),
('content', 'Cookies and Tracking', 'We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content.', 6, true),
('content', 'Contact Us', 'If you have any questions about this Privacy Policy, please contact us at privacy@meetmydesigner.com or through our support channels.', 7, true);

-- Insert card sections with bullet points
INSERT INTO public.privacy_policy_content (section_type, title, icon, card_items, sort_order, is_published) VALUES
('card', 'Data We Collect', 'Eye', '["Personal information (name, email, phone number)", "Professional information (skills, experience, portfolio)", "Payment information (processed securely through our payment providers)", "Usage data (how you interact with our platform)", "Communication data (messages, support tickets)"]', 8, true),
('card', 'How We Use Data', 'Users', '["Provide and maintain our platform services", "Process payments and transactions", "Send you important updates and notifications", "Improve our platform based on usage patterns", "Prevent fraud and ensure platform security"]', 9, true),
('card', 'Security Measures', 'Lock', '["SSL encryption for all data transmission", "Regular security audits and penetration testing", "Secure data centers with 24/7 monitoring", "Employee access controls and training", "Incident response procedures"]', 10, true);

-- RLS policies
ALTER TABLE public.privacy_policy_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view published privacy policy content
CREATE POLICY "Anyone can view published privacy policy content" ON public.privacy_policy_content
  FOR SELECT USING (is_published = true);

-- Admins can manage all privacy policy content
CREATE POLICY "Admins can manage all privacy policy content" ON public.privacy_policy_content
  FOR ALL USING (is_admin(auth.uid()));
