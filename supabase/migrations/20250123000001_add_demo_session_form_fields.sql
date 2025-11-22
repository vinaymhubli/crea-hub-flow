-- Add additional form fields to demo_sessions table
-- These fields capture all information from the demo request form

-- Add new columns if they don't exist
ALTER TABLE public.demo_sessions 
  ADD COLUMN IF NOT EXISTS requester_company TEXT,
  ADD COLUMN IF NOT EXISTS project_type TEXT,
  ADD COLUMN IF NOT EXISTS preferred_date DATE,
  ADD COLUMN IF NOT EXISTS preferred_time TEXT;

-- Make session_id nullable (it's null until admin approves)
-- First drop the NOT NULL constraint if it exists
DO $$ 
BEGIN
  -- Check if NOT NULL constraint exists and drop it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'demo_sessions' 
    AND column_name = 'session_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.demo_sessions ALTER COLUMN session_id DROP NOT NULL;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.demo_sessions.requester_company IS 'Company or organization name from demo request form';
COMMENT ON COLUMN public.demo_sessions.project_type IS 'Type of project (e.g., logo-design, web-design, etc.)';
COMMENT ON COLUMN public.demo_sessions.preferred_date IS 'User preferred date for demo session';
COMMENT ON COLUMN public.demo_sessions.preferred_time IS 'User preferred time slot for demo session';

