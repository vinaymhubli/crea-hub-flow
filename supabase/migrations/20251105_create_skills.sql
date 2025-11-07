-- Skills master table with admin-managed CRUD and public read
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reuse updated_at trigger
drop trigger if exists trg_skills_updated_at on public.skills;
create trigger trg_skills_updated_at
before update on public.skills
for each row execute function public.set_updated_at();

-- RLS
alter table public.skills enable row level security;

-- Anyone can read skills
drop policy if exists "Skills are viewable by everyone" on public.skills;
create policy "Skills are viewable by everyone"
  on public.skills for select using (true);

-- Only admins can insert/update/delete
drop policy if exists "Admins can manage skills (insert)" on public.skills;
create policy "Admins can manage skills (insert)"
  on public.skills for insert with check (public.is_user_admin());

drop policy if exists "Admins can manage skills (update)" on public.skills;
create policy "Admins can manage skills (update)"
  on public.skills for update using (public.is_user_admin());

drop policy if exists "Admins can manage skills (delete)" on public.skills;
create policy "Admins can manage skills (delete)"
  on public.skills for delete using (public.is_user_admin());


