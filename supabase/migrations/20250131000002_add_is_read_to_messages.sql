-- Add is_read column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Add is_read column to conversation_messages table
ALTER TABLE public.conversation_messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Create index for better performance on unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_booking_is_read 
ON public.messages (booking_id, is_read, created_at);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_is_read 
ON public.conversation_messages (conversation_id, is_read, created_at);
