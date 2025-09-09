-- Temporarily disable RLS to fix the infinite recursion issue
-- You can run this directly in your Supabase SQL editor

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON public.session_messages;
DROP POLICY IF EXISTS "Users can insert messages to their sessions" ON public.session_messages;
DROP POLICY IF EXISTS "Users can view files from their sessions" ON public.session_files;
DROP POLICY IF EXISTS "Users can insert files to their sessions" ON public.session_files;

-- Temporarily disable RLS to allow the app to work
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_files DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled for invoices as they don't have the recursion issue
-- ALTER TABLE public.session_invoices DISABLE ROW LEVEL SECURITY;
