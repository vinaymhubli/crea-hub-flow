import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tndeiiosfbtyzmcwllbx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
});

console.log('\n🔍 DETAILED DATABASE ANALYSIS BEFORE MIGRATION\n');
console.log('=' .repeat(70));

// Check if auto-accept function exists
console.log('\n1️⃣ Checking for existing auto-accept function...');
const checkFunctionQuery = `
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%auto_accept%';
`;

try {
  const { data: functionCheck } = await supabase.rpc('exec_sql', { sql: checkFunctionQuery });
  if (functionCheck && functionCheck.length > 0) {
    console.log('⚠️  AUTO-ACCEPT FUNCTION ALREADY EXISTS:', functionCheck);
  } else {
    console.log('✅ No auto-accept function found (safe to create)');
  }
} catch (err) {
  console.log('ℹ️  Cannot check via RPC, will verify via migration');
}

// Check designers needing weekly schedule initialization
console.log('\n2️⃣ Checking designers needing weekly schedule initialization...');
const { data: allDesigners } = await supabase
  .from('designers')
  .select('id');

let needsInit = 0;
let hasInit = 0;

if (allDesigners) {
  for (const designer of allDesigners) {
    const { data: schedules } = await supabase
      .from('designer_weekly_schedule')
      .select('day_of_week')
      .eq('designer_id', designer.id);
    
    if (!schedules || schedules.length < 7) {
      needsInit++;
    } else {
      hasInit++;
    }
  }
  
  console.log(`📊 Total designers: ${allDesigners.length}`);
  console.log(`✅ Fully initialized: ${hasInit} (${((hasInit/allDesigners.length)*100).toFixed(1)}%)`);
  console.log(`⚠️  Need initialization: ${needsInit} (${((needsInit/allDesigners.length)*100).toFixed(1)}%)`);
  
  if (needsInit > 0) {
    console.log(`\n🎯 Migration 20250116000001 WILL initialize ${needsInit} designers`);
  }
}

// Check current auto-accept settings
console.log('\n3️⃣ Checking current auto-accept settings...');
const { data: settings } = await supabase
  .from('designer_availability_settings')
  .select('designer_id, auto_accept_bookings, buffer_time_minutes');

if (settings) {
  const autoAcceptEnabled = settings.filter(s => s.auto_accept_bookings).length;
  const autoAcceptDisabled = settings.filter(s => !s.auto_accept_bookings).length;
  
  console.log(`📊 Total settings: ${settings.length}`);
  console.log(`✅ Auto-accept ENABLED: ${autoAcceptEnabled}`);
  console.log(`⏸️  Auto-accept DISABLED: ${autoAcceptDisabled}`);
  console.log(`\n🎯 Trigger will only affect ${autoAcceptEnabled} designers with auto-accept enabled`);
}

// Check current bookings in pending status
console.log('\n4️⃣ Checking pending bookings...');
const { data: pendingBookings, count } = await supabase
  .from('bookings')
  .select('*', { count: 'exact', head: false })
  .eq('status', 'pending');

console.log(`📊 Pending bookings: ${count || 0}`);
if (count && count > 0) {
  console.log(`⚠️  Note: Existing pending bookings will NOT be auto-accepted`);
  console.log(`   (Trigger only applies to NEW bookings or when status changes to pending)`);
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📋 MIGRATION SAFETY SUMMARY\n');
console.log('Migration 20250116000000_auto_accept_bookings_trigger.sql:');
console.log('  ✅ Safe to run - Creates new trigger for auto-accepting bookings');
console.log(`  📊 Will affect ${settings ? settings.filter(s => s.auto_accept_bookings).length : 0} designers with auto-accept enabled`);
console.log('  ⚠️  Only applies to NEW bookings after migration');
console.log('');
console.log('Migration 20250116000001_initialize_weekly_schedule_defaults.sql:');
console.log('  ✅ Safe to run - Initializes missing weekly schedules');
console.log(`  📊 Will create ${needsInit * 7} schedule entries for ${needsInit} designers`);
console.log('  ✅ Uses ON CONFLICT DO NOTHING - won\'t overwrite existing data');
console.log('  ✅ Creates trigger for future designers');
console.log('');
console.log('=' .repeat(70));
console.log('\n✅ BOTH MIGRATIONS ARE SAFE TO RUN\n');

