-- Fix RLS policies for categories and skills tables
-- Ensure is_user_admin() function works correctly and admins can perform CRUD operations

-- First, ensure the is_user_admin() function exists and works correctly
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has is_admin = true OR user_type = 'admin' in profiles table
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE (user_id = auth.uid() OR id = auth.uid())
      AND (is_admin = true OR user_type = 'admin')
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin() TO anon;

-- Drop existing policies for categories if they exist
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories (insert)" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories (update)" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories (delete)" ON public.categories;

-- Recreate RLS policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories 
  FOR SELECT 
  USING (true);

-- Only admins can insert categories
CREATE POLICY "Admins can manage categories (insert)"
  ON public.categories 
  FOR INSERT 
  WITH CHECK (public.is_user_admin());

-- Only admins can update categories
CREATE POLICY "Admins can manage categories (update)"
  ON public.categories 
  FOR UPDATE 
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

-- Only admins can delete categories
CREATE POLICY "Admins can manage categories (delete)"
  ON public.categories 
  FOR DELETE 
  USING (public.is_user_admin());

-- Drop existing policies for skills if they exist
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
DROP POLICY IF EXISTS "Admins can manage skills (insert)" ON public.skills;
DROP POLICY IF EXISTS "Admins can manage skills (update)" ON public.skills;
DROP POLICY IF EXISTS "Admins can manage skills (delete)" ON public.skills;

-- Recreate RLS policies for skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Anyone can read active skills
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills 
  FOR SELECT 
  USING (true);

-- Only admins can insert skills
CREATE POLICY "Admins can manage skills (insert)"
  ON public.skills 
  FOR INSERT 
  WITH CHECK (public.is_user_admin());

-- Only admins can update skills
CREATE POLICY "Admins can manage skills (update)"
  ON public.skills 
  FOR UPDATE 
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

-- Only admins can delete skills
CREATE POLICY "Admins can manage skills (delete)"
  ON public.skills 
  FOR DELETE 
  USING (public.is_user_admin());

