-- Fix designer_activity table RLS policies and structure issues

-- First, let's check what's causing the 406 errors by updating RLS policies
-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Designers can view their own activity" ON public.designer_activity;
DROP POLICY IF EXISTS "Activity status is viewable by everyone" ON public.designer_activity;

-- Create more permissive policies to debug the issue
-- Allow everyone to read activity status (needed for designer grid)
CREATE POLICY "Anyone can view designer activity" ON public.designer_activity
    FOR SELECT USING (true);

-- Allow designers to manage their own activity
CREATE POLICY "Designers can manage their own activity" ON public.designer_activity
    FOR ALL USING (auth.uid() = designer_id);

-- Ensure the table structure is correct
-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_designer_activity_user_lookup 
ON public.designer_activity(designer_id, is_online, activity_status);

-- Clean up any orphaned records that might be causing issues
-- Remove activity records for non-existent users
DELETE FROM public.designer_activity 
WHERE designer_id NOT IN (
    SELECT id FROM auth.users
);

-- Remove activity records for users who aren't designers
DELETE FROM public.designer_activity 
WHERE designer_id NOT IN (
    SELECT user_id FROM public.designers
);

-- Create a function to help debug activity queries
CREATE OR REPLACE FUNCTION debug_designer_activity(user_uuid UUID)
RETURNS TABLE(
    found_activity BOOLEAN,
    activity_record JSON,
    user_exists BOOLEAN,
    is_designer BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM public.designer_activity WHERE designer_id = user_uuid) as found_activity,
        row_to_json(da.*) as activity_record,
        EXISTS(SELECT 1 FROM auth.users WHERE id = user_uuid) as user_exists,
        EXISTS(SELECT 1 FROM public.designers WHERE user_id = user_uuid) as is_designer
    FROM public.designer_activity da
    WHERE da.designer_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
