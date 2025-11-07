-- Create contact_form_submissions table
CREATE TABLE IF NOT EXISTS public.contact_form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    user_type TEXT,
    priority TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'resolved', 'archived')),
    admin_notes TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    replied_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_user_id ON public.contact_form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_status ON public.contact_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_email ON public.contact_form_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_created_at ON public.contact_form_submissions(created_at);

-- Enable RLS
ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to insert (for public contact form)
CREATE POLICY "Anyone can insert contact form submissions" ON public.contact_form_submissions
    FOR INSERT WITH CHECK (true);

-- Users can view their own submissions
CREATE POLICY "Users can view their own contact submissions" ON public.contact_form_submissions
    FOR SELECT USING (
        user_id IS NULL OR auth.uid() = user_id
    );

-- Admin policies
CREATE POLICY "Admins can view all contact submissions" ON public.contact_form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update all contact submissions" ON public.contact_form_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_contact_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_contact_form_submissions_updated_at 
    BEFORE UPDATE ON public.contact_form_submissions 
    FOR EACH ROW EXECUTE FUNCTION public.update_contact_form_submissions_updated_at();

