-- Fix infinite recursion in profiles RLS policies by removing problematic admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE user_id = user_uuid), false);
$$;

-- Create new admin policies using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()));