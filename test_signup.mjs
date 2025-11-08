import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tndeiiosfbtyzmcwllbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4'
);

async function testSignup() {
  console.log('\n🔍 Testing signup flow...\n');
  
  // ⚠️ WARNING: Using @test.com will cause email bounces from Supabase Auth
  // This can lead to email sending privileges being disabled
  // For testing, use a real email address or disable email confirmation in Supabase dashboard
  const testEmail = 'testuser' + Date.now() + '@test.com';
  console.log('⚠️  WARNING: Test email will cause bounce:', testEmail);
  console.log('   Consider using a real email or disabling email confirmation for testing\n');
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'Test123456!',
    options: {
      data: {
        first_name: 'New',
        last_name: 'User',
        role: 'designer',
        user_type: 'designer'
      }
    }
  });

  if (error) {
    console.error('\n❌ SIGNUP FAILED:');
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return;
  }

  console.log('\n✅ Signup API call successful');
  console.log('User ID:', data.user?.id);
  console.log('User email:', data.user?.email);
  
  // Wait for trigger to execute
  console.log('\n⏳ Waiting 3 seconds for database trigger...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if profile was created
  if (data.user) {
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();
    
    if (profError) {
      console.error('\n❌ Error fetching profile:', profError.message);
      console.error('Full error:', JSON.stringify(profError, null, 2));
    } else if (profile) {
      console.log('\n✅ Profile created successfully!');
      console.log('Profile data:', JSON.stringify(profile, null, 2));
    } else {
      console.error('\n❌ No profile found - trigger may have failed');
    }
    
    // Clean up
    console.log('\n🧹 Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id);
    if (deleteError) {
      console.log('⚠️  Could not delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user deleted');
    }
  }
}

testSignup()
  .then(() => {
    console.log('\n✅ Test complete\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Test failed:', err.message);
    console.error(err);
    process.exit(1);
  });
