-- Fix Resources RLS Policy for Tutors
-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- Drop existing policies
DROP POLICY IF EXISTS "Tutors can create resources" ON public.resources;
DROP POLICY IF EXISTS "Tutors can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view approved resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;

-- Recreate policies with proper checks
-- Policy 1: Allow tutors and admins to insert resources
CREATE POLICY "Tutors can create resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    auth.uid() = tutor_id
    AND (
      has_role(auth.uid(), 'tutor') 
      OR has_role(auth.uid(), 'admin')
    )
  );

-- Policy 2: Allow tutors to update their own resources
CREATE POLICY "Tutors can update own resources"
  ON public.resources FOR UPDATE
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

-- Policy 3: Allow users to view approved resources, tutors to view their own, admins to view all
CREATE POLICY "Users can view approved resources"
  ON public.resources FOR SELECT
  USING (
    status = 'approved' 
    OR tutor_id = auth.uid() 
    OR has_role(auth.uid(), 'admin')
  );

-- Policy 4: Allow admins to manage all resources
CREATE POLICY "Admins can manage all resources"
  ON public.resources FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;
