-- Create CMS content management tables
-- This migration creates tables for managing all website content through admin panel

-- Create content_pages table for managing different types of content
CREATE TABLE IF NOT EXISTS public.content_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL CHECK (page_type IN (
    'faq', 'terms', 'support', 'about', 'contact', 'refund_policy', 
    'help_center', 'blog', 'privacy', 'pricing'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  meta_keywords TEXT[],
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create FAQs table for structured FAQ management
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'general',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create blog_posts table for blog management
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  meta_description TEXT,
  meta_keywords TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Note: platform_settings table already exists with different structure
-- We'll work with the existing singleton table structure


-- Add missing columns for other tables if they don't exist
ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS meta_description TEXT;

ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS meta_keywords TEXT[];

ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS excerpt TEXT;

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS tags TEXT[];

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS meta_description TEXT;

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS meta_keywords TEXT[];

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add additional columns to existing platform_settings table for CMS functionality
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS platform_name VARCHAR(255) DEFAULT 'CreaHub Flow';

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS platform_description TEXT DEFAULT 'Real-time design collaboration platform';

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS support_email VARCHAR(255) DEFAULT 'support@creahubflow.com';

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50) DEFAULT '+1-555-0123';

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS max_file_upload_size_mb INTEGER DEFAULT 100;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS max_concurrent_sessions INTEGER DEFAULT 5;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 60;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS minimum_withdrawal_amount DECIMAL(10,2) DEFAULT 50;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS maximum_withdrawal_amount DECIMAL(10,2) DEFAULT 10000;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0.08;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS enable_live_sessions BOOLEAN DEFAULT true;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS enable_wallet_system BOOLEAN DEFAULT true;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS enable_notifications BOOLEAN DEFAULT true;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS enable_analytics BOOLEAN DEFAULT true;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS require_email_verification BOOLEAN DEFAULT true;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS require_phone_verification BOOLEAN DEFAULT false;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS enable_two_factor_auth BOOLEAN DEFAULT false;

ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS password_min_length INTEGER DEFAULT 8;

-- Enable RLS on all tables
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
-- Note: platform_settings already has RLS enabled

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Content pages are viewable by everyone when published" ON public.content_pages;
DROP POLICY IF EXISTS "Admins can manage content pages" ON public.content_pages;
DROP POLICY IF EXISTS "FAQs are viewable by everyone when published" ON public.faqs;
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Blog posts are viewable by everyone when published" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
-- Note: platform_settings policies already exist and are managed by existing migrations

-- Create RLS policies for content_pages
CREATE POLICY "Content pages are viewable by everyone when published" 
ON public.content_pages 
FOR SELECT 
USING (is_published = true OR auth.role() = 'service_role');

CREATE POLICY "Admins can manage content pages" 
ON public.content_pages 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create RLS policies for faqs
CREATE POLICY "FAQs are viewable by everyone when published" 
ON public.faqs 
FOR SELECT 
USING (is_published = true OR auth.role() = 'service_role');

CREATE POLICY "Admins can manage FAQs" 
ON public.faqs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create RLS policies for blog_posts
CREATE POLICY "Blog posts are viewable by everyone when published" 
ON public.blog_posts 
FOR SELECT 
USING (is_published = true OR auth.role() = 'service_role');

CREATE POLICY "Admins can manage blog posts" 
ON public.blog_posts 
FOR ALL 
USING (auth.role() = 'service_role');

-- Note: platform_settings policies already exist and are managed by existing migrations


-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_content_pages_updated_at ON public.content_pages;
DROP TRIGGER IF EXISTS update_faqs_updated_at ON public.faqs;
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
-- Note: platform_settings trigger already exists

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_content_pages_updated_at
  BEFORE UPDATE ON public.content_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Note: platform_settings trigger already exists


-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_pages_page_type ON public.content_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_content_pages_published ON public.content_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON public.faqs(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at);
-- Note: platform_settings indexes already exist

-- Update existing platform_settings with default values for new columns
UPDATE public.platform_settings SET
  platform_name = COALESCE(platform_name, 'CreaHub Flow'),
  platform_description = COALESCE(platform_description, 'Real-time design collaboration platform'),
  support_email = COALESCE(support_email, 'support@creahubflow.com'),
  contact_phone = COALESCE(contact_phone, '+1-555-0123'),
  max_file_upload_size_mb = COALESCE(max_file_upload_size_mb, 100),
  max_concurrent_sessions = COALESCE(max_concurrent_sessions, 5),
  session_timeout_minutes = COALESCE(session_timeout_minutes, 60),
  minimum_withdrawal_amount = COALESCE(minimum_withdrawal_amount, 50),
  maximum_withdrawal_amount = COALESCE(maximum_withdrawal_amount, 10000),
  tax_rate = COALESCE(tax_rate, 0.08),
  enable_live_sessions = COALESCE(enable_live_sessions, true),
  enable_wallet_system = COALESCE(enable_wallet_system, true),
  enable_notifications = COALESCE(enable_notifications, true),
  enable_analytics = COALESCE(enable_analytics, true),
  require_email_verification = COALESCE(require_email_verification, true),
  require_phone_verification = COALESCE(require_phone_verification, false),
  enable_two_factor_auth = COALESCE(enable_two_factor_auth, false),
  password_min_length = COALESCE(password_min_length, 8)
WHERE singleton = true;


-- Insert default content pages
INSERT INTO public.content_pages (page_type, title, content, is_published, created_by) VALUES
('about', 'About Us', 'Welcome to CreaHub Flow, the revolutionary real-time design collaboration platform that connects customers with talented designers instantly. Our mission is to make professional design accessible to everyone through seamless collaboration, secure payments, and innovative technology.', true, null),
('terms', 'Terms and Conditions', 'These terms and conditions outline the rules and regulations for the use of CreaHub Flow. By accessing this platform, we assume you accept these terms and conditions.', true, null),
('privacy', 'Privacy Policy', 'This privacy policy explains how CreaHub Flow collects, uses, and protects your personal information when you use our platform.', true, null),
('refund_policy', 'Refund Policy', 'We offer a comprehensive refund policy to ensure customer satisfaction. Refunds are processed within 5-7 business days.', true, null),
('support', 'Support Center', 'Our support team is available 24/7 to help you with any questions or issues. Contact us through email, phone, or live chat.', true, null),
('help_center', 'Help Center', 'Find answers to common questions, tutorials, and guides to help you get the most out of CreaHub Flow.', true, null)
ON CONFLICT DO NOTHING;

-- Insert default FAQs
INSERT INTO public.faqs (category, question, answer, is_published) VALUES
('general', 'What is CreaHub Flow?', 'CreaHub Flow is a revolutionary real-time design collaboration platform that connects customers with talented designers instantly. Our platform enables live collaboration, secure payments, and seamless project management.', true),
('general', 'How does the platform work?', 'Simply browse our curated marketplace of designers, connect with those who match your needs, discuss your project requirements, and start collaborating in real-time. Our platform handles everything from initial contact to final delivery and payment.', true),
('customers', 'How do I find the right designer?', 'Use our advanced search and filter system to find designers based on specialty, rating, availability, and budget. You can also browse portfolios and read reviews from previous clients.', true),
('customers', 'How are payments handled?', 'We use secure escrow payments. Your payment is held safely until you approve the final work. This ensures both parties are protected throughout the collaboration process.', true),
('designers', 'How do I become a designer?', 'Sign up as a designer, complete your profile with portfolio samples, set your rates, and start accepting projects. We verify all designers to ensure quality.', true),
('designers', 'How do I get paid?', 'Once a project is completed and approved by the client, funds are released to your account. You can withdraw earnings to your bank account or digital wallet.', true),
('payments', 'What payment methods do you accept?', 'We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our encrypted payment system.', true),
('payments', 'Are there any fees?', 'We charge a small platform fee to cover payment processing and platform maintenance. This fee is clearly displayed before you make any payment.', true)
ON CONFLICT DO NOTHING;
