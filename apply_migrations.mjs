import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tndeiiosfbtyzmcwllbx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGVpaW9zZmJ0eXptY3dsbGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwNDgxNCwiZXhwIjoyMDY5ODgwODE0fQ.Sy_bIjdZMBUzzwWZM7eS2KKQPZ7FRIX-KYxibfSXkh4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Applying Migrations...\n');

// Read migration files
const migration1 = readFileSync('supabase/migrations/20250116000000_auto_accept_bookings_trigger.sql', 'utf8');
const migration2 = readFileSync('supabase/migrations/20250116000001_initialize_weekly_schedule_defaults.sql', 'utf8');

// Apply migration 1
console.log('1️⃣ Applying auto-accept bookings trigger...');
try {
  // Use fetch to call Supabase REST API for SQL execution
  const response1 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql: migration1 })
  });
  
  if (response1.ok) {
    console.log('✅ Migration 1 applied successfully');
  } else {
    const error = await response1.text();
    console.log('❌ Migration 1 failed:', error);
    console.log('\nℹ️  You need to apply this manually in Supabase SQL Editor');
  }
} catch (err) {
  console.log('❌ Error applying migration 1:', err.message);
  console.log('\nℹ️  You need to apply this manually in Supabase SQL Editor');
}

console.log('');

// Apply migration 2
console.log('2️⃣ Applying weekly schedule initialization...');
try {
  const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql: migration2 })
  });
  
  if (response2.ok) {
    console.log('✅ Migration 2 applied successfully');
  } else {
    const error = await response2.text();
    console.log('❌ Migration 2 failed:', error);
    console.log('\nℹ️  You need to apply this manually in Supabase SQL Editor');
  }
} catch (err) {
  console.log('❌ Error applying migration 2:', err.message);
  console.log('\nℹ️  You need to apply this manually in Supabase SQL Editor');
}

console.log('\n' + '='.repeat(70));
console.log('📋 MANUAL APPLICATION INSTRUCTIONS\n');
console.log('If automatic application failed, apply manually:');
console.log('1. Go to: https://supabase.com/dashboard/project/tndeiiosfbtyzmcwllbx/sql');
console.log('2. Copy content from: supabase/migrations/20250116000000_auto_accept_bookings_trigger.sql');
console.log('3. Paste and run in SQL Editor');
console.log('4. Copy content from: supabase/migrations/20250116000001_initialize_weekly_schedule_defaults.sql');
console.log('5. Paste and run in SQL Editor');
console.log('=' .repeat(70));

