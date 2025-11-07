import pg from 'pg';

const { Client } = pg;

async function findIssue() {
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
    console.log('✅ Connected\n');

    // Check ALL constraints on profiles table
    console.log('📋 ALL Constraints on public.profiles:\n');
    
    const constraintsResult = await client.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'public.profiles'::regclass
      ORDER BY conname;
    `);

    constraintsResult.rows.forEach(row => {
      console.log(`Constraint: ${row.constraint_name}`);
      console.log(`Type: ${row.constraint_type}`);
      console.log(`Definition: ${row.definition}`);
      console.log('');
    });

    // Check ALL triggers on profiles table
    console.log('\n📋 ALL Triggers on public.profiles:\n');
    
    const triggersResult = await client.query(`
      SELECT 
        tgname as trigger_name,
        tgenabled,
        pg_get_triggerdef(oid) as definition
      FROM pg_trigger
      WHERE tgrelid = 'public.profiles'::regclass
      AND tgisinternal = false
      ORDER BY tgname;
    `);

    if (triggersResult.rows.length > 0) {
      triggersResult.rows.forEach(row => {
        console.log(`Trigger: ${row.trigger_name}`);
        console.log(`Enabled: ${row.tgenabled === 'O' ? 'Yes' : 'No'}`);
        console.log(`Definition: ${row.definition}`);
        console.log('');
      });
    } else {
      console.log('No triggers found on profiles table');
    }

    await client.end();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end();
  }
}

findIssue()
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
