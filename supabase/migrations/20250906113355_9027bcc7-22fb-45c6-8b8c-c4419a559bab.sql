
-- 1) Conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  designer_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint conversations_unique_pair unique (customer_id, designer_id),
  constraint conversations_designer_fk
    foreign key (designer_id) references public.designers(id) on delete cascade
);

alter table public.conversations enable row level security;

-- Helper for updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_timestamp_conversations on public.conversations;
create trigger set_timestamp_conversations
before update on public.conversations
for each row
execute function public.update_updated_at();

-- RLS policies for conversations
drop policy if exists "Participants can view conversation" on public.conversations;
create policy "Participants can view conversation"
on public.conversations
for select
using (
  auth.uid() = customer_id
  or auth.uid() = (
    select d.user_id from public.designers d
    where d.id = public.conversations.designer_id
  )
);

drop policy if exists "Customers can create conversation" on public.conversations;
create policy "Customers can create conversation"
on public.conversations
for insert
with check (
  auth.uid() = customer_id
);

drop policy if exists "Participants can update conversation" on public.conversations;
create policy "Participants can update conversation"
on public.conversations
for update
using (
  auth.uid() = customer_id
  or auth.uid() = (
    select d.user_id from public.designers d
    where d.id = public.conversations.designer_id
  )
)
with check (
  auth.uid() = customer_id
  or auth.uid() = (
    select d.user_id from public.designers d
    where d.id = public.conversations.designer_id
  )
);

-- 2) Conversation messages table
create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  content text not null,
  message_type text not null default 'text',
  file_url text null,
  created_at timestamptz not null default now()
);

alter table public.conversation_messages enable row level security;

-- RLS: participants only
drop policy if exists "Participants can read conversation messages" on public.conversation_messages;
create policy "Participants can read conversation messages"
on public.conversation_messages
for select
using (
  auth.uid() = (
    select c.customer_id from public.conversations c
    where c.id = conversation_id
  )
  or auth.uid() = (
    select d.user_id from public.conversations c
    join public.designers d on d.id = c.designer_id
    where c.id = conversation_id
  )
);

drop policy if exists "Participants can send conversation messages" on public.conversation_messages;
create policy "Participants can send conversation messages"
on public.conversation_messages
for insert
with check (
  auth.uid() = sender_id
  and (
    auth.uid() = (
      select c.customer_id from public.conversations c
      where c.id = conversation_id
    )
    or auth.uid() = (
      select d.user_id from public.conversations c
      join public.designers d on d.id = c.designer_id
      where c.id = conversation_id
    )
  )
);

-- Helpful indexes
create index if not exists idx_conversations_customer on public.conversations (customer_id);
create index if not exists idx_conversations_designer on public.conversations (designer_id);
create index if not exists idx_conversation_messages_conversation on public.conversation_messages (conversation_id, created_at);

-- Realtime configuration
alter table public.conversations replica identity full;
alter table public.conversation_messages replica identity full;

-- Add to supabase realtime publication
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.conversation_messages;
