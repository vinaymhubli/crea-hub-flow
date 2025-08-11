-- Fix search_path for security functions
DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, user_type, first_name, last_name, specialization, rate_per_minute)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'client'),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'specialization',
    CASE 
      WHEN new.raw_user_meta_data ->> 'rate_per_minute' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'rate_per_minute')::DECIMAL(10,2)
      ELSE NULL
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';