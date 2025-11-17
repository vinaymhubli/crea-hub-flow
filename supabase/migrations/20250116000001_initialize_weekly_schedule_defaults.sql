-- Initialize weekly schedule defaults for existing designers
-- This ensures all designers have entries for all days of the week
-- By default, all days are set to available (is_available = true)

-- Insert default weekly schedule entries for all existing designers
-- Only insert if they don't already have entries for that day
INSERT INTO public.designer_weekly_schedule (designer_id, day_of_week, is_available, start_time, end_time)
SELECT 
  d.id as designer_id,
  day_num.day_of_week,
  true as is_available,  -- Default to available
  '09:00:00'::TIME as start_time,
  '17:00:00'::TIME as end_time
FROM public.designers d
CROSS JOIN (
  SELECT 0 as day_of_week UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
  SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) day_num
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.designer_weekly_schedule dws
  WHERE dws.designer_id = d.id 
    AND dws.day_of_week = day_num.day_of_week
)
ON CONFLICT (designer_id, day_of_week) DO NOTHING;

-- Also ensure that when a new designer is created, they get default weekly schedule entries
-- This is handled by a trigger function
CREATE OR REPLACE FUNCTION public.initialize_designer_weekly_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert default schedule for all 7 days when a new designer is created
  INSERT INTO public.designer_weekly_schedule (designer_id, day_of_week, is_available, start_time, end_time)
  SELECT 
    NEW.id,
    day_num,
    true,  -- Default to available
    '09:00:00'::TIME,
    '17:00:00'::TIME
  FROM generate_series(0, 6) as day_num
  ON CONFLICT (designer_id, day_of_week) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-initialize weekly schedule for new designers
DROP TRIGGER IF EXISTS initialize_weekly_schedule_on_designer_create ON public.designers;
CREATE TRIGGER initialize_weekly_schedule_on_designer_create
  AFTER INSERT ON public.designers
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_designer_weekly_schedule();

