import pg from 'pg';

const { Client } = pg;

async function checkRLS() {
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

    // Check RLS policies on profiles
    console.log('📋 RLS Policies on public.profiles:\n');
    
    const policiesResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public' 
      AND tablename = 'profiles'
      ORDER BY cmd, policyname;
    `);

    if (policiesResult.rows.length > 0) {
      policiesResult.rows.forEach(policy => {
        console.log(`Policy: ${policy.policyname}`);
        console.log(`  Command: ${policy.cmd}`);
        console.log(`  Roles: ${policy.roles}`);
        console.log(`  Using (qual): ${policy.qual || 'N/A'}`);
        console.log(`  With Check: ${policy.with_check || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No RLS policies found');
    }

    // Check if RLS is enabled
    console.log('📋 RLS Status:\n');
    const rlsResult = await client.query(`
      SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public' 
      AND tablename = 'profiles';
    `);

    console.log('RLS Enabled:', rlsResult.rows[0]?.rls_enabled ? 'Yes' : 'No');

    // Try to bypass RLS and insert directly
    console.log('\n🔧 Testing direct INSERT (bypassing RLS)...\n');
    
    const testUserId = crypto.randomUUID();
    
    try {
      await client.query(`
        INSERT INTO public.profiles (
          user_id,
          user_type,
          first_name,
          last_name,
          email,
          role,
          full_name
        )
        VALUES (
          $1,
          'designer',
          'Direct',
          'Test',
          'direct@test.com',
          'designer',
          'Direct Test'
        )
      `, [testUserId]);
      
      console.log('✅ Direct INSERT worked!');
      console.log('💡 This means the trigger function has an RLS issue\n');
      
      // Clean up
      await client.query('DELETE FROM public.profiles WHERE user_id = $1', [testUserId]);
      
    } catch (err) {
      console.error('❌ Direct INSERT failed:', err.message);
      console.error('Code:', err.code);
    }

    await client.end();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end();
  }
}

checkRLS()
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
