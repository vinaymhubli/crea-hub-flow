import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tndeiiosfbtyzmcwllbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4',
  {
    db: { schema: 'public' }
  }
);

async function checkTrigger() {
  console.log('\n🔍 Checking handle_new_user function...\n');
  
  // Get function definition
  const { data: funcData, error: funcError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'handle_new_user';
    `
  });

  if (funcError) {
    console.log('Cannot fetch function (trying alternative)...');
  } else {
    console.log('Function definition:', funcData);
  }

  // Check profiles table structure
  console.log('\n📋 Profiles table columns:\n');
  const { data: sample } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (sample && sample.length > 0) {
    console.log('Columns:', Object.keys(sample[0]).join(', '));
  }

  // Try manual insert to test RLS
  console.log('\n🧪 Testing manual profile insert...\n');
  
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const { data: insertData, error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: testUserId,
      user_type: 'client',
      first_name: 'Test',
      last_name: 'Manual',
      email: 'test@manual.com',
      role: 'customer'
    })
    .select();

  if (insertError) {
    console.error('❌ Manual insert failed:', insertError.message);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
  } else {
    console.log('✅ Manual insert successful:', insertData);
    
    // Clean up
    await supabase.from('profiles').delete().eq('user_id', testUserId);
  }
}

checkTrigger()
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Check failed:', err);
    process.exit(1);
  });
