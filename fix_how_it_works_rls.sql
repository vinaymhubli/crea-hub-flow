-- Fix RLS policy for how_it_works_content table
-- Drop the existing policy and recreate it with the correct admin check

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admin full access for how it works content" ON public.how_it_works_content;

-- Create the correct policy using the existing is_admin function
CREATE POLICY "Admin full access for how it works content" ON public.how_it_works_content
  FOR ALL USING (public.is_admin(auth.uid()));

-- Also ensure the public read policy exists
DROP POLICY IF EXISTS "Public read access for how it works content" ON public.how_it_works_content;

CREATE POLICY "Public read access for how it works content" ON public.how_it_works_content
  FOR SELECT USING (is_published = true);
