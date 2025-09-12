-- Fix website_sections table policies
-- This migration handles the case where policies already exist

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view published website sections" ON public.website_sections;
DROP POLICY IF EXISTS "Admins can manage all website sections" ON public.website_sections;

-- Recreate the policies
CREATE POLICY "Anyone can view published website sections"
ON public.website_sections
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all website sections"
ON public.website_sections
FOR ALL
USING (public.is_admin(auth.uid()));
