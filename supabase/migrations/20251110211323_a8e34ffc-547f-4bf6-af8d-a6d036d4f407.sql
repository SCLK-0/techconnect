
-- Fix RLS policies for resources storage bucket to allow authenticated users to upload session assets

-- Allow authenticated users to insert files in their session folders
CREATE POLICY "Users can upload to their session folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources' 
  AND (storage.foldername(name))[1] LIKE 'session-%'
);

-- Allow authenticated users to read files from session folders they're part of
CREATE POLICY "Users can read session files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resources' 
  AND (
    (storage.foldername(name))[1] LIKE 'session-%'
    OR (storage.foldername(name))[1] NOT LIKE 'session-%'
  )
);

-- Allow authenticated users to update files they uploaded
CREATE POLICY "Users can update their uploaded files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'resources' AND auth.uid()::text = owner_id);

-- Allow authenticated users to delete files they uploaded
CREATE POLICY "Users can delete their uploaded files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'resources' AND auth.uid()::text = owner_id);
