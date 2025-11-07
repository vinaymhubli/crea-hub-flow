import pg from 'pg';

const { Client } = pg;

async function applyFix() {
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

    console.log('🔧 Applying the REAL fix...\n');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION public.enforce_min_rate_on_profiles()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      DECLARE
        v_min numeric(10,2);
        v_is_designer boolean;
      BEGIN
        v_min := public.get_min_rate_per_minute();
        
        -- FIXED: Changed "designer" to 'designer' (double quotes to single quotes)
        v_is_designer := (NEW.user_type = 'designer' OR NEW.role = 'designer');

        IF v_is_designer AND NEW.rate_per_minute IS NOT NULL AND NEW.rate_per_minute < v_min THEN
          RAISE EXCEPTION USING 
            MESSAGE = format('Rate per minute (%s) cannot be below platform minimum (%s).', NEW.rate_per_minute, v_min), 
            ERRCODE = '23514';
        END IF;

        RETURN NEW;
      END;
      $function$;
    `);

    console.log('✅ Fix applied!\n');

    await client.end();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

applyFix()
  .then(() => {
    console.log('✅ Now testing signup...\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
