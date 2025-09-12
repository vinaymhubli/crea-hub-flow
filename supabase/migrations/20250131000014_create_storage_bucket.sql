-- Create storage bucket for about page images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public access to uploaded images
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'public');

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'public' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to update their own images
CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'public' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'public' 
  AND auth.role() = 'authenticated'
);
