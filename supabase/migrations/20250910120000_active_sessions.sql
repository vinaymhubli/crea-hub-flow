-- Create active_sessions table to track ongoing sessions
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    designer_id UUID NOT NULL REFERENCES public.designers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('live_session', 'scheduled_session')) DEFAULT 'live_session',
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'ended')) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_sessions_designer_id ON public.active_sessions(designer_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_customer_id ON public.active_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON public.active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_status ON public.active_sessions(status);
CREATE INDEX IF NOT EXISTS idx_active_sessions_started_at ON public.active_sessions(started_at);

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Designers can view their own active sessions
CREATE POLICY "Designers can view their own active sessions" ON public.active_sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.designers WHERE id = designer_id
        )
    );

-- Customers can view their own active sessions
CREATE POLICY "Customers can view their own active sessions" ON public.active_sessions
    FOR SELECT USING (auth.uid() = customer_id);

-- Designers can insert active sessions for themselves
CREATE POLICY "Designers can create active sessions" ON public.active_sessions
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.designers WHERE id = designer_id
        )
    );

-- Customers can insert active sessions for themselves
CREATE POLICY "Customers can create active sessions" ON public.active_sessions
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Both designers and customers can update their sessions
CREATE POLICY "Users can update their active sessions" ON public.active_sessions
    FOR UPDATE USING (
        auth.uid() = customer_id OR 
        auth.uid() IN (
            SELECT user_id FROM public.designers WHERE id = designer_id
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_active_sessions_updated_at 
    BEFORE UPDATE ON public.active_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add a unique constraint to prevent multiple active sessions per designer
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_sessions_designer_unique 
    ON public.active_sessions(designer_id) 
    WHERE status = 'active';
