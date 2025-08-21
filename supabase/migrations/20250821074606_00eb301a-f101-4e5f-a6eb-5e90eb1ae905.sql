-- Add is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create get_admin_stats function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_designers', (SELECT COUNT(*) FROM public.designers),
    'total_bookings', (SELECT COUNT(*) FROM public.bookings),
    'pending_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'pending'),
    'completed_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'completed'),
    'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE status = 'completed')
  );
$function$;

-- Create is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE user_id = user_uuid), FALSE);
$function$;

-- Add RLS policies for admin access
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (is_admin(auth.uid()));