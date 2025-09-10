-- Create session_work_reviews table for tracking work submissions and reviews
CREATE TABLE IF NOT EXISTS public.session_work_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    work_file_id UUID NOT NULL REFERENCES public.session_files(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('designer', 'customer')),
    review_status TEXT NOT NULL CHECK (review_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    review_notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_work_reviews_session_id ON public.session_work_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_session_work_reviews_work_file_id ON public.session_work_reviews(work_file_id);
CREATE INDEX IF NOT EXISTS idx_session_work_reviews_reviewer_id ON public.session_work_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_session_work_reviews_reviewer_type ON public.session_work_reviews(reviewer_type);
CREATE INDEX IF NOT EXISTS idx_session_work_reviews_review_status ON public.session_work_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_session_work_reviews_created_at ON public.session_work_reviews(created_at);

-- Enable RLS
ALTER TABLE public.session_work_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view work reviews from their sessions" ON public.session_work_reviews;
DROP POLICY IF EXISTS "Users can create work reviews for their sessions" ON public.session_work_reviews;
DROP POLICY IF EXISTS "Users can update their own work reviews" ON public.session_work_reviews;

-- RLS Policies for session_work_reviews
-- Users can view work reviews from their sessions
CREATE POLICY "Users can view work reviews from their sessions" ON public.session_work_reviews
    FOR SELECT USING (
        auth.uid() = reviewer_id OR 
        auth.uid() IN (
            SELECT sf.uploaded_by_id FROM public.session_files sf WHERE sf.id = work_file_id
        ) OR
        auth.uid() IN (
            SELECT customer_id FROM public.bookings b 
            JOIN public.session_files sf ON sf.booking_id = b.id 
            WHERE sf.id = work_file_id
        ) OR
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.bookings b ON b.designer_id = d.id 
            JOIN public.session_files sf ON sf.booking_id = b.id 
            WHERE sf.id = work_file_id
        ) OR
        auth.uid() IN (
            SELECT customer_id FROM public.active_sessions a 
            WHERE a.session_id = session_work_reviews.session_id
        ) OR
        auth.uid() IN (
            SELECT d.user_id FROM public.designers d 
            JOIN public.active_sessions a ON a.designer_id = d.id 
            WHERE a.session_id = session_work_reviews.session_id
        )
    );

-- Users can create work reviews for their sessions
CREATE POLICY "Users can create work reviews for their sessions" ON public.session_work_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id AND (
            auth.uid() IN (
                SELECT customer_id FROM public.bookings b 
                JOIN public.session_files sf ON sf.booking_id = b.id 
                WHERE sf.id = work_file_id
            ) OR
            auth.uid() IN (
                SELECT d.user_id FROM public.designers d 
                JOIN public.bookings b ON b.designer_id = d.id 
                JOIN public.session_files sf ON sf.booking_id = b.id 
                WHERE sf.id = work_file_id
            ) OR
            auth.uid() IN (
                SELECT customer_id FROM public.active_sessions a 
                WHERE a.session_id = session_work_reviews.session_id
            ) OR
            auth.uid() IN (
                SELECT d.user_id FROM public.designers d 
                JOIN public.active_sessions a ON a.designer_id = d.id 
                WHERE a.session_id = session_work_reviews.session_id
            )
        )
    );

-- Users can update their own work reviews
CREATE POLICY "Users can update their own work reviews" ON public.session_work_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_session_work_reviews_updated_at ON public.session_work_reviews;

-- Create updated_at trigger for session_work_reviews
CREATE TRIGGER update_session_work_reviews_updated_at 
    BEFORE UPDATE ON public.session_work_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
