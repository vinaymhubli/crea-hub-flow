import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tndeiiosfbtyzmcwllbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4'
);

async function checkDatabase() {
  console.log('\n=== CHECKING PROFILES TABLE STRUCTURE ===\n');
  
  // Get table info using service role
  const { data: tableInfo, error: tableError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('Error querying profiles:', tableError);
  } else {
    console.log('Sample profile structure:', tableInfo);
  }

  console.log('\n=== CHECKING RLS STATUS ===\n');
  
  // Check if RLS is enabled
  const { data: rlsCheck, error: rlsError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public' 
      AND tablename = 'profiles';
    `
  }).catch(() => ({ data: null, error: 'RPC not available' }));

  console.log('RLS status:', rlsCheck || rlsError);

  console.log('\n=== TESTING SIGNUP WITH SERVICE ROLE ===\n');
  
  // Try to simulate what happens during signup
  const testEmail = 'testuser' + Date.now() + '@test.com';
  console.log('Attempting signup with email:', testEmail);
  
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
    console.error('❌ Signup error:', JSON.stringify(signupError, null, 2));
  } else {
    console.log('✅ Signup successful!');
    console.log('User ID:', signupData.user?.id);
    console.log('User email:', signupData.user?.email);
    
    // Wait a bit for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if profile was created
    if (signupData.user) {
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', signupData.user.id)
        .maybeSingle();
      
      if (profError) {
        console.error('❌ Error fetching profile:', profError);
      } else if (profile) {
        console.log('✅ Profile created successfully:', profile);
      } else {
        console.error('❌ No profile found for user');
      }
      
      // Clean up test user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
      if (deleteError) {
        console.log('Note: Could not delete test user:', deleteError.message);
      } else {
        console.log('✅ Test user cleaned up');
      }
    }
  }

  console.log('\n=== CHECKING EXISTING POLICIES ===\n');
  
  // Try to list policies using a query
  const { data: policies } = await supabase
    .from('profiles')
    .select('*')
    .limit(0);
    
  console.log('Query result (checking access):', policies !== undefined ? 'Can query' : 'Cannot query');
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Database check complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Database check failed:', err);
    process.exit(1);
  });
