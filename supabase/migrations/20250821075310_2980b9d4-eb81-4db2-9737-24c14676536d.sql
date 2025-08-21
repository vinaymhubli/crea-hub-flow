-- Create trigger to automatically make demo admin when they sign up
CREATE OR REPLACE FUNCTION public.handle_demo_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this is the demo admin email, make them admin
  IF NEW.email = 'admin@demo.com' THEN
    -- Update the profile that was created by the handle_new_user trigger
    UPDATE public.profiles 
    SET is_admin = true 
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_demo_admin_created ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER on_demo_admin_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_demo_admin_signup();