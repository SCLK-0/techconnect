-- FINAL FIX for Resources RLS Policy
-- This will work regardless of has_role function existence
-- Run this script in your Supabase SQL Editor

-- Step 1: Disable RLS temporarily to clean up
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Tutors can create resources" ON public.resources;
DROP POLICY IF EXISTS "Tutors can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view approved resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;
DROP POLICY IF EXISTS "Authenticated users can create resources" ON public.resources;
DROP POLICY IF EXISTS "Users can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view resources" ON public.resources;
DROP POLICY IF EXISTS "Users can delete own resources" ON public.resources;

-- Step 3: Re-enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new simple policies that will definitely work

-- Allow authenticated users to insert resources with their own user_id
CREATE POLICY "enable_insert_for_authenticated_users"
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tutor_id);

-- Allow users to select their own resources or approved ones
CREATE POLICY "enable_select_for_users_and_approved"
  ON public.resources
  FOR SELECT
  TO authenticated
  USING (
    tutor_id = auth.uid() 
    OR status = 'approved'
  );

-- Allow users to update their own resources
CREATE POLICY "enable_update_for_own_resources"
  ON public.resources
  FOR UPDATE
  TO authenticated
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Allow users to delete their own resources
CREATE POLICY "enable_delete_for_own_resources"
  ON public.resources
  FOR DELETE
  TO authenticated
  USING (tutor_id = auth.uid());

-- Step 5: Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual 
    ELSE 'No USING clause' 
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
    ELSE 'No WITH CHECK clause' 
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- Step 6: Test that RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'resources';
