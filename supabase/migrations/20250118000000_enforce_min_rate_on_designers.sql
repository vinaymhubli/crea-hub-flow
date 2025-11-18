-- Enforce minimum rate per minute on designers.hourly_rate
-- This ensures designers cannot set rates below the platform minimum, even if they bypass frontend validation

-- First, add min_rate_per_minute column to platform_settings if it doesn't exist
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS min_rate_per_minute numeric(10,2) DEFAULT 5.0;

-- Update existing rows to have the default minimum rate
UPDATE public.platform_settings 
SET min_rate_per_minute = 5.0 
WHERE min_rate_per_minute IS NULL;

-- Create or replace function to get minimum rate per minute
CREATE OR REPLACE FUNCTION public.get_min_rate_per_minute()
RETURNS numeric(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_min_rate numeric(10,2);
BEGIN
  SELECT min_rate_per_minute INTO v_min_rate
  FROM public.platform_settings
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_min_rate, 5.0); -- Default to 5.0 if no setting found
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_min_rate_per_minute() TO authenticated;

-- Create function to enforce minimum rate on designers table
CREATE OR REPLACE FUNCTION public.enforce_min_rate_on_designers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_min_rate numeric(10,2);
BEGIN
  -- Get platform minimum rate
  v_min_rate := public.get_min_rate_per_minute();
  
  -- Check if hourly_rate is being set below minimum
  IF NEW.hourly_rate IS NOT NULL AND NEW.hourly_rate < v_min_rate THEN
    RAISE EXCEPTION USING 
      MESSAGE = format('Rate per minute (₹%s) cannot be below platform minimum (₹%s).', NEW.hourly_rate, v_min_rate), 
      ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on designers table
DROP TRIGGER IF EXISTS enforce_min_rate_on_designers_trigger ON public.designers;
CREATE TRIGGER enforce_min_rate_on_designers_trigger
  BEFORE INSERT OR UPDATE ON public.designers
  FOR EACH ROW
  WHEN (NEW.hourly_rate IS NOT NULL)
  EXECUTE FUNCTION public.enforce_min_rate_on_designers();

-- Add comment
COMMENT ON FUNCTION public.enforce_min_rate_on_designers() IS 'Enforces minimum rate validation on designers.hourly_rate field. Prevents designers from setting rates below platform minimum.';

