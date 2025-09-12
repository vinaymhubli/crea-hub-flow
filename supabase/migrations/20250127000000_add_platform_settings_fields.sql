-- Add missing fields to platform_settings table
ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS platform_name VARCHAR(255) DEFAULT 'Meet My Designer',
ADD COLUMN IF NOT EXISTS platform_description TEXT DEFAULT 'Connect with amazing designers worldwide',
ADD COLUMN IF NOT EXISTS support_email VARCHAR(255) DEFAULT 'support@meetmydesigner.com',
ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS allowed_file_types JSONB DEFAULT '["jpg", "png", "pdf", "svg", "gif", "webp"]',
ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_address TEXT DEFAULT 'Meet My Designers Pvt Ltd, Plot No. C-54, G Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT '{}';

-- Update existing records with default values
UPDATE platform_settings 
SET 
  platform_name = COALESCE(platform_name, 'Meet My Designer'),
  platform_description = COALESCE(platform_description, 'Connect with amazing designers worldwide'),
  support_email = COALESCE(support_email, 'support@meetmydesigner.com'),
  max_file_size_mb = COALESCE(max_file_size_mb, 10),
  allowed_file_types = COALESCE(allowed_file_types, '["jpg", "png", "pdf", "svg", "gif", "webp"]'),
  session_timeout_minutes = COALESCE(session_timeout_minutes, 60),
  contact_address = COALESCE(contact_address, 'Meet My Designers Pvt Ltd, Plot No. C-54, G Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051'),
  social_links = COALESCE(social_links, '{}'),
  seo_settings = COALESCE(seo_settings, '{}')
WHERE id IS NOT NULL;
