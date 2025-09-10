-- Fix RLS policies for session_invoices to allow live session invoices
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invoices from their sessions" ON public.session_invoices;
DROP POLICY IF EXISTS "Designers can create invoices for their sessions" ON public.session_invoices;

-- Create updated RLS policies for session_invoices
-- Users can view invoices from their sessions (both booking and live sessions)
CREATE POLICY "Users can view invoices from their sessions" ON public.session_invoices
    FOR SELECT USING (
        -- For booking sessions
        auth.uid() IN (
            SELECT customer_id FROM public.bookings WHERE id = session_invoices.booking_id
        ) OR
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.bookings b ON b.designer_id = d.id 
            WHERE b.id = session_invoices.booking_id
        ) OR
        -- For live sessions (no booking_id)
        auth.uid() IN (
            SELECT customer_id FROM public.active_sessions a 
            WHERE a.session_id = session_invoices.session_id
        ) OR
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.active_sessions a ON a.designer_id = d.id 
            WHERE a.session_id = session_invoices.session_id
        )
    );

-- Designers can create invoices for their sessions (both booking and live sessions)
CREATE POLICY "Designers can create invoices for their sessions" ON public.session_invoices
    FOR INSERT WITH CHECK (
        -- For booking sessions
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.bookings b ON b.designer_id = d.id 
            WHERE b.id = booking_id
        ) OR
        -- For live sessions (no booking_id)
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.active_sessions a ON a.designer_id = d.id 
            WHERE a.session_id = session_invoices.session_id
        )
    );
