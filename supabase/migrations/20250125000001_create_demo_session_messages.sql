-- Create demo session messages table (no foreign key constraints for guest users)
CREATE TABLE IF NOT EXISTS public.demo_session_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('designer', 'customer')),
    sender_name TEXT NOT NULL,
    sender_email TEXT, -- For guest users
    sender_id TEXT, -- Can be UUID for logged-in users or email for guests
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create demo session files table (no foreign key constraints)
CREATE TABLE IF NOT EXISTS public.demo_session_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size <= 2097152), -- 2MB limit for demo sessions
    uploaded_by TEXT NOT NULL,
    uploaded_by_type TEXT NOT NULL CHECK (uploaded_by_type IN ('designer', 'customer')),
    uploaded_by_id TEXT, -- Can be UUID or email
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_demo_session_messages_session_id ON public.demo_session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_demo_session_files_session_id ON public.demo_session_files(session_id);

-- Enable RLS
ALTER TABLE public.demo_session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_session_files ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read demo session messages (for demo purposes)
CREATE POLICY "Anyone can read demo session messages"
    ON public.demo_session_messages
    FOR SELECT
    USING (true);

-- Allow anyone to insert demo session messages (for demo purposes)
CREATE POLICY "Anyone can insert demo session messages"
    ON public.demo_session_messages
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to read demo session files (for demo purposes)
CREATE POLICY "Anyone can read demo session files"
    ON public.demo_session_files
    FOR SELECT
    USING (true);

-- Allow anyone to insert demo session files (for demo purposes)
CREATE POLICY "Anyone can insert demo session files"
    ON public.demo_session_files
    FOR INSERT
    WITH CHECK (true);

-- Add comments
COMMENT ON TABLE public.demo_session_messages IS 
'Messages sent during demo sessions. No foreign key constraints to allow guest users.';

COMMENT ON TABLE public.demo_session_files IS 
'Files shared during demo sessions. No foreign key constraints to allow guest users. Max file size: 2MB.';

