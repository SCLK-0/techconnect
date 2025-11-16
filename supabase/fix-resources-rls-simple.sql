-- Simple Fix for Resources RLS Policy (without role check)
-- Use this if the has_role function doesn't exist or if you want a simpler approach

-- Drop existing policies
DROP POLICY IF EXISTS "Tutors can create resources" ON public.resources;
DROP POLICY IF EXISTS "Tutors can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view approved resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;

-- Simple policy: Any authenticated user can insert if they set their own user_id
CREATE POLICY "Authenticated users can create resources"
  ON public.resources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tutor_id);

-- Simple policy: Users can update their own resources
CREATE POLICY "Users can update own resources"
  ON public.resources FOR UPDATE
  TO authenticated
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

-- Simple policy: Users can view approved resources or their own
CREATE POLICY "Users can view resources"
  ON public.resources FOR SELECT
  TO authenticated
  USING (status = 'approved' OR tutor_id = auth.uid());

-- Simple policy: Users can delete their own resources
CREATE POLICY "Users can delete own resources"
  ON public.resources FOR DELETE
  TO authenticated
  USING (auth.uid() = tutor_id);

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;
