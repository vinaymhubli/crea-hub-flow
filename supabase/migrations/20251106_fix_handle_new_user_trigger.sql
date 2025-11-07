-- Fix the handle_new_user trigger that's causing signup failures
-- The issue: column "designer" does not exist error

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role text;
  meta_user_type text;
  normalized_user_type text;
  final_role text;
  meta_rate text;
  rate_decimal numeric(10,2);
BEGIN
  -- Extract metadata safely
  meta_role := NEW.raw_user_meta_data ->> 'role';
  meta_user_type := NEW.raw_user_meta_data ->> 'user_type';
  meta_rate := NEW.raw_user_meta_data ->> 'rate_per_minute';

  -- Normalize user_type to values allowed by check constraint ('client','designer')
  IF COALESCE(meta_role, '') = 'designer' OR COALESCE(meta_user_type, '') IN ('designer', 'professional') THEN
    normalized_user_type := 'designer';
  ELSE
    normalized_user_type := 'client';
  END IF;

  -- Decide final role; prefer explicit role if valid, else derive from normalized user type
  IF meta_role IN ('customer', 'designer') THEN
    final_role := meta_role;
  ELSE
    final_role := CASE WHEN normalized_user_type = 'designer' THEN 'designer' ELSE 'customer' END;
  END IF;

  -- Parse rate if present
  IF meta_rate IS NOT NULL AND meta_rate <> '' THEN
    BEGIN
      rate_decimal := (meta_rate)::numeric(10,2);
    EXCEPTION WHEN OTHERS THEN
      rate_decimal := NULL;
    END;
  ELSE
    rate_decimal := NULL;
  END IF;

  -- Insert into profiles with proper column names
  INSERT INTO public.profiles (
    user_id,
    user_type,
    first_name,
    last_name,
    specialization,
    rate_per_minute,
    email,
    role,
    full_name
  )
  VALUES (
    NEW.id,
    normalized_user_type,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'specialization',
    rate_decimal,
    NEW.email,
    final_role,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      TRIM(COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''))
    )
  );

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up. Fixed to handle role/user_type mapping correctly.';

