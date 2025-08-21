-- Create a simple admin account that will work
-- First, let's try to insert a new user with a simple setup
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
BEGIN
    -- Insert into auth.users with proper password
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'admin@example.com',
        crypt('admin123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Admin", "last_name": "User"}'
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = NOW(),
        role = 'authenticated';
    
    -- Get the user ID (either new or existing)
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@example.com';
    
    -- Create/update profile
    INSERT INTO public.profiles (
        user_id,
        email,
        first_name,
        last_name,
        user_type,
        is_admin,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'admin@example.com',
        'Admin',
        'User',
        'client',
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        is_admin = true,
        email = EXCLUDED.email;
END $$;