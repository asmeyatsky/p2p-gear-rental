-- Supabase Storage Setup for Gear Images
-- Run these commands in your Supabase SQL editor

-- Create storage bucket for gear images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload gear images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'gear-images'
);

-- Allow authenticated users to view all images
CREATE POLICY "Anyone can view gear images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their uploaded images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'gear-images'
);

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update their uploaded images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'gear-images'
);

-- Note: After running these policies, you may also want to set up RLS on the bucket
-- Enable RLS on the bucket (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;