-- Add show_free_demo_button column to platform_settings table
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS show_free_demo_button BOOLEAN DEFAULT true;

-- Update existing records to have the default value
UPDATE public.platform_settings 
SET show_free_demo_button = true 
WHERE show_free_demo_button IS NULL;
