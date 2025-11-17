import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tndeiiosfbtyzmcwllbx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking Database Structure...\n');

// 1. Check designer_weekly_schedule structure
console.log('1️⃣ Checking designer_weekly_schedule table...');
const { data: scheduleData, error: scheduleError } = await supabase
  .from('designer_weekly_schedule')
  .select('*')
  .limit(5);

if (scheduleError) {
  console.log('❌ Error querying designer_weekly_schedule:', scheduleError.message);
} else {
  console.log('✅ designer_weekly_schedule exists');
  console.log('Sample data:', JSON.stringify(scheduleData, null, 2));
}

// 2. Check designer_availability_settings
console.log('\n2️⃣ Checking designer_availability_settings table...');
const { data: settingsData, error: settingsError } = await supabase
  .from('designer_availability_settings')
  .select('*')
  .limit(5);

if (settingsError) {
  console.log('❌ Error querying designer_availability_settings:', settingsError.message);
} else {
  console.log('✅ designer_availability_settings exists');
  console.log('Sample data:', JSON.stringify(settingsData, null, 2));
}

// 3. Check designer_slots
console.log('\n3️⃣ Checking designer_slots table...');
const { data: slotsData, error: slotsError } = await supabase
  .from('designer_slots')
  .select('*')
  .limit(5);

if (slotsError) {
  console.log('❌ Error querying designer_slots:', slotsError.message);
} else {
  console.log('✅ designer_slots exists');
  console.log('Sample data:', JSON.stringify(slotsData, null, 2));
}

// 4. Check bookings table structure
console.log('\n4️⃣ Checking bookings table...');
const { data: bookingsData, error: bookingsError } = await supabase
  .from('bookings')
  .select('id, status, scheduled_date, duration_hours, designer_id, customer_id')
  .limit(3);

if (bookingsError) {
  console.log('❌ Error querying bookings:', bookingsError.message);
} else {
  console.log('✅ bookings table exists');
  console.log('Sample data:', JSON.stringify(bookingsData, null, 2));
}

// 5. Check if designers have weekly schedule entries
console.log('\n5️⃣ Checking designers with incomplete weekly schedules...');
const { data: designersData, error: designersError } = await supabase
  .from('designers')
  .select('id')
  .limit(5);

if (!designersError && designersData) {
  for (const designer of designersData) {
    const { data: schedules, error } = await supabase
      .from('designer_weekly_schedule')
      .select('day_of_week')
      .eq('designer_id', designer.id);
    
    if (!error) {
      console.log(`Designer ${designer.id}: ${schedules.length}/7 days configured`);
      if (schedules.length < 7) {
        const missingDays = [0,1,2,3,4,5,6].filter(day => !schedules.some(s => s.day_of_week === day));
        console.log(`  Missing days: ${missingDays.join(', ')}`);
      }
    }
  }
}

// 6. Check if auto-accept trigger exists using RPC
console.log('\n6️⃣ Checking for existing triggers and functions...');
const { data: functionsData, error: functionsError } = await supabase.rpc('exec_sql', {
  sql: `
    SELECT 
      trigger_name,
      event_object_table,
      action_timing,
      event_manipulation
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
    AND event_object_table = 'bookings';
  `
}).catch(err => {
  console.log('ℹ️  Cannot check triggers via RPC (expected if function not available)');
  return { data: null, error: err };
});

if (functionsData) {
  console.log('Existing triggers on bookings:', JSON.stringify(functionsData, null, 2));
}

// 7. Check notifications table structure
console.log('\n7️⃣ Checking notifications table...');
const { data: notificationsData, error: notificationsError } = await supabase
  .from('notifications')
  .select('*')
  .limit(1);

if (notificationsError) {
  console.log('❌ Error querying notifications:', notificationsError.message);
} else {
  console.log('✅ notifications table exists');
}

console.log('\n✅ Database structure check complete!');

