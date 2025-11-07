import pg from 'pg';

const { Client } = pg;

async function addLoggingAndTest() {
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

    // Add logging to the function
    console.log('🔧 Adding error logging to trigger...\n');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $function$
      DECLARE
        meta_role text;
        meta_user_type text;
        normalized_user_type text;
        final_role text;
        meta_rate text;
        rate_decimal numeric(10,2);
      BEGIN
        -- Extract metadata safely
        meta_role := NEW.raw_user_meta_data ->> 'role';
        meta_user_type := NEW.raw_user_meta_data ->> 'user_type';
        meta_rate := NEW.raw_user_meta_data ->> 'rate_per_minute';

        RAISE NOTICE 'DEBUG: meta_role=%, meta_user_type=%', meta_role, meta_user_type;

        -- Normalize user_type
        IF COALESCE(meta_role, '') = 'designer' OR COALESCE(meta_user_type, '') IN ('designer', 'professional') THEN
          normalized_user_type := 'designer';
        ELSE
          normalized_user_type := 'client';
        END IF;

        RAISE NOTICE 'DEBUG: normalized_user_type=%', normalized_user_type;

        -- Decide final role
        IF meta_role IN ('customer', 'designer') THEN
          final_role := meta_role;
        ELSE
          final_role := CASE WHEN normalized_user_type = 'designer' THEN 'designer' ELSE 'customer' END;
        END IF;

        RAISE NOTICE 'DEBUG: final_role=%', final_role;

        -- Parse rate
        IF meta_rate IS NOT NULL AND meta_rate <> '' THEN
          BEGIN
            rate_decimal := (meta_rate)::numeric(10,2);
          EXCEPTION WHEN OTHERS THEN
            rate_decimal := NULL;
          END;
        ELSE
          rate_decimal := NULL;
        END IF;

        -- Insert into profiles
        BEGIN
          INSERT INTO public.profiles (
            user_id,
            user_type,
            first_name,
            last_name,
            specialization,
            rate_per_minute,
            email,
            role,
            full_name
          )
          VALUES (
            NEW.id,
            normalized_user_type,
            NEW.raw_user_meta_data ->> 'first_name',
            NEW.raw_user_meta_data ->> 'last_name',
            NEW.raw_user_meta_data ->> 'specialization',
            rate_decimal,
            NEW.email,
            final_role,
            COALESCE(
              NEW.raw_user_meta_data ->> 'full_name',
              TRIM(COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''))
            )
          );
          
          RAISE NOTICE 'DEBUG: Profile inserted successfully for user %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
          RAISE EXCEPTION 'Failed to insert profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        END;

        RETURN NEW;
      END;
      $function$;
    `);

    console.log('✅ Logging added to trigger\n');
    
    // Now check PostgreSQL logs
    console.log('📋 Recent PostgreSQL logs:\n');
    
    const logsResult = await client.query(`
      SELECT * FROM pg_stat_statements 
      WHERE query LIKE '%handle_new_user%' 
      LIMIT 5;
    `).catch(() => ({ rows: [] }));

    if (logsResult.rows.length > 0) {
      console.log(logsResult.rows);
    } else {
      console.log('No logs found (pg_stat_statements may not be enabled)');
    }

    await client.end();
    
    console.log('\n✅ Now try signup again and check Supabase Dashboard > Logs for DEBUG messages\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.end();
  }
}

addLoggingAndTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
