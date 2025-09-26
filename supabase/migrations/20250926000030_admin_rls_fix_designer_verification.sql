-- Admin RLS fixes for Designer Verification list
-- Ensures admins (profiles.is_admin = true) can read all designers and related profile info

-- Safety: create a helper function to detect admin once and reuse in policies
-- This avoids duplicating subqueries and is easy to reference in USING clauses
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  );
$$;

-- Designers: allow admins to select all rows
drop policy if exists admin_can_select_all_on_designers on public.designers;
create policy admin_can_select_all_on_designers
on public.designers
for select
to authenticated
using (public.is_current_user_admin());

-- Profiles: allow admins to select needed fields for the join in admin screen
drop policy if exists admin_can_select_all_on_profiles on public.profiles;
create policy admin_can_select_all_on_profiles
on public.profiles
for select
to authenticated
using (public.is_current_user_admin());

-- Ensure new designers default to pending if not explicitly set
alter table public.designers
  alter column verification_status set default 'pending';

-- NOTE: We intentionally do NOT add RLS policies on views.
-- Postgres/Supabase applies RLS on the underlying tables referenced by the view.
-- If you want to create a view for convenience, create it separately WITHOUT policies:
-- create or replace view public.admin_designers_view as
-- select d.*, p.first_name, p.last_name, p.email, p.avatar_url
-- from public.designers d
-- left join public.profiles p on p.user_id = d.user_id;


