
-- Enable full row data for realtime on the needed tables
ALTER TABLE public.designers REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;

-- Add the tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.designers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
