-- NUCLEAR OPTION - COMPLETE RESET OF DESIGNER ACTIVITY SYSTEM
-- ONLY USE THIS IF THE DEADLOCK FIX DOESN'T WORK

-- WARNING: This will delete all designer activity data!
-- Make sure you really need this before running

-- 1. Drop all problematic triggers and functions first
DROP TRIGGER IF EXISTS sync_designer_status_to_activity ON public.designers CASCADE;
DROP TRIGGER IF EXISTS sync_activity_status_to_designer ON public.designer_activity CASCADE;
DROP TRIGGER IF EXISTS update_designer_activity_updated_at ON public.designer_activity CASCADE;
DROP FUNCTION IF EXISTS sync_designer_online_status() CASCADE;

-- 2. Drop the entire designer_activity table (NUCLEAR OPTION)
DROP TABLE IF EXISTS public.designer_activity CASCADE;

-- 3. Recreate a simple designer_activity table without triggers
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

-- 4. Create simple indexes
CREATE INDEX IF NOT EXISTS idx_designer_activity_designer_id ON public.designer_activity(designer_id);
CREATE INDEX IF NOT EXISTS idx_designer_activity_is_online ON public.designer_activity(is_online);

-- 5. Enable RLS
ALTER TABLE public.designer_activity ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies (no triggers!)
DROP POLICY IF EXISTS "Anyone can view designer activity" ON public.designer_activity;
CREATE POLICY "Anyone can view designer activity" ON public.designer_activity
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Designers can manage their own activity" ON public.designer_activity;
CREATE POLICY "Designers can manage their own activity" ON public.designer_activity
    FOR ALL USING (auth.uid() = designer_id);

-- 7. NO TRIGGERS - Manual sync only!
-- The frontend will handle syncing between tables manually

-- 8. Populate with basic data for existing designers
INSERT INTO public.designer_activity (designer_id, last_seen, activity_status, is_online)
SELECT 
    d.user_id as designer_id,
    NOW() as last_seen,
    'offline' as activity_status,
    COALESCE(d.is_online, false) as is_online
FROM public.designers d
WHERE d.user_id IS NOT NULL
ON CONFLICT (designer_id) DO NOTHING;

-- 9. Verify everything works
SELECT 'SUCCESS: Tables accessible' as status;
SELECT COUNT(*) as designer_count FROM public.designers;
SELECT COUNT(*) as activity_count FROM public.designer_activity;
