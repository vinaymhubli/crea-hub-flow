-- Add status column to session_files table to track review status
ALTER TABLE public.session_files 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested'));

-- Add review-related columns
ALTER TABLE public.session_files 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS reviewed_by_id UUID REFERENCES public.profiles(user_id) NULL,
ADD COLUMN IF NOT EXISTS review_notes TEXT NULL;

-- Create file_reviews table for detailed review history
CREATE TABLE IF NOT EXISTS public.file_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.session_files(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('designer', 'customer')),
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_revision')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_files_status ON public.session_files(status);
CREATE INDEX IF NOT EXISTS idx_session_files_uploaded_by_type ON public.session_files(uploaded_by_type);
CREATE INDEX IF NOT EXISTS idx_session_files_reviewed_at ON public.session_files(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_file_reviews_file_id ON public.file_reviews(file_id);
CREATE INDEX IF NOT EXISTS idx_file_reviews_reviewer_id ON public.file_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_file_reviews_reviewer_type ON public.file_reviews(reviewer_type);
CREATE INDEX IF NOT EXISTS idx_file_reviews_action ON public.file_reviews(action);
CREATE INDEX IF NOT EXISTS idx_file_reviews_created_at ON public.file_reviews(created_at);

-- Enable RLS
ALTER TABLE public.file_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_reviews
-- Users can view reviews of files from their sessions
CREATE POLICY "Users can view file reviews from their sessions" ON public.file_reviews
    FOR SELECT USING (
        reviewer_id = auth.uid() OR 
        auth.uid() IN (
            SELECT sf.uploaded_by_id FROM public.session_files sf WHERE sf.id = file_id
        ) OR
        auth.uid() IN (
            SELECT customer_id FROM public.bookings b 
            JOIN public.session_files sf ON sf.booking_id = b.id 
            WHERE sf.id = file_id
        ) OR
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.bookings b ON b.designer_id = d.id 
            JOIN public.session_files sf ON sf.booking_id = b.id 
            WHERE sf.id = file_id
        )
    );

-- Users can create reviews for files from their sessions
CREATE POLICY "Users can create file reviews for their sessions" ON public.file_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id AND (
            auth.uid() IN (
                SELECT customer_id FROM public.bookings b 
                JOIN public.session_files sf ON sf.booking_id = b.id 
                WHERE sf.id = file_id
            ) OR
            auth.uid() IN (
                SELECT d.user_id FROM public.designers d 
                JOIN public.bookings b ON b.designer_id = d.id 
                JOIN public.session_files sf ON sf.booking_id = b.id 
                WHERE sf.id = file_id
            )
        )
    );

-- Users can update their own reviews
CREATE POLICY "Users can update their own file reviews" ON public.file_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Create updated_at trigger for file_reviews
CREATE TRIGGER update_file_reviews_updated_at 
    BEFORE UPDATE ON public.file_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update session_files status when review is created
CREATE OR REPLACE FUNCTION update_file_status_on_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the session_files table with the review status
    UPDATE public.session_files 
    SET 
        status = CASE 
            WHEN NEW.action = 'approve' THEN 'approved'
            WHEN NEW.action = 'reject' THEN 'rejected'
            WHEN NEW.action = 'request_revision' THEN 'revision_requested'
            ELSE status
        END,
        reviewed_at = NEW.created_at,
        reviewed_by_id = NEW.reviewer_id,
        review_notes = NEW.notes
    WHERE id = NEW.file_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update file status
CREATE TRIGGER update_file_status_trigger
    AFTER INSERT ON public.file_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_file_status_on_review();
