-- Create admin user with password Admin@123!
-- This migration ensures the admin user exists with the correct password

-- Update password for existing user or create new user
DO $$
DECLARE
    user_exists BOOLEAN;
    admin_user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'meetmydesigners@gmail.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'User meetmydesigners@gmail.com already exists - updating password';
        
        -- Get the user ID
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'meetmydesigners@gmail.com';
        
        -- Update the password for existing user
        UPDATE auth.users 
        SET encrypted_password = crypt('Admin@123!', gen_salt('bf')),
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE email = 'meetmydesigners@gmail.com';
        
        RAISE NOTICE 'Updated password for existing user: %', admin_user_id;
        
        -- Ensure profile exists and is set as admin
        SELECT EXISTS(
            SELECT 1 FROM public.profiles 
            WHERE user_id = admin_user_id
        ) INTO profile_exists;
        
        IF profile_exists THEN
            -- Update existing profile to be admin
            UPDATE public.profiles 
            SET is_admin = true,
                user_type = 'admin',
                updated_at = NOW()
            WHERE user_id = admin_user_id;
            RAISE NOTICE 'Updated existing profile to admin';
        ELSE
            -- Create new admin profile
            INSERT INTO public.profiles (
                user_id, email, first_name, last_name, user_type, is_admin, created_at, updated_at
            ) VALUES (
                admin_user_id, 'meetmydesigners@gmail.com', 'Admin', 'User', 'admin', true, NOW(), NOW()
            );
            RAISE NOTICE 'Created new admin profile';
        END IF;
        
    ELSE
        RAISE NOTICE 'User meetmydesigners@gmail.com does not exist.';
        RAISE NOTICE 'Please create the user account first through the signup process, then run this migration again.';
        RAISE NOTICE 'Or use the Supabase dashboard to create the user manually.';
    END IF;
END $$;
