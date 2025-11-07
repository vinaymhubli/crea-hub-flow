const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tndeiiosfbtyzmcwllbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4'
);

async function checkDatabase() {
  console.log('\n=== CHECKING PROFILES TABLE STRUCTURE ===\n');
  
  // Check profiles table columns
  const { data: columns, error: colError } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        ORDER BY ordinal_position;
      `
    })
    .catch(() => {
      // Fallback: try direct query
      return supabase.from('profiles').select('*').limit(0);
    });

  console.log('Profiles columns:', JSON.stringify(columns, null, 2));

  console.log('\n=== CHECKING RLS POLICIES ON PROFILES ===\n');
  
  // Check RLS policies
  const { data: policies, error: polError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public' 
        AND tablename = 'profiles';
      `
    })
    .catch(async () => {
      // Alternative query
      const { data } = await supabase.rpc('get_policies');
      return { data };
    });

  console.log('RLS Policies:', JSON.stringify(policies, null, 2));

  console.log('\n=== CHECKING TRIGGERS ===\n');
  
  // Check triggers
  const { data: triggers } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          event_object_table,
          action_statement
        FROM information_schema.triggers
        WHERE trigger_schema = 'auth'
        AND event_object_table = 'users';
      `
    })
    .catch(() => ({ data: null }));

  console.log('Auth triggers:', JSON.stringify(triggers, null, 2));

  console.log('\n=== TESTING SIGNUP SIMULATION ===\n');
  
  // Try to simulate what happens during signup
  const testEmail = 'test' + Date.now() + '@test.com';
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'Test123456!',
    options: {
      data: {
        first_name: 'Test',
        last_name: 'User',
        role: 'designer',
        user_type: 'designer'
      }
    }
  });

  if (signupError) {
    console.error('Signup error:', signupError);
  } else {
    console.log('Signup successful:', signupData.user?.id);
    
    // Check if profile was created
    if (signupData.user) {
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', signupData.user.id)
        .single();
      
      console.log('Profile created:', profile);
      console.log('Profile error:', profError);
    }
  }
}

checkDatabase().catch(console.error);
