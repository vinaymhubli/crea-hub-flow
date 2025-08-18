-- Add admin role to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create policy for admin access
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE is_admin = true
  )
);

-- Create policy for admins to update profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE is_admin = true
  )
);

-- Create admin stats view function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_designers', (SELECT COUNT(*) FROM public.designers),
    'total_bookings', (SELECT COUNT(*) FROM public.bookings),
    'pending_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'pending'),
    'completed_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'completed'),
    'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE status = 'completed')
  );
$$;