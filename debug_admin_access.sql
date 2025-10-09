-- Debug admin access and fix RLS policies
-- Run this in Supabase SQL Editor

-- First, let's check if the admin function is working
SELECT public.is_user_admin() as am_i_admin;

-- Check current user and admin status
SELECT auth.uid() as current_user_id;
SELECT user_id, email, role, is_admin FROM public.profiles WHERE user_id = auth.uid();

-- Check existing policies on active_sessions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'active_sessions';

-- Let's try to disable RLS temporarily on active_sessions to test
ALTER TABLE public.active_sessions DISABLE ROW LEVEL SECURITY;

-- Test query after disabling RLS
SELECT session_id, customer_id, designer_id 
FROM public.active_sessions 
WHERE session_id = 'live_1760019631091_h20comgrf';

-- Count total sessions
SELECT COUNT(*) as total_sessions FROM public.active_sessions;

-- Re-enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policy and recreate it
DROP POLICY IF EXISTS "Admins can view all active sessions" ON public.active_sessions;

-- Create a simpler admin policy that should definitely work
CREATE POLICY "Admin full access" ON public.active_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND is_admin = true
        )
    );

-- Test the query again with new policy
SELECT session_id, customer_id, designer_id 
FROM public.active_sessions 
WHERE session_id = 'live_1760019631091_h20comgrf';
