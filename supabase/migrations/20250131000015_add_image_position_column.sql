-- Add image_position column to existing about_page_content table
ALTER TABLE public.about_page_content 
ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center';

-- Update existing data with appropriate image positions
UPDATE public.about_page_content 
SET image_position = 'background' 
WHERE section_type = 'hero';

UPDATE public.about_page_content 
SET image_position = 'right' 
WHERE section_type = 'mission';

UPDATE public.about_page_content 
SET image_position = 'center' 
WHERE section_type IN ('values', 'team', 'cta') 
   OR section_type = 'story' AND title = 'From a simple idea to a leading design collaboration platform';

UPDATE public.about_page_content 
SET image_position = 'left' 
WHERE section_type = 'story' AND title = 'Where It All Started';

UPDATE public.about_page_content 
SET image_position = 'right' 
WHERE section_type = 'story' AND title = 'Scaling New Heights';

UPDATE public.about_page_content 
SET image_position = 'center' 
WHERE section_type IN ('value_item', 'team_member', 'stats');
