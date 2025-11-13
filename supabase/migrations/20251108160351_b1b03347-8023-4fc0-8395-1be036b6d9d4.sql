-- Add admin access policies for user_roles table
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add admin access policy for sessions table (already exists but let's verify)
-- The sessions table already has "Admins can manage all sessions" policy

-- Add admin access to view all profiles (already exists - "Users can view all profiles")

-- Test the policies work correctly
-- Admins should now be able to:
-- 1. View all user roles
-- 2. View all sessions
-- 3. View all profiles