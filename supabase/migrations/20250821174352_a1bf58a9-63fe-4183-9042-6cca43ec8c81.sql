
-- 1) Replace handle_new_user with robust normalization and proper role mapping
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  meta_user_type text;
  normalized_user_type text;
  final_role text;
  meta_rate text;
  rate_decimal numeric(10,2);
begin
  -- Extract metadata safely
  meta_role := new.raw_user_meta_data ->> 'role';
  meta_user_type := new.raw_user_meta_data ->> 'user_type';
  meta_rate := new.raw_user_meta_data ->> 'rate_per_minute';

  -- Normalize user_type to values allowed by check constraint ('client','designer')
  if coalesce(meta_role, '') = 'designer' or coalesce(meta_user_type, '') in ('designer', 'professional') then
    normalized_user_type := 'designer';
  else
    normalized_user_type := 'client';
  end if;

  -- Decide final role; prefer explicit role if valid, else derive from normalized user type
  if meta_role in ('customer', 'designer') then
    final_role := meta_role;
  else
    final_role := case when normalized_user_type = 'designer' then 'designer' else 'customer' end;
  end if;

  -- Parse rate if present
  if meta_rate is not null and meta_rate <> '' then
    begin
      rate_decimal := (meta_rate)::numeric(10,2);
    exception when others then
      rate_decimal := null;
    end;
  else
    rate_decimal := null;
  end if;

  insert into public.profiles (
    user_id,
    user_type,
    first_name,
    last_name,
    specialization,
    rate_per_minute,
    email,
    role
  )
  values (
    new.id,
    normalized_user_type,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'specialization',
    rate_decimal,
    new.email,
    final_role
  );

  return new;
end;
$$;

-- 2) Ensure the trigger exists and points to the updated function
do $$
begin
  if exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'on_auth_user_created'
      and n.nspname = 'auth'
      and c.relname = 'users'
  ) then
    execute 'drop trigger on_auth_user_created on auth.users';
  end if;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
