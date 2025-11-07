import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tndeiiosfbtyzmcwllbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4'
);

async function testSignup() {
  console.log('\n🧪 Testing signup with logging enabled...\n');
  
  const testEmail = 'finaltest' + Date.now() + '@test.com';
  console.log('Email:', testEmail);
  console.log('Password: Test123456!');
  console.log('Role: designer\n');
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'Test123456!',
    options: {
      data: {
        first_name: 'Animesh',
        last_name: 'Test',
        role: 'designer',
        user_type: 'designer'
      }
    }
  });

  if (error) {
    console.error('❌ SIGNUP FAILED');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.status);
    console.error('\nFull error:', JSON.stringify(error, null, 2));
    console.error('\n📋 Check Supabase Dashboard > Logs > Postgres Logs for DEBUG messages');
    return false;
  }

  console.log('✅ SIGNUP SUCCESSFUL!');
  console.log('User ID:', data.user?.id);
  console.log('Email:', data.user?.email);
  
  // Wait for trigger
  console.log('\n⏳ Waiting 2 seconds for trigger...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check profile
  if (data.user) {
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();
    
    if (profError) {
      console.error('\n❌ Profile fetch error:', profError.message);
    } else if (profile) {
      console.log('\n✅ PROFILE CREATED!');
      console.log('Profile:', JSON.stringify(profile, null, 2));
      
      // Clean up
      await supabase.auth.admin.deleteUser(data.user.id);
      console.log('\n✅ Test user cleaned up');
      return true;
    } else {
      console.error('\n❌ No profile found - trigger failed silently');
    }
  }
  
  return false;
}

testSignup()
  .then((success) => {
    if (success) {
      console.log('\n🎉 ALL TESTS PASSED! Signup is working!\n');
    } else {
      console.log('\n❌ Tests failed. Check logs above.\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('\n❌ Test error:', err);
    process.exit(1);
  });
