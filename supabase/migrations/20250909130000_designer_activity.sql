-- Create designer_activity table for real-time activity tracking
CREATE TABLE IF NOT EXISTS public.designer_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    designer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activity_status TEXT NOT NULL DEFAULT 'offline' CHECK (activity_status IN ('active', 'idle', 'offline')),
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(designer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_designer_activity_designer_id ON public.designer_activity(designer_id);
CREATE INDEX IF NOT EXISTS idx_designer_activity_last_seen ON public.designer_activity(last_seen);
CREATE INDEX IF NOT EXISTS idx_designer_activity_status ON public.designer_activity(activity_status);
CREATE INDEX IF NOT EXISTS idx_designer_activity_is_online ON public.designer_activity(is_online);

-- Enable RLS
ALTER TABLE public.designer_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Designers can view their own activity
CREATE POLICY "Designers can view their own activity" ON public.designer_activity
    FOR SELECT USING (auth.uid() = designer_id);

-- Designers can update their own activity
CREATE POLICY "Designers can update their own activity" ON public.designer_activity
    FOR UPDATE USING (auth.uid() = designer_id);

-- Designers can insert their own activity
CREATE POLICY "Designers can insert their own activity" ON public.designer_activity
    FOR INSERT WITH CHECK (auth.uid() = designer_id);

-- Anyone can view activity status (for checking if designers are online)
CREATE POLICY "Activity status is viewable by everyone" ON public.designer_activity
    FOR SELECT USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_designer_activity_updated_at 
    BEFORE UPDATE ON public.designer_activity 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
