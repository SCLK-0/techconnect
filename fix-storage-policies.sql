-- =============================================
-- FIX STORAGE POLICIES
-- Run this in Supabase SQL Editor to fix avatar upload issues
-- =============================================

-- AVATARS BUCKET POLICIES
-- =============================================

-- Allow public to view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RESOURCES BUCKET POLICIES
-- =============================================

-- Allow public to view resources
CREATE POLICY "Public can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Allow tutors to upload resources
CREATE POLICY "Tutors can upload resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow tutors to update their own resources
CREATE POLICY "Tutors can update own resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow tutors to delete their own resources
CREATE POLICY "Tutors can delete own resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DONATION-PROOFS BUCKET POLICIES
-- =============================================

-- Allow public to view donation proofs
CREATE POLICY "Public can view donation proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'donation-proofs');

-- Allow users to upload donation proofs
CREATE POLICY "Users can upload donation proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'donation-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own donation proofs
CREATE POLICY "Users can update own donation proofs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'donation-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- VERIFICATION
-- Check if policies were created successfully
-- =============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;
