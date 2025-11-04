-- Add file attachment columns to session_messages table
-- Run this in your Supabase SQL Editor to fix the file upload error
-- This allows files to be sent as chat messages with watermarking support

ALTER TABLE public.session_messages
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS is_watermarked BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.session_messages.file_url IS 'URL of the uploaded file attachment';
COMMENT ON COLUMN public.session_messages.file_name IS 'Original name of the uploaded file';
COMMENT ON COLUMN public.session_messages.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN public.session_messages.is_watermarked IS 'Whether the file has been watermarked (for designer previews)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'session_messages' 
  AND column_name IN ('file_url', 'file_name', 'file_size', 'is_watermarked')
ORDER BY column_name;

