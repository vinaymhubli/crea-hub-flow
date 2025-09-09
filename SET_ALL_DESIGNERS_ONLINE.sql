-- Set all designers to online for testing
UPDATE public.designers 
SET is_online = true 
WHERE id IS NOT NULL;

-- Verify the update
SELECT id, user_id, is_online, specialty 
FROM public.designers 
ORDER BY created_at DESC;
