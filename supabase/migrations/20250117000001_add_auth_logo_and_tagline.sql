-- Add tagline_text column to logo_management table for auth pages
ALTER TABLE public.logo_management 
ADD COLUMN IF NOT EXISTS tagline_text TEXT;

-- Insert default auth logo if it doesn't exist
INSERT INTO public.logo_management (logo_type, logo_url, alt_text, tagline_text, is_active) 
VALUES (
  'auth_logo', 
  'https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png', 
  'meetmydesigners',
  'Connect with talented designers or showcase your skills',
  true
)
ON CONFLICT (logo_type) DO NOTHING;

