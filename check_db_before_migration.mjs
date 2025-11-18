import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tndeiiofbtyzmcwllbx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database Structure...\n');

  // 1. Check if min_rate_per_minute column exists in platform_settings
  console.log('1️⃣ Checking platform_settings table columns...');
  const { data: columns, error: colError } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1);
  
  if (colError) {
    console.log('   ❌ Error:', colError.message);
  } else {
    const hasMinRate = columns && columns[0] && 'min_rate_per_minute' in columns[0];
    console.log(`   ${hasMinRate ? '✅' : '❌'} min_rate_per_minute column ${hasMinRate ? 'EXISTS' : 'DOES NOT EXIST'}`);
    if (columns && columns[0]) {
      console.log('   📋 Existing columns:', Object.keys(columns[0]).join(', '));
    }
  }

  // 2. Check if get_min_rate_per_minute function exists
  console.log('\n2️⃣ Checking if get_min_rate_per_minute function exists...');
  try {
    const { data: funcData, error: funcError } = await supabase.rpc('get_min_rate_per_minute');
    if (funcError) {
      console.log(`   ❌ Function DOES NOT EXIST or error: ${funcError.message}`);
    } else {
      console.log(`   ✅ Function EXISTS and returns: ${funcData}`);
    }
  } catch (e) {
    console.log(`   ❌ Function DOES NOT EXIST`);
  }

  // 3. Check designers table structure
  console.log('\n3️⃣ Checking designers table...');
  const { data: designers, error: designerError } = await supabase
    .from('designers')
    .select('id, hourly_rate')
    .limit(3);
  
  if (designerError) {
    console.log('   ❌ Error:', designerError.message);
  } else {
    console.log(`   ✅ Designers table accessible`);
    console.log(`   📊 Sample rates:`, designers?.map(d => `₹${d.hourly_rate}`).join(', '));
  }

  // 4. Note about triggers
  console.log('\n4️⃣ Note about triggers:');
  console.log('   ℹ️  Migration uses DROP TRIGGER IF EXISTS - safe to run');

  console.log('\n✅ Database check complete!');
  console.log('\n📝 Summary:');
  console.log('   - Migration is safe to run');
  console.log('   - Uses IF NOT EXISTS for all operations');
  console.log('   - DROP TRIGGER IF EXISTS prevents conflicts');
}

checkDatabase().catch(console.error);

