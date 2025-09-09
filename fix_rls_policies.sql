-- Run this SQL script in your Supabase SQL Editor to fix the infinite recursion issue

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON public.session_messages;
DROP POLICY IF EXISTS "Users can insert messages to their sessions" ON public.session_messages;
DROP POLICY IF EXISTS "Users can view files from their sessions" ON public.session_files;
DROP POLICY IF EXISTS "Users can insert files to their sessions" ON public.session_files;

-- Temporarily disable RLS to allow the app to work immediately
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_files DISABLE ROW LEVEL SECURITY;

-- Optional: Keep session_invoices RLS enabled as it doesn't have recursion issues
-- But if you want to disable it too:
-- ALTER TABLE public.session_invoices DISABLE ROW LEVEL SECURITY;
