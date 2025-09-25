-- Add missing scheduled_for column to announcements table
-- This column is needed for scheduling announcements

-- Add the scheduled_for column to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN public.announcements.scheduled_for IS 'Optional timestamp for when the announcement should be sent. If null, announcement is sent immediately.';

-- Update the table to ensure it has all required columns
-- Check if other columns exist and add them if missing
DO $$
BEGIN
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'title') THEN
        ALTER TABLE public.announcements ADD COLUMN title TEXT;
    END IF;
    
    -- Add message column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'message') THEN
        ALTER TABLE public.announcements ADD COLUMN message TEXT;
    END IF;
    
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'type') THEN
        ALTER TABLE public.announcements ADD COLUMN type TEXT;
    END IF;
    
    -- Add target column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'target') THEN
        ALTER TABLE public.announcements ADD COLUMN target TEXT;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_active') THEN
        ALTER TABLE public.announcements ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'created_by') THEN
        ALTER TABLE public.announcements ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create the announcements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    target TEXT NOT NULL DEFAULT 'all_users',
    is_active BOOLEAN DEFAULT true,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Users can read active announcements" ON public.announcements;

-- Policy for admins to manage announcements
CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR is_admin = true)
        )
    );

-- Policy for users to read active announcements
CREATE POLICY "Users can read active announcements" ON public.announcements
    FOR SELECT USING (is_active = true);

-- Grant permissions
GRANT ALL ON public.announcements TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
