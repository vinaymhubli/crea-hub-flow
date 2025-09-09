-- Drop all policies first
DROP POLICY IF EXISTS "Customers can view their own requests" ON public.live_session_requests;
DROP POLICY IF EXISTS "Designers can view requests to them" ON public.live_session_requests;
DROP POLICY IF EXISTS "Customers can create requests" ON public.live_session_requests;
DROP POLICY IF EXISTS "Designers can update requests to them" ON public.live_session_requests;

-- Drop the trigger
DROP TRIGGER IF EXISTS update_live_session_requests_updated_at ON public.live_session_requests;

-- Drop the function (if it exists and is not used elsewhere)
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop the table completely
DROP TABLE IF EXISTS public.live_session_requests CASCADE;

-- Recreate the table
CREATE TABLE public.live_session_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES public.designers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_live_session_requests_customer_id ON public.live_session_requests(customer_id);
CREATE INDEX idx_live_session_requests_designer_id ON public.live_session_requests(designer_id);
CREATE INDEX idx_live_session_requests_status ON public.live_session_requests(status);
CREATE INDEX idx_live_session_requests_created_at ON public.live_session_requests(created_at);

-- Enable RLS
ALTER TABLE public.live_session_requests ENABLE ROW LEVEL SECURITY;

-- Recreate RLS Policies
-- Customers can see their own requests
CREATE POLICY "Customers can view their own requests" ON public.live_session_requests
    FOR SELECT USING (auth.uid() = customer_id);

-- Designers can see requests sent to them
CREATE POLICY "Designers can view requests to them" ON public.live_session_requests
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.designers WHERE id = designer_id));

-- Customers can insert their own requests
CREATE POLICY "Customers can create requests" ON public.live_session_requests
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Designers can update requests sent to them
CREATE POLICY "Designers can update requests to them" ON public.live_session_requests
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.designers WHERE id = designer_id));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_live_session_requests_updated_at 
    BEFORE UPDATE ON public.live_session_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
