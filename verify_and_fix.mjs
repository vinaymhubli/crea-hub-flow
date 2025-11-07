import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tndeiiosfbtyzmcwllbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4'
);

async function checkAndFix() {
  console.log('\n🔍 Step 1: Testing current signup state...\n');
  
  const testEmail = 'verify' + Date.now() + '@test.com';
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
    console.error('❌ Still failing:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    
    console.log('\n🔧 Step 2: Checking profiles table structure...\n');
    
    // Check what columns actually exist
    const { data: sample, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log('✅ Existing columns in profiles table:');
      console.log(Object.keys(sample[0]).join(', '));
      
      console.log('\n🔧 Step 3: Checking if role column has constraints...\n');
      
      // Try to manually insert a test profile to see what fails
      const testUserId = '00000000-0000-0000-0000-' + Date.now().toString().padStart(12, '0');
      
      const { data: insertTest, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: testUserId,
          user_type: 'designer',
          first_name: 'Test',
          last_name: 'Manual',
          email: 'test@manual.com',
          role: 'designer'
        })
        .select();
      
      if (insertError) {
        console.error('❌ Manual insert error:', insertError.message);
        console.error('Details:', insertError.details);
        console.error('Hint:', insertError.hint);
        console.error('Code:', insertError.code);
        
        // Try with role = 'customer' instead
        console.log('\n🔧 Trying with role = "customer"...\n');
        
        const { data: insertTest2, error: insertError2 } = await supabase
          .from('profiles')
          .insert({
            user_id: testUserId,
            user_type: 'designer',
            first_name: 'Test',
            last_name: 'Manual',
            email: 'test@manual.com',
            role: 'customer'
          })
          .select();
        
        if (insertError2) {
          console.error('❌ Still failing with customer:', insertError2.message);
        } else {
          console.log('✅ Works with role="customer"!');
          console.log('💡 Issue: role constraint only allows "customer", not "designer"');
          
          // Clean up
          await supabase.from('profiles').delete().eq('user_id', testUserId);
        }
      } else {
        console.log('✅ Manual insert worked:', insertTest);
        
        // Clean up
        await supabase.from('profiles').delete().eq('user_id', testUserId);
      }
    }
    
  } else {
    console.log('✅ Signup worked!');
    console.log('User created:', data.user?.email);
    
    // Clean up
    if (data.user) {
      await supabase.auth.admin.deleteUser(data.user.id);
    }
  }
}

checkAndFix()
  .then(() => {
    console.log('\n✅ Diagnostic complete\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
