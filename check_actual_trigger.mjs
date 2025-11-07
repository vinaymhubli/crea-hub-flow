import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Client } = pg;

async function checkTrigger() {
  console.log('\n🔍 Connecting directly to PostgreSQL...\n');
  
  const client = new Client({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.tndeiiosfbtyzmcwllbx',
    password: 'silverandromache@tiffincrane.com',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get the actual trigger function
    console.log('📋 Current handle_new_user function:\n');
    const funcResult = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'handle_new_user'
      AND pronamespace = 'public'::regnamespace;
    `);

    if (funcResult.rows.length > 0) {
      console.log(funcResult.rows[0].definition);
    } else {
      console.log('❌ Function not found!');
    }

    // Check trigger
    console.log('\n📋 Trigger on auth.users:\n');
    const triggerResult = await client.query(`
      SELECT tgname, tgenabled, pg_get_triggerdef(oid) as definition
      FROM pg_trigger
      WHERE tgrelid = 'auth.users'::regclass
      AND tgname = 'on_auth_user_created';
    `);

    if (triggerResult.rows.length > 0) {
      console.log('Trigger name:', triggerResult.rows[0].tgname);
      console.log('Enabled:', triggerResult.rows[0].tgenabled === 'O' ? 'Yes' : 'No');
      console.log('Definition:', triggerResult.rows[0].definition);
    } else {
      console.log('❌ Trigger not found!');
    }

    // Check role column constraint
    console.log('\n📋 Checking role column constraints:\n');
    const constraintResult = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'public.profiles'::regclass
      AND conname LIKE '%role%';
    `);

    if (constraintResult.rows.length > 0) {
      constraintResult.rows.forEach(row => {
        console.log(`Constraint: ${row.conname}`);
        console.log(`Definition: ${row.definition}\n`);
      });
    } else {
      console.log('No role constraints found');
    }

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end();
  }
}

checkTrigger()
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  });
