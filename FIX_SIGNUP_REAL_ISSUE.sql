-- ============================================================================
-- REAL FIX FOR SIGNUP ERROR: "Database error saving new user"
-- ============================================================================
-- ROOT CAUSE: enforce_min_rate_on_profiles() function uses DOUBLE QUOTES
-- instead of SINGLE QUOTES, causing PostgreSQL to look for a column named
-- "designer" instead of the string 'designer'
--
-- HOW TO APPLY:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- ============================================================================

-- Fix the enforce_min_rate_on_profiles function
CREATE OR REPLACE FUNCTION public.enforce_min_rate_on_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_min numeric(10,2);
  v_is_designer boolean;
BEGIN
  v_min := public.get_min_rate_per_minute();
  
  -- FIXED: Changed "designer" to 'designer' (double quotes to single quotes)
  v_is_designer := (NEW.user_type = 'designer' OR NEW.role = 'designer');

  IF v_is_designer AND NEW.rate_per_minute IS NOT NULL AND NEW.rate_per_minute < v_min THEN
    RAISE EXCEPTION USING 
      MESSAGE = format('Rate per minute (%s) cannot be below platform minimum (%s).', NEW.rate_per_minute, v_min), 
      ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

-- Add comment
COMMENT ON FUNCTION public.enforce_min_rate_on_profiles() IS 'Enforces minimum rate validation. Fixed Nov 2025: changed double quotes to single quotes to fix "column designer does not exist" error.';

-- ============================================================================
-- That's it! Now signup will work.
-- ============================================================================

