
-- 1) Services table
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null,
  title text not null,
  description text,
  category text not null default 'General',
  tags text[] not null default '{}',
  price numeric(10,2) not null,
  currency text not null default 'USD',
  delivery_time_days integer not null default 7,
  revisions integer not null default 1,
  is_active boolean not null default true,
  rating numeric not null default 0,
  reviews_count integer not null default 0,
  cover_image_url text,
  gallery_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- optional FK to designers (public table, ok to reference)
alter table public.services
  add constraint services_designer_fk
  foreign key (designer_id) references public.designers(id) on delete cascade;

-- RLS
alter table public.services enable row level security;

-- Viewable by everyone (anon + authenticated)
drop policy if exists "Services are viewable by everyone" on public.services;
create policy "Services are viewable by everyone"
  on public.services
  for select
  using (true);

-- Designers can create their own services
drop policy if exists "Designers can create their own services" on public.services;
create policy "Designers can create their own services"
  on public.services
  for insert
  with check (
    auth.uid() = (
      select d.user_id from public.designers d where d.id = services.designer_id
    )
  );

-- Designers can update their own services
drop policy if exists "Designers can update their own services" on public.services;
create policy "Designers can update their own services"
  on public.services
  for update
  using (
    auth.uid() = (
      select d.user_id from public.designers d where d.id = services.designer_id
    )
  );

-- Designers can delete their own services
drop policy if exists "Designers can delete their own services" on public.services;
create policy "Designers can delete their own services"
  on public.services
  for delete
  using (
    auth.uid() = (
      select d.user_id from public.designers d where d.id = services.designer_id
    )
  );

-- updated_at trigger
drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at
  before update on public.services
  for each row
  execute function public.update_updated_at_column();

-- indexes
create index if not exists idx_services_designer_id on public.services(designer_id);
create index if not exists idx_services_category on public.services(category);
create index if not exists idx_services_is_active on public.services(is_active);
create index if not exists idx_services_tags_gin on public.services using gin (tags);

-- realtime
alter table public.services replica identity full;
alter publication supabase_realtime add table public.services;

-- 2) Service packages table (Basic/Standard/Premium)
create table if not exists public.service_packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  tier text not null check (tier in ('basic','standard','premium')),
  title text,
  description text,
  price numeric(10,2) not null,
  delivery_time_days integer not null,
  revisions integer not null default 1,
  features text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_packages enable row level security;

-- Viewable by everyone
drop policy if exists "Service packages are viewable by everyone" on public.service_packages;
create policy "Service packages are viewable by everyone"
  on public.service_packages
  for select
  using (true);

-- Owners can insert
drop policy if exists "Owners can create service packages" on public.service_packages;
create policy "Owners can create service packages"
  on public.service_packages
  for insert
  with check (
    auth.uid() = (
      select d.user_id
      from public.services s
      join public.designers d on d.id = s.designer_id
      where s.id = service_packages.service_id
    )
  );

-- Owners can update
drop policy if exists "Owners can update service packages" on public.service_packages;
create policy "Owners can update service packages"
  on public.service_packages
  for update
  using (
    auth.uid() = (
      select d.user_id
      from public.services s
      join public.designers d on d.id = s.designer_id
      where s.id = service_packages.service_id
    )
  );

-- Owners can delete
drop policy if exists "Owners can delete service packages" on public.service_packages;
create policy "Owners can delete service packages"
  on public.service_packages
  for delete
  using (
    auth.uid() = (
      select d.user_id
      from public.services s
      join public.designers d on d.id = s.designer_id
      where s.id = service_packages.service_id
    )
  );

-- updated_at trigger
drop trigger if exists service_packages_updated_at on public.service_packages;
create trigger service_packages_updated_at
  before update on public.service_packages
  for each row
  execute function public.update_updated_at_column();

-- indexes + realtime
create index if not exists idx_service_packages_service_id on public.service_packages(service_id);
alter table public.service_packages replica identity full;
alter publication supabase_realtime add table public.service_packages;

-- 3) Optional FAQs (nice for a Fiverr-like detail page)
create table if not exists public.service_faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

alter table public.service_faqs enable row level security;

drop policy if exists "Service FAQs are viewable by everyone" on public.service_faqs;
create policy "Service FAQs are viewable by everyone"
  on public.service_faqs
  for select
  using (true);

drop policy if exists "Owners can manage FAQs" on public.service_faqs;
create policy "Owners can manage FAQs"
  on public.service_faqs
  for all
  using (
    auth.uid() = (
      select d.user_id
      from public.services s
      join public.designers d on d.id = s.designer_id
      where s.id = service_faqs.service_id
    )
  )
  with check (
    auth.uid() = (
      select d.user_id
      from public.services s
      join public.designers d on d.id = s.designer_id
      where s.id = service_faqs.service_id
    )
  );

-- realtime
alter table public.service_faqs replica identity full;
alter publication supabase_realtime add table public.service_faqs;
