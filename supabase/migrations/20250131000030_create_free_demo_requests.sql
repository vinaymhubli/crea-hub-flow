-- Create free_demo_requests table
CREATE TABLE IF NOT EXISTS public.free_demo_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    project_type TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TEXT NOT NULL,
    message TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES auth.users(id),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_free_demo_requests_user_id ON public.free_demo_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_free_demo_requests_status ON public.free_demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_free_demo_requests_assigned_to ON public.free_demo_requests(assigned_to);

-- Enable RLS
ALTER TABLE public.free_demo_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own demo requests" ON public.free_demo_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own demo requests" ON public.free_demo_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own demo requests" ON public.free_demo_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all demo requests" ON public.free_demo_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update all demo requests" ON public.free_demo_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_free_demo_requests_updated_at 
    BEFORE UPDATE ON public.free_demo_requests 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
