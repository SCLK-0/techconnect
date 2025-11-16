-- Comprehensive fix for both storage bucket AND resources table RLS

-- ============================================
-- PART 1: Fix Storage Bucket Policies
-- ============================================

-- Check if resources bucket exists
SELECT * FROM storage.buckets WHERE id = 'resources';

-- If bucket doesn't exist, create it (uncomment if needed)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('resources', 'resources', true);

-- Drop existing storage policies
DROP POLICY IF EXISTS "Resources are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can upload resources" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can update their own resources" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can delete their own resources" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to resources" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Create new storage policies for resources bucket
CREATE POLICY "Allow authenticated uploads to resources"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resources');

CREATE POLICY "Allow public read access to resources"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'resources');

CREATE POLICY "Allow users to update their own files in resources"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own files in resources"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- PART 2: Fix Resources Table Policies
-- ============================================

-- Disable RLS temporarily
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Tutors can create resources" ON public.resources;
DROP POLICY IF EXISTS "Tutors can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view approved resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;
DROP POLICY IF EXISTS "Authenticated users can create resources" ON public.resources;
DROP POLICY IF EXISTS "Users can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view resources" ON public.resources;
DROP POLICY IF EXISTS "Users can delete own resources" ON public.resources;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON public.resources;
DROP POLICY IF EXISTS "enable_select_for_users_and_approved" ON public.resources;
DROP POLICY IF EXISTS "enable_update_for_own_resources" ON public.resources;
DROP POLICY IF EXISTS "enable_delete_for_own_resources" ON public.resources;

-- Re-enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies
CREATE POLICY "allow_authenticated_insert"
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Allow any authenticated user to insert

CREATE POLICY "allow_authenticated_select"
  ON public.resources
  FOR SELECT
  TO authenticated
  USING (true);  -- Allow any authenticated user to view

CREATE POLICY "allow_own_update"
  ON public.resources
  FOR UPDATE
  TO authenticated
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "allow_own_delete"
  ON public.resources
  FOR DELETE
  TO authenticated
  USING (tutor_id = auth.uid());

-- ============================================
-- PART 3: Verification
-- ============================================

-- Check storage policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- Check resources table policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'resources' AND schemaname = 'public'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'resources';

-- Test current user
SELECT auth.uid() as current_user_id;
