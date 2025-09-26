-- Create storage bucket for promotion images

-- Create promotions storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotions',
  'promotions',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for promotions storage
CREATE POLICY "Anyone can view promotion images" ON storage.objects
  FOR SELECT USING (bucket_id = 'promotions');

CREATE POLICY "Authenticated users can upload promotion images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'promotions' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'promotions'
  );

CREATE POLICY "Authenticated users can update promotion images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'promotions' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'promotions'
  );

CREATE POLICY "Authenticated users can delete promotion images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'promotions' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'promotions'
  );
