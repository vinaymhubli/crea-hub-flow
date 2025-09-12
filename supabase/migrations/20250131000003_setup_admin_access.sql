-- Setup admin access for meetmydesigners@gmail.com
-- This migration works with the existing is_admin system

-- Set the user with meetmydesigners@gmail.com as admin in profiles table
-- This will work if the user already exists
UPDATE public.profiles 
SET is_admin = true,
    user_type = 'admin',  -- Now we can use 'admin' as user_type
    updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'meetmydesigners@gmail.com'
);

-- Create profile for admin user if not exists (in case user exists but no profile)
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  user_type,
  is_admin,
  created_at,
  updated_at
) 
SELECT 
  u.id,
  u.email,
  'Admin',
  'User',
  'admin',  -- Now we can use 'admin' as user_type
  true,
  NOW(),
  NOW()
FROM auth.users u 
WHERE u.email = 'meetmydesigners@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = u.id
  );

-- Update RLS policies for content_pages to use existing is_admin function
DROP POLICY IF EXISTS "Admins can manage content pages" ON public.content_pages;
CREATE POLICY "Admins can manage content pages" 
ON public.content_pages 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Update RLS policies for faqs to use existing is_admin function
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faqs;
CREATE POLICY "Admins can manage FAQs" 
ON public.faqs 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Update RLS policies for blog_posts to use existing is_admin function
DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog posts" 
ON public.blog_posts 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Note: platform_settings policies already exist and use the existing is_admin function

-- Verify admin setup
DO $$
DECLARE
    admin_user_id UUID;
    admin_profile_exists BOOLEAN;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'meetmydesigners@gmail.com';
    
    -- Check if profile exists and is marked as admin
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE user_id = admin_user_id AND is_admin = true
    ) INTO admin_profile_exists;
    
    -- Report status
    IF admin_user_id IS NOT NULL AND admin_profile_exists THEN
        RAISE NOTICE 'Admin setup successful: User % is now an admin', admin_user_id;
    ELSIF admin_user_id IS NOT NULL THEN
        RAISE NOTICE 'User % exists but admin flag not set properly', admin_user_id;
    ELSE
        RAISE NOTICE 'User with email meetmydesigners@gmail.com not found. Please create the user first.';
    END IF;
END $$;
