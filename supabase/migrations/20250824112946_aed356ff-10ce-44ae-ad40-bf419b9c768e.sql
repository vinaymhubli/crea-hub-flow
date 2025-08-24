
-- 1) Create portfolio_items table
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references public.designers(id) on delete cascade,
  title text not null,
  description text,
  category text,
  year integer,
  client text,
  project_link text,
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index portfolio_items_designer_id_idx on public.portfolio_items (designer_id);
create index portfolio_items_designer_active_idx on public.portfolio_items (designer_id, is_active);

-- Keep updated_at fresh
create trigger portfolio_items_set_updated_at
before update on public.portfolio_items
for each row execute function public.update_updated_at_column();

-- Enable RLS
alter table public.portfolio_items enable row level security;

-- RLS policies

-- Public can view only active items
create policy "Public can view active portfolio items"
on public.portfolio_items
for select
using (is_active = true);

-- Owners (designers) can view all their items (active + inactive)
create policy "Owners can view their own portfolio items"
on public.portfolio_items
for select
using (
  auth.uid() = (
    select d.user_id from public.designers d where d.id = portfolio_items.designer_id
  )
);

-- Owners can insert their items
create policy "Owners can insert their portfolio items"
on public.portfolio_items
for insert
with check (
  auth.uid() = (
    select d.user_id from public.designers d where d.id = portfolio_items.designer_id
  )
);

-- Owners can update their items
create policy "Owners can update their portfolio items"
on public.portfolio_items
for update
using (
  auth.uid() = (
    select d.user_id from public.designers d where d.id = portfolio_items.designer_id
  )
)
with check (
  auth.uid() = (
    select d.user_id from public.designers d where d.id = portfolio_items.designer_id
  )
);

-- Owners can delete their items
create policy "Owners can delete their portfolio items"
on public.portfolio_items
for delete
using (
  auth.uid() = (
    select d.user_id from public.designers d where d.id = portfolio_items.designer_id
  )
);

-- 2) Storage policies for 'designer-portfolio' bucket
-- Allow public read (useful for listing via API; serving files is already public via the asset server)
create policy "Public can read designer-portfolio"
on storage.objects
for select
using (bucket_id = 'designer-portfolio');

-- Allow authenticated users to upload files only into their own folder: <uid>/<filename>
create policy "Authenticated can upload to own folder (designer-portfolio)"
on storage.objects
for insert
with check (
  bucket_id = 'designer-portfolio'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Allow authenticated users to update files only in their own folder
create policy "Authenticated can update own files (designer-portfolio)"
on storage.objects
for update
using (
  bucket_id = 'designer-portfolio'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'designer-portfolio'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Allow authenticated users to delete files only in their own folder
create policy "Authenticated can delete own files (designer-portfolio)"
on storage.objects
for delete
using (
  bucket_id = 'designer-portfolio'
  and split_part(name, '/', 1) = auth.uid()::text
);
