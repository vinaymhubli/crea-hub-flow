-- Simple script to set admin status and create basic admin policies
-- Run this directly in Supabase SQL Editor

-- Check if is_admin column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_admin() TO authenticated;

-- Set your user as admin (both role and is_admin)
UPDATE public.profiles 
SET is_admin = true, role = 'admin'
WHERE user_id = auth.uid();

-- Create admin policies only if they don't exist
DO $$ 
BEGIN
    -- Check and create policy for active_sessions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'active_sessions' AND policyname = 'Admins can view all active sessions') THEN
        CREATE POLICY "Admins can view all active sessions" ON public.active_sessions
            FOR SELECT USING (public.is_user_admin());
    END IF;

    -- Check and create policy for session_files
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_files' AND policyname = 'Admins can view all session files') THEN
        CREATE POLICY "Admins can view all session files" ON public.session_files
            FOR SELECT USING (public.is_user_admin());
    END IF;

    -- Check and create policy for session_approval_requests
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_approval_requests' AND policyname = 'Admins can view all session approval requests') THEN
        CREATE POLICY "Admins can view all session approval requests" ON public.session_approval_requests
            FOR SELECT USING (public.is_user_admin());
    END IF;

    -- Check and create policy for profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles') THEN
        CREATE POLICY "Admins can view all profiles" ON public.profiles
            FOR SELECT USING (public.is_user_admin());
    END IF;

    -- Check and create policy for bookings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can view all bookings') THEN
        CREATE POLICY "Admins can view all bookings" ON public.bookings
            FOR SELECT USING (public.is_user_admin());
    END IF;

    -- Check and create policy for designers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'designers' AND policyname = 'Admins can view all designers') THEN
        CREATE POLICY "Admins can view all designers" ON public.designers
            FOR SELECT USING (public.is_user_admin());
    END IF;
END $$;

-- Verify admin status
SELECT user_id, email, role, is_admin FROM public.profiles WHERE is_admin = true AND role = 'admin';
