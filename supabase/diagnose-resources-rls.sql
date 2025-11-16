-- Diagnostic script to check resources table RLS setup
-- Run this first to understand the current state

-- 1. Check if RLS is enabled on resources table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'resources';

-- 2. Check current policies on resources table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- 3. Check if has_role function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'has_role';

-- 4. Test if current user can insert (this will show the actual error)
-- Replace 'YOUR_USER_ID' with: ad935d36-5b09-4496-a669-4b87a41bef68
SELECT 
  auth.uid() as current_user_id,
  'ad935d36-5b09-4496-a669-4b87a41bef68'::uuid as test_tutor_id,
  auth.uid() = 'ad935d36-5b09-4496-a669-4b87a41bef68'::uuid as ids_match;

-- 5. Check profiles table for this user
SELECT user_id, role 
FROM profiles 
WHERE user_id = 'ad935d36-5b09-4496-a669-4b87a41bef68'::uuid;

-- 6. Check tutor_profiles table for this user
SELECT user_id, status 
FROM tutor_profiles 
WHERE user_id = 'ad935d36-5b09-4496-a669-4b87a41bef68'::uuid;
