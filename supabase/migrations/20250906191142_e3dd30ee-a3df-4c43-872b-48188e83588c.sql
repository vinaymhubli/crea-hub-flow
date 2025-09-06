
-- 1) Speed up booking-based chat queries
create index if not exists idx_messages_booking_created_at
  on public.messages (booking_id, created_at);

-- Helps unread counts and targeted scans by sender for a booking
create index if not exists idx_messages_booking_sender_created_at
  on public.messages (booking_id, sender_id, created_at);

-- 2) Keep direct conversation recency correct automatically

-- Function to bump last_message_at when a new conversation message arrives
create or replace function public.bump_conversation_last_message_at()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.conversations
    set last_message_at = now(),
        updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

-- Ensure trigger exists and is unique
drop trigger if exists trg_bump_conversation_last_message_at on public.conversation_messages;
create trigger trg_bump_conversation_last_message_at
after insert on public.conversation_messages
for each row
execute function public.bump_conversation_last_message_at();
