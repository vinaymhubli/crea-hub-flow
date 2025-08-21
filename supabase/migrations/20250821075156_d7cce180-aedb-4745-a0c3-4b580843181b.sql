-- Create demo admin credentials
-- First, we'll create a function to make any user with demo email an admin
CREATE OR REPLACE FUNCTION public.setup_demo_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update any existing user with demo email to be admin
  UPDATE public.profiles 
  SET is_admin = true 
  WHERE email = 'admin@demo.com';
  
  -- If no user exists, we'll insert a placeholder that will be updated when they sign up
  INSERT INTO public.profiles (user_id, email, is_admin, first_name, last_name, user_type)
  SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@demo.com',
    true,
    'Demo',
    'Admin',
    'admin'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'admin@demo.com'
  );
END;
$$;

-- Execute the function
SELECT public.setup_demo_admin();

-- Create trigger to automatically make demo admin when they sign up
CREATE OR REPLACE FUNCTION public.handle_demo_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this is the demo admin email, make them admin
  IF NEW.email = 'admin@demo.com' THEN
    UPDATE public.profiles 
    SET is_admin = true 
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
CREATE OR REPLACE TRIGGER on_demo_admin_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_demo_admin_signup();