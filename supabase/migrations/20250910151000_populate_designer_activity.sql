-- Populate designer_activity table for all existing designers

-- Insert activity records for all designers who don't have them yet
INSERT INTO public.designer_activity (designer_id, last_seen, activity_status, is_online)
SELECT 
    d.user_id as designer_id,
    NOW() as last_seen,
    'offline' as activity_status,
    COALESCE(d.is_online, false) as is_online
FROM public.designers d
WHERE NOT EXISTS (
    SELECT 1 FROM public.designer_activity da 
    WHERE da.designer_id = d.user_id
)
AND d.user_id IS NOT NULL;

-- Update existing activity records to match the designers table online status
UPDATE public.designer_activity 
SET 
    is_online = d.is_online,
    updated_at = NOW()
FROM public.designers d
WHERE designer_activity.designer_id = d.user_id
AND designer_activity.is_online != d.is_online;

-- Create a function to sync designer online status between tables
CREATE OR REPLACE FUNCTION sync_designer_online_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When designers table is updated, sync to activity table
    IF TG_TABLE_NAME = 'designers' THEN
        INSERT INTO public.designer_activity (designer_id, last_seen, activity_status, is_online)
        VALUES (NEW.user_id, NOW(), CASE WHEN NEW.is_online THEN 'active' ELSE 'offline' END, NEW.is_online)
        ON CONFLICT (designer_id) 
        DO UPDATE SET 
            is_online = NEW.is_online,
            activity_status = CASE WHEN NEW.is_online THEN 'active' ELSE 'offline' END,
            updated_at = NOW();
        RETURN NEW;
    END IF;
    
    -- When activity table is updated, sync to designers table
    IF TG_TABLE_NAME = 'designer_activity' THEN
        UPDATE public.designers 
        SET is_online = NEW.is_online, updated_at = NOW()
        WHERE user_id = NEW.designer_id;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to keep the tables in sync
DROP TRIGGER IF EXISTS sync_designer_status_to_activity ON public.designers;
CREATE TRIGGER sync_designer_status_to_activity
    AFTER UPDATE OF is_online ON public.designers
    FOR EACH ROW EXECUTE FUNCTION sync_designer_online_status();

DROP TRIGGER IF EXISTS sync_activity_status_to_designer ON public.designer_activity;
CREATE TRIGGER sync_activity_status_to_designer
    AFTER UPDATE OF is_online ON public.designer_activity
    FOR EACH ROW EXECUTE FUNCTION sync_designer_online_status();
