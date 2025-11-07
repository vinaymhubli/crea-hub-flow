import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tndeiiosfbtyzmcwllbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4'
);

async function applyFix() {
  console.log('\n🔧 Applying trigger fix...\n');
  
  const sql = `
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create fixed function
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
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('❌ Failed to apply fix:', error.message);
    console.error('Details:', error);
    return false;
  }

  console.log('✅ Trigger fix applied successfully!');
  return true;
}

async function testSignup() {
  console.log('\n🧪 Testing signup after fix...\n');
  
  const testEmail = 'testafter' + Date.now() + '@test.com';
  console.log('Test email:', testEmail);
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'Test123456!',
    options: {
      data: {
        first_name: 'Fixed',
        last_name: 'User',
        role: 'designer',
        user_type: 'designer'
      }
    }
  });

  if (error) {
    console.error('\n❌ Signup still failing:', error.message);
    return false;
  }

  console.log('\n✅ Signup successful!');
  console.log('User ID:', data.user?.id);
  
  // Wait for trigger
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check profile
  if (data.user) {
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();
    
    if (profile) {
      console.log('✅ Profile created:', profile);
      
      // Clean up
      await supabase.auth.admin.deleteUser(data.user.id);
      console.log('✅ Test user cleaned up');
      return true;
    } else {
      console.error('❌ No profile found:', profError);
      return false;
    }
  }
  
  return false;
}

async function main() {
  const fixed = await applyFix();
  if (!fixed) {
    process.exit(1);
  }
  
  const tested = await testSignup();
  if (!tested) {
    process.exit(1);
  }
  
  console.log('\n✅ All done! Signup is now working.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
