-- Quick script to insert a sample promotion for testing
-- Run this in your Supabase SQL editor

INSERT INTO public.promotions (
  title,
  description,
  promotion_type,
  discount_type,
  discount_value,
  discount_code,
  min_order_amount,
  max_discount_amount,
  usage_limit,
  start_date,
  end_date,
  target_audience,
  display_location,
  priority,
  banner_text_color,
  banner_background_color,
  cta_text,
  cta_url,
  admin_notes
) VALUES (
  'Welcome to Meetmydesigners!',
  'Get 20% off your first design session with any of our talented designers. Start your creative journey today!',
  'discount',
  'percentage',
  20.00,
  'WELCOME20',
  500.00,
  1000.00,
  100,
  now(),
  now() + interval '30 days',
  'new_users',
  ARRAY['homepage', 'designers'],
  5,
  '#ffffff',
  '#16a34a',
  'Get Started',
  '/designers',
  'Welcome promotion for new customers - 20% off first session'
);


































