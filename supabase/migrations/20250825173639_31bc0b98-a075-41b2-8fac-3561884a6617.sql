-- Add new profile columns for enhanced profile editing
ALTER TABLE public.profiles 
ADD COLUMN bio text,
ADD COLUMN company text,
ADD COLUMN location text,
ADD COLUMN website text;