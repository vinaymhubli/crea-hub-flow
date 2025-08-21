-- Set admin privileges for the demo admin user
UPDATE public.profiles 
SET is_admin = true 
WHERE user_id = 'f8f3f8d8-cf6f-4263-b564-2e109d911f4b';