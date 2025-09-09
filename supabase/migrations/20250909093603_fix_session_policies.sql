-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON public.session_messages;
DROP POLICY IF EXISTS "Users can insert messages to their sessions" ON public.session_messages;
DROP POLICY IF EXISTS "Users can view files from their sessions" ON public.session_files;
DROP POLICY IF EXISTS "Users can insert files to their sessions" ON public.session_files;

-- Create fixed RLS policies without infinite recursion
-- Session messages policies
CREATE POLICY "Users can view messages from their sessions" ON public.session_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() IN (
            SELECT customer_id FROM public.bookings WHERE id = session_messages.booking_id
        ) OR
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.bookings b ON b.designer_id = d.id 
            WHERE b.id = session_messages.booking_id
        )
    );

CREATE POLICY "Users can insert messages to their sessions" ON public.session_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND (
            auth.uid() IN (
                SELECT customer_id FROM public.bookings WHERE id = booking_id
            ) OR
            auth.uid() IN (
                SELECT d.user_id FROM public.designers d 
                JOIN public.bookings b ON b.designer_id = d.id 
                WHERE b.id = booking_id
            )
        )
    );

-- Session files policies
CREATE POLICY "Users can view files from their sessions" ON public.session_files
    FOR SELECT USING (
        auth.uid() = uploaded_by_id OR 
        auth.uid() IN (
            SELECT customer_id FROM public.bookings WHERE id = session_files.booking_id
        ) OR
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.bookings b ON b.designer_id = d.id 
            WHERE b.id = session_files.booking_id
        )
    );

CREATE POLICY "Users can insert files to their sessions" ON public.session_files
    FOR INSERT WITH CHECK (
        auth.uid() = uploaded_by_id AND (
            auth.uid() IN (
                SELECT customer_id FROM public.bookings WHERE id = booking_id
            ) OR
            auth.uid() IN (
                SELECT d.user_id FROM public.designers d 
                JOIN public.bookings b ON b.designer_id = d.id 
                WHERE b.id = booking_id
            )
        )
    );

-- Allow UPDATE and DELETE operations for completeness
CREATE POLICY "Users can update their own messages" ON public.session_messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.session_messages
    FOR DELETE USING (auth.uid() = sender_id);

CREATE POLICY "Users can update their own files" ON public.session_files
    FOR UPDATE USING (auth.uid() = uploaded_by_id);

CREATE POLICY "Users can delete their own files" ON public.session_files
    FOR DELETE USING (auth.uid() = uploaded_by_id);
