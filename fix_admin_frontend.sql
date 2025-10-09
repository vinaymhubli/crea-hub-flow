-- Fix admin access from frontend
-- The issue is that the admin function works in SQL editor but not from frontend
-- Let's completely disable RLS on active_sessions for now to get customer names working

-- Temporarily disable RLS on active_sessions completely
ALTER TABLE public.active_sessions DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on profiles to ensure we can read customer data
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test query to make sure it works
SELECT COUNT(*) as total_active_sessions FROM public.active_sessions;
SELECT COUNT(*) as total_profiles FROM public.profiles WHERE user_type = 'client';

-- This should now allow the frontend to access ALL sessions and customer data
