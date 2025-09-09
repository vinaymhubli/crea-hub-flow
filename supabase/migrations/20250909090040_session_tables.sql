-- Create session messages table
CREATE TABLE IF NOT EXISTS public.session_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    content TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('designer', 'customer')),
    sender_name TEXT NOT NULL,
    sender_id UUID REFERENCES public.profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session files table
CREATE TABLE IF NOT EXISTS public.session_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_by_type TEXT NOT NULL CHECK (uploaded_by_type IN ('designer', 'customer')),
    uploaded_by_id UUID REFERENCES public.profiles(user_id),
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session invoices table
CREATE TABLE IF NOT EXISTS public.session_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    designer_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    rate_per_minute DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON public.session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_booking_id ON public.session_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created_at ON public.session_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_session_files_session_id ON public.session_files(session_id);
CREATE INDEX IF NOT EXISTS idx_session_files_booking_id ON public.session_files(booking_id);
CREATE INDEX IF NOT EXISTS idx_session_files_created_at ON public.session_files(created_at);

CREATE INDEX IF NOT EXISTS idx_session_invoices_session_id ON public.session_invoices(session_id);
CREATE INDEX IF NOT EXISTS idx_session_invoices_booking_id ON public.session_invoices(booking_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Session messages policies
CREATE POLICY "Users can view messages from their sessions" ON public.session_messages
    FOR SELECT USING (
        auth.uid() IN (
            SELECT sender_id FROM public.session_messages WHERE id = session_messages.id
        ) OR 
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
        auth.uid() IN (
            SELECT uploaded_by_id FROM public.session_files WHERE id = session_files.id
        ) OR 
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

-- Session invoices policies
CREATE POLICY "Users can view invoices from their sessions" ON public.session_invoices
    FOR SELECT USING (
        auth.uid() IN (
            SELECT customer_id FROM public.bookings WHERE id = session_invoices.booking_id
        ) OR
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.bookings b ON b.designer_id = d.id 
            WHERE b.id = session_invoices.booking_id
        )
    );

CREATE POLICY "Designers can create invoices for their sessions" ON public.session_invoices
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.bookings b ON b.designer_id = d.id 
            WHERE b.id = booking_id
        )
    );

-- Create storage bucket for session files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('session-files', 'session-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for session files
CREATE POLICY "Users can upload session files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'session-files' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view session files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'session-files' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their session files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'session-files' AND
        auth.role() = 'authenticated'
    );
