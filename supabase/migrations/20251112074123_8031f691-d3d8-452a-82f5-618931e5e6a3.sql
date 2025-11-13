-- Fix RLS policy for learner_profiles to allow INSERT during registration
-- Drop the existing policy that blocks inserts
DROP POLICY IF EXISTS "Learners can manage own profile" ON public.learner_profiles;

-- Create separate policies for different operations
CREATE POLICY "Learners can view own profile"
  ON public.learner_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Learners can insert own profile during registration"
  ON public.learner_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Learners can update own profile"
  ON public.learner_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Learners can delete own profile"
  ON public.learner_profiles FOR DELETE
  USING (user_id = auth.uid());