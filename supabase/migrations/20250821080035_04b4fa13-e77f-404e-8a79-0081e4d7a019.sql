-- Create admin user directly in auth.users and profiles
-- Insert into auth.users table (this is typically managed by Supabase Auth)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@demo.com',
  crypt('AdminDemo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "Demo"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create profile for admin user
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  user_type,
  is_admin,
  created_at,
  updated_at
) 
SELECT 
  u.id,
  'admin@demo.com',
  'Admin',
  'Demo',
  'client',
  true,
  NOW(),
  NOW()
FROM auth.users u 
WHERE u.email = 'admin@demo.com'
ON CONFLICT (user_id) DO UPDATE SET is_admin = true;