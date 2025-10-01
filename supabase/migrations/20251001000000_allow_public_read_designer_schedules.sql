-- Allow authenticated users (especially clients) to read designer schedules
-- This is needed for availability checking when booking sessions

-- Allow everyone to read weekly schedules (needed for booking availability checks)
CREATE POLICY "Anyone can view designer weekly schedules"
ON public.designer_weekly_schedule
FOR SELECT
USING (true);

-- Allow everyone to read special days (needed for booking availability checks)
CREATE POLICY "Anyone can view designer special days"
ON public.designer_special_days
FOR SELECT
USING (true);

-- Allow everyone to read availability settings (needed for booking flow)
CREATE POLICY "Anyone can view designer availability settings"
ON public.designer_availability_settings
FOR SELECT
USING (true);

