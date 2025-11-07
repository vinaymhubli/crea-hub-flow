import pg from 'pg';

const { Client } = pg;

async function checkFunction() {
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

    // Get the function definition
    console.log('📋 enforce_min_rate_on_profiles() function:\n');
    
    const funcResult = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'enforce_min_rate_on_profiles'
      AND pronamespace = 'public'::regnamespace;
    `);

    if (funcResult.rows.length > 0) {
      console.log(funcResult.rows[0].definition);
      console.log('\n🔍 This function is causing the "column designer does not exist" error!\n');
    } else {
      console.log('❌ Function not found');
    }

    await client.end();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end();
  }
}

checkFunction()
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
