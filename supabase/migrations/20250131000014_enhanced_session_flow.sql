-- Enhanced session flow tables for the new STOP & SEND REQUEST APPROVAL functionality

-- Create payments table for session payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('wallet', 'card', 'upi', 'bank_transfer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session reviews table for customer ratings and reviews
CREATE TABLE IF NOT EXISTS public.session_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    designer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session approval requests table to track approval flow
CREATE TABLE IF NOT EXISTS public.session_approval_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    designer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'payment_completed', 'file_uploaded', 'file_downloaded', 'reviewed', 'completed')),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_id UUID REFERENCES public.payments(id),
    file_uploaded_at TIMESTAMP WITH TIME ZONE,
    file_downloaded_at TIMESTAMP WITH TIME ZONE,
    review_id UUID REFERENCES public.session_reviews(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON public.payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_session_reviews_session_id ON public.session_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reviews_customer_id ON public.session_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_session_reviews_designer_name ON public.session_reviews(designer_name);
CREATE INDEX IF NOT EXISTS idx_session_reviews_rating ON public.session_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_session_approval_requests_session_id ON public.session_approval_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_session_approval_requests_designer_id ON public.session_approval_requests(designer_id);
CREATE INDEX IF NOT EXISTS idx_session_approval_requests_customer_id ON public.session_approval_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_session_approval_requests_status ON public.session_approval_requests(status);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for session reviews
CREATE POLICY "Users can view all session reviews" ON public.session_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their sessions" ON public.session_reviews
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own reviews" ON public.session_reviews
    FOR UPDATE USING (auth.uid() = customer_id);

-- RLS Policies for session approval requests
CREATE POLICY "Users can view their session approval requests" ON public.session_approval_requests
    FOR SELECT USING (auth.uid() = designer_id OR auth.uid() = customer_id);

CREATE POLICY "Designers can create approval requests" ON public.session_approval_requests
    FOR INSERT WITH CHECK (auth.uid() = designer_id);

CREATE POLICY "Users can update their session approval requests" ON public.session_approval_requests
    FOR UPDATE USING (auth.uid() = designer_id OR auth.uid() = customer_id);

-- Create updated_at triggers
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_reviews_updated_at 
    BEFORE UPDATE ON public.session_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_approval_requests_updated_at 
    BEFORE UPDATE ON public.session_approval_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add average_rating and total_reviews columns to designers table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designers' AND column_name = 'average_rating') THEN
        ALTER TABLE public.designers ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designers' AND column_name = 'total_reviews') THEN
        ALTER TABLE public.designers ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create a function to update designer ratings when a new review is added
CREATE OR REPLACE FUNCTION update_designer_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the designer's average rating and total reviews count
    UPDATE public.designers 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0.0) 
            FROM public.session_reviews 
            WHERE designer_name = NEW.designer_name
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM public.session_reviews 
            WHERE designer_name = NEW.designer_name
        ),
        updated_at = NOW()
    WHERE user_id IN (
        SELECT user_id 
        FROM public.profiles 
        WHERE CONCAT(first_name, ' ', last_name) = NEW.designer_name
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update designer ratings
CREATE TRIGGER update_designer_rating_trigger
    AFTER INSERT ON public.session_reviews
    FOR EACH ROW EXECUTE FUNCTION update_designer_rating();
