import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tndeiiofbtyzmcwllbx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkLiveDatabase() {
  console.log('🔍 CHECKING LIVE SUPABASE DATABASE\n');
  console.log('=' .repeat(60));

  // 1. Check platform_settings table structure
  console.log('\n📋 1. PLATFORM_SETTINGS TABLE STRUCTURE:');
  console.log('-'.repeat(60));
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Table exists!');
      console.log('📊 Current columns:');
      Object.keys(data[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof data[0][col]} = ${data[0][col]}`);
      });
      
      const hasMinRate = 'min_rate_per_minute' in data[0];
      console.log(`\n${hasMinRate ? '✅' : '❌'} min_rate_per_minute: ${hasMinRate ? 'EXISTS' : 'DOES NOT EXIST'}`);
    } else {
      console.log('⚠️  Table exists but is empty');
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
  }

  // 2. Check designers table
  console.log('\n📋 2. DESIGNERS TABLE:');
  console.log('-'.repeat(60));
  try {
    const { data, error } = await supabase
      .from('designers')
      .select('id, hourly_rate, verification_status')
      .limit(5);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`✅ Table exists with ${data.length} designers (showing max 5)`);
      console.log('📊 Sample data:');
      data.forEach(d => {
        console.log(`   - ID: ${d.id.substring(0, 8)}... Rate: ₹${d.hourly_rate} Status: ${d.verification_status}`);
      });
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
  }

  // 3. Check if get_min_rate_per_minute function exists
  console.log('\n🔧 3. FUNCTION: get_min_rate_per_minute()');
  console.log('-'.repeat(60));
  try {
    const { data, error } = await supabase.rpc('get_min_rate_per_minute');
    if (error) {
      console.log('❌ Function DOES NOT EXIST');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ Function EXISTS');
      console.log(`   Returns: ${data}`);
    }
  } catch (e) {
    console.log('❌ Function DOES NOT EXIST');
  }

  // 4. Query information_schema for table columns
  console.log('\n🔍 4. DETAILED COLUMN CHECK (via query):');
  console.log('-'.repeat(60));
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'platform_settings'
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      console.log('⚠️  Cannot query information_schema directly (requires custom function)');
    } else {
      console.log('✅ Detailed columns:', data);
    }
  } catch (e) {
    console.log('⚠️  Cannot query information_schema (expected)');
  }

  // 5. Check profiles table for admin
  console.log('\n👤 5. PROFILES TABLE (admin check):');
  console.log('-'.repeat(60));
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, is_admin, user_type, first_name, last_name')
      .eq('is_admin', true)
      .limit(3);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`✅ Found ${data.length} admin(s)`);
      data.forEach(p => {
        console.log(`   - ${p.first_name} ${p.last_name} (${p.user_type})`);
      });
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ LIVE DATABASE CHECK COMPLETE!\n');
}

checkLiveDatabase().catch(console.error);

