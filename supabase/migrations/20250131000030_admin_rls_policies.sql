-- Admin RLS Policies Migration
-- This migration creates comprehensive RLS policies for admin users
-- Admin users (with is_admin = true in profiles table) can access all tables

-- First, let's add is_admin column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_admin() TO authenticated;

-- Admin policies for active_sessions table
CREATE POLICY "Admins can view all active sessions" ON public.active_sessions
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all active sessions" ON public.active_sessions
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all active sessions" ON public.active_sessions
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all active sessions" ON public.active_sessions
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for session_files table
CREATE POLICY "Admins can view all session files" ON public.session_files
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all session files" ON public.session_files
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all session files" ON public.session_files
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all session files" ON public.session_files
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for session_approval_requests table
CREATE POLICY "Admins can view all session approval requests" ON public.session_approval_requests
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all session approval requests" ON public.session_approval_requests
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all session approval requests" ON public.session_approval_requests
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all session approval requests" ON public.session_approval_requests
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for session_reviews table
CREATE POLICY "Admins can view all session reviews" ON public.session_reviews
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all session reviews" ON public.session_reviews
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all session reviews" ON public.session_reviews
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all session reviews" ON public.session_reviews
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for session_invoices table
CREATE POLICY "Admins can view all session invoices" ON public.session_invoices
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all session invoices" ON public.session_invoices
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all session invoices" ON public.session_invoices
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all session invoices" ON public.session_invoices
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for bookings table
CREATE POLICY "Admins can view all bookings" ON public.bookings
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all bookings" ON public.bookings
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all bookings" ON public.bookings
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all bookings" ON public.bookings
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for designers table
CREATE POLICY "Admins can view all designers" ON public.designers
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all designers" ON public.designers
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all designers" ON public.designers
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all designers" ON public.designers
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for profiles table
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all profiles" ON public.profiles
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for wallet_transactions table
CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all wallet transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all wallet transactions" ON public.wallet_transactions
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all wallet transactions" ON public.wallet_transactions
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for admin_earnings table
CREATE POLICY "Admins can view all admin earnings" ON public.admin_earnings
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all admin earnings" ON public.admin_earnings
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all admin earnings" ON public.admin_earnings
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all admin earnings" ON public.admin_earnings
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for customer_complaints table
CREATE POLICY "Admins can view all customer complaints" ON public.customer_complaints
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all customer complaints" ON public.customer_complaints
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all customer complaints" ON public.customer_complaints
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all customer complaints" ON public.customer_complaints
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for payments table
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all payments" ON public.payments
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all payments" ON public.payments
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all payments" ON public.payments
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for invoices table
CREATE POLICY "Admins can view all invoices" ON public.invoices
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all invoices" ON public.invoices
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all invoices" ON public.invoices
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all invoices" ON public.invoices
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for notifications table
CREATE POLICY "Admins can view all notifications" ON public.notifications
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all notifications" ON public.notifications
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all notifications" ON public.notifications
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all notifications" ON public.notifications
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for session_messages table
CREATE POLICY "Admins can view all session messages" ON public.session_messages
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all session messages" ON public.session_messages
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all session messages" ON public.session_messages
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all session messages" ON public.session_messages
    FOR DELETE USING (public.is_user_admin());

-- Admin policies for file_reviews table
CREATE POLICY "Admins can view all file reviews" ON public.file_reviews
    FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Admins can insert all file reviews" ON public.file_reviews
    FOR INSERT WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all file reviews" ON public.file_reviews
    FOR UPDATE USING (public.is_user_admin());

CREATE POLICY "Admins can delete all file reviews" ON public.file_reviews
    FOR DELETE USING (public.is_user_admin());

-- Create a function to set admin status (only existing admins can use this)
CREATE OR REPLACE FUNCTION public.set_admin_status(target_user_id UUID, admin_status BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only existing admins can set admin status
  IF NOT public.is_user_admin() THEN
    RAISE EXCEPTION 'Only admins can set admin status';
  END IF;
  
  UPDATE public.profiles 
  SET is_admin = admin_status 
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_admin_status(UUID, BOOLEAN) TO authenticated;

-- Insert a comment to track this migration
INSERT INTO public.schema_migrations (version, applied_at) 
VALUES ('20250131000030_admin_rls_policies', NOW())
ON CONFLICT (version) DO NOTHING;
