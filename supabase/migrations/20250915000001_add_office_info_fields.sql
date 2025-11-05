-- Add office information fields to contact_page_content table
ALTER TABLE public.contact_page_content 
ADD COLUMN IF NOT EXISTS office_address TEXT,
ADD COLUMN IF NOT EXISTS office_hours TEXT,
ADD COLUMN IF NOT EXISTS public_transport TEXT,
ADD COLUMN IF NOT EXISTS parking_info TEXT,
ADD COLUMN IF NOT EXISTS map_embed_url TEXT,
ADD COLUMN IF NOT EXISTS booking_url TEXT;

-- Update the section_type constraint to include 'office_info'
ALTER TABLE public.contact_page_content 
DROP CONSTRAINT IF EXISTS contact_page_content_section_type_check;

ALTER TABLE public.contact_page_content 
ADD CONSTRAINT contact_page_content_section_type_check 
CHECK (section_type IN ('hero', 'contact_method', 'office_info'));

-- Insert default office information if none exists
INSERT INTO public.contact_page_content (
    section_type,
    title,
    description,
    content,
    icon,
    contact_info,
    action_text,
    color_scheme,
    sort_order,
    is_published,
    office_address,
    office_hours,
    public_transport,
    parking_info,
    map_embed_url,
    booking_url,
    created_at,
    updated_at
) VALUES (
    'office_info',
    'Visit Our Office',
    'Located in the heart of Mumbai''s business district, our office is easily accessible and we''d love to meet you in person.',
    'Office Information',
    'ri-map-pin-line',
    '',
    'Book Appointment',
    'blue',
    100,
    true,
    'Meetmydesignerss Pvt Ltd
Plot No. C-54, G Block
Bandra Kurla Complex
Mumbai, Maharashtra 400051',
    'Monday - Friday: 9:00 AM - 7:00 PM
Saturday: 10:00 AM - 4:00 PM
Sunday: Closed',
    'Kurla Station (5 min walk)
BKC Metro Station (3 min walk)
Multiple bus routes available',
    'Free visitor parking available
Valet service during business hours
EV charging stations on-site',
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.123456789!2d72.8765432!3d19.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c1234567890%3A0x1234567890abcdef!2sBandra%20Kurla%20Complex!5e0!3m2!1sen!2sin!4v1234567890!5m2!1sen!2sin',
    'https://calendly.com/meetmydesigners',
    NOW(),
    NOW()
) ON CONFLICT (section_type) WHERE section_type = 'office_info' DO NOTHING;
