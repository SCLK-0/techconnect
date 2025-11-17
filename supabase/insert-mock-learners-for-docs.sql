-- Mock Learners for Documentation
-- This script creates 6 learners with complete profiles
-- Can be safely deleted after documentation is complete

-- Note: These are mock users for documentation purposes only
-- Run this script in your Supabase SQL Editor

DO $$
DECLARE
  learner1_id UUID := gen_random_uuid();
  learner2_id UUID := gen_random_uuid();
  learner3_id UUID := gen_random_uuid();
  learner4_id UUID := gen_random_uuid();
  learner5_id UUID := gen_random_uuid();
  learner6_id UUID := gen_random_uuid();
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, full_name, bio, avatar_url) VALUES
  (learner1_id, 'Isabella Cruz', 'First year student eager to learn mathematics and programming.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella'),
  (learner2_id, 'Marco Villanueva', 'Engineering student looking for help with physics and calculus.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco'),
  (learner3_id, 'Jasmine Tan', 'Business student interested in improving English communication skills.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine'),
  (learner4_id, 'Rafael Santos', 'Pre-med student seeking chemistry and biology tutoring.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rafael'),
  (learner5_id, 'Gabriela Lopez', 'Computer science freshman learning programming fundamentals.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriela'),
  (learner6_id, 'Daniel Ramos', 'History major looking to deepen understanding of world civilizations.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel');

  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role) VALUES
  (learner1_id, 'learner'),
  (learner2_id, 'learner'),
  (learner3_id, 'learner'),
  (learner4_id, 'learner'),
  (learner5_id, 'learner'),
  (learner6_id, 'learner');

  -- Insert into learner_profiles table
  INSERT INTO public.learner_profiles (user_id, registered_year, subjects_of_interest) VALUES
  (learner1_id, 
   '1st Year',
   ARRAY['Mathematics', 'Programming', 'Computer Science']),
  
  (learner2_id,
   '2nd Year',
   ARRAY['Physics', 'Calculus', 'Engineering', 'Mathematics']),
  
  (learner3_id,
   '3rd Year',
   ARRAY['English', 'Business Communication', 'Writing']),
  
  (learner4_id,
   '1st Year',
   ARRAY['Chemistry', 'Biology', 'Organic Chemistry']),
  
  (learner5_id,
   '1st Year',
   ARRAY['Programming', 'Python', 'JavaScript', 'Web Development']),
  
  (learner6_id,
   '2nd Year',
   ARRAY['History', 'World History', 'Philippine History', 'Social Studies']);

  RAISE NOTICE 'Successfully created 6 mock learners for documentation';
  RAISE NOTICE 'Learner IDs: %, %, %, %, %, %', learner1_id, learner2_id, learner3_id, learner4_id, learner5_id, learner6_id;
END $$;
