-- Allow 'admin' as a valid user_type in profiles table
-- This makes the admin system cleaner and more explicit

-- Drop the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Add the new check constraint that includes 'admin'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('client', 'designer', 'admin'));

-- Update the admin user to use 'admin' user_type
UPDATE public.profiles 
SET user_type = 'admin'
WHERE email = 'meetmydesigners@gmail.com' AND is_admin = true;

-- Verify the change
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM public.profiles 
    WHERE user_type = 'admin' AND is_admin = true;
    
    IF admin_count > 0 THEN
        RAISE NOTICE 'Successfully updated % admin user(s) to use admin user_type', admin_count;
    ELSE
        RAISE NOTICE 'No admin users found to update';
    END IF;
END $$;
