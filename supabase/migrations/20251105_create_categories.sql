-- Categories master table with admin-managed CRUD and public read
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- RLS
alter table public.categories enable row level security;

-- Anyone can read categories
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

-- Only admins can insert/update/delete
drop policy if exists "Admins can manage categories (insert)" on public.categories;
create policy "Admins can manage categories (insert)"
  on public.categories for insert with check (public.is_user_admin());

drop policy if exists "Admins can manage categories (update)" on public.categories;
create policy "Admins can manage categories (update)"
  on public.categories for update using (public.is_user_admin());

drop policy if exists "Admins can manage categories (delete)" on public.categories;
create policy "Admins can manage categories (delete)"
  on public.categories for delete using (public.is_user_admin());


