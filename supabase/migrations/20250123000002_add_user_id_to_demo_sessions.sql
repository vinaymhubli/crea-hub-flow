-- Add user_id column to demo_sessions to track logged-in users who submit requests
-- This allows us to distinguish between guest users and logged-in users

ALTER TABLE public.demo_sessions 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_demo_sessions_user_id ON public.demo_sessions(user_id);

-- Update RLS policy to allow authenticated users to insert their own requests
-- (This is in addition to the existing admin-only insert policy)
CREATE POLICY "Users can insert their own demo requests"
    ON public.demo_sessions
    FOR INSERT
    WITH CHECK (
        -- Allow if user is inserting their own request
        (user_id IS NOT NULL AND user_id = auth.uid())
        OR
        -- Allow if user_id is NULL (guest user)
        user_id IS NULL
    );

-- Allow anonymous users to insert demo requests (for guest users)
CREATE POLICY "Anonymous users can insert demo requests"
    ON public.demo_sessions
    FOR INSERT
    WITH CHECK (user_id IS NULL);

-- Comment
COMMENT ON COLUMN public.demo_sessions.user_id IS 'User ID of the logged-in user who submitted the request, NULL for guest users';

