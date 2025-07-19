-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create simpler and more permissive policies for avatars
CREATE POLICY "Anyone can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars');

-- Ensure the bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';