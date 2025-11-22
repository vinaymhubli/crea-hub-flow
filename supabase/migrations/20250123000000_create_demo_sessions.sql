-- Create demo_sessions table for demo video calls
-- Demo sessions are 30-minute free sessions that can be joined by guest users
-- Only admins can create demo sessions

CREATE TABLE IF NOT EXISTS public.demo_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL, -- Unique identifier for the demo session link
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT,
    requester_message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired')),
    scheduled_date TIMESTAMPTZ,
    meeting_link TEXT, -- Generated meeting link
    duration_minutes INTEGER DEFAULT 30, -- Fixed 30 minutes
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_by UUID REFERENCES auth.users(id), -- Admin who created/approved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create demo_session_participants table to track who joined
CREATE TABLE IF NOT EXISTS public.demo_session_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    demo_session_id UUID REFERENCES public.demo_sessions(id) ON DELETE CASCADE,
    participant_name TEXT,
    participant_type TEXT CHECK (participant_type IN ('admin', 'guest')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_demo_sessions_session_id ON public.demo_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_status ON public.demo_sessions(status);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_scheduled_date ON public.demo_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_demo_session_participants_demo_session_id ON public.demo_session_participants(demo_session_id);

-- Enable RLS
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_session_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demo_sessions
-- Admins can view and manage all demo sessions
CREATE POLICY "Admins can view all demo sessions"
    ON public.demo_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND (is_admin = true OR user_type = 'admin')
        )
    );

CREATE POLICY "Admins can insert demo sessions"
    ON public.demo_sessions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND (is_admin = true OR user_type = 'admin')
        )
    );

CREATE POLICY "Admins can update demo sessions"
    ON public.demo_sessions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND (is_admin = true OR user_type = 'admin')
        )
    );

-- Anyone can view demo sessions by session_id (for joining via link)
CREATE POLICY "Anyone can view demo session by session_id"
    ON public.demo_sessions
    FOR SELECT
    USING (true);

-- RLS Policies for demo_session_participants
CREATE POLICY "Admins can view all participants"
    ON public.demo_session_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND (is_admin = true OR user_type = 'admin')
        )
    );

CREATE POLICY "Anyone can insert participant record"
    ON public.demo_session_participants
    FOR INSERT
    WITH CHECK (true);

-- Function to auto-expire demo sessions after 30 minutes
CREATE OR REPLACE FUNCTION auto_expire_demo_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark demo sessions as expired if they started more than 30 minutes ago
    UPDATE public.demo_sessions
    SET status = 'expired',
        ended_at = started_at + INTERVAL '30 minutes',
        updated_at = NOW()
    WHERE status = 'approved'
    AND started_at IS NOT NULL
    AND started_at < NOW() - INTERVAL '30 minutes'
    AND ended_at IS NULL;
END;
$$;

-- Function to generate unique session_id
CREATE OR REPLACE FUNCTION generate_demo_session_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_session_id TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 12-character alphanumeric string
        v_session_id := 'DEMO-' || upper(substring(md5(random()::text) from 1 for 12));
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM public.demo_sessions WHERE session_id = v_session_id) INTO v_exists;
        
        -- If it doesn't exist, return it
        IF NOT v_exists THEN
            RETURN v_session_id;
        END IF;
    END LOOP;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT ON public.demo_sessions TO authenticated;
GRANT SELECT, INSERT ON public.demo_session_participants TO authenticated;
GRANT SELECT ON public.demo_sessions TO anon;
GRANT INSERT ON public.demo_session_participants TO anon;

-- Comments
COMMENT ON TABLE public.demo_sessions IS 'Stores demo video call sessions that can be joined by guest users';
COMMENT ON TABLE public.demo_session_participants IS 'Tracks participants who join demo sessions';
COMMENT ON FUNCTION auto_expire_demo_sessions() IS 'Automatically expires demo sessions after 30 minutes';
COMMENT ON FUNCTION generate_demo_session_id() IS 'Generates unique session IDs for demo sessions';

