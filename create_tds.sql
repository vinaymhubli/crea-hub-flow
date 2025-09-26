
-- Create TDS settings if not exists
INSERT INTO public.tds_settings (tds_rate, is_active) 
SELECT 10.00, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.tds_settings WHERE is_active = true
);

