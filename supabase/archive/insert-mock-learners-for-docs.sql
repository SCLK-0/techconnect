-- Mock Learners for Documentation
-- This script creates 6 learners with complete profiles
-- Can be safely deleted after documentation is complete

-- IMPORTANT: This script requires existing user IDs from auth.users
-- You need to either:
-- 1. Create these users through the normal registration process first, OR
-- 2. Replace the user_id values below with actual user IDs from your auth.users table

-- To get existing user IDs, run: SELECT id, email FROM auth.users LIMIT 10;

-- INSTRUCTIONS:
-- 1. First, register 6 test learner accounts through your app's registration form
-- 2. Get their user IDs from auth.users table
-- 3. Replace the UUIDs below with those actual user IDs
-- 4. Then run this script to update their profiles with mock data

-- Example with placeholder UUIDs (REPLACE THESE):
DO $$
DECLARE
  -- REPLACE these UUIDs with actual user IDs from your auth.users table
  learner1_id UUID := '00000000-0000-0000-0000-000000000011'::uuid; -- Replace with real user ID
  learner2_id UUID := '00000000-0000-0000-0000-000000000012'::uuid; -- Replace with real user ID
  learner3_id UUID := '00000000-0000-0000-0000-000000000013'::uuid; -- Replace with real user ID
  learner4_id UUID := '00000000-0000-0000-0000-000000000014'::uuid; -- Replace with real user ID
  learner5_id UUID := '00000000-0000-0000-0000-000000000015'::uuid; -- Replace with real user ID
  learner6_id UUID := '00000000-0000-0000-0000-000000000016'::uuid; -- Replace with real user ID
BEGIN
  -- Update existing profiles
  UPDATE public.profiles SET full_name = 'Isabella Cruz', bio = 'First year student eager to learn mathematics and programming.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella' WHERE user_id = learner1_id;
  UPDATE public.profiles SET full_name = 'Marco Villanueva', bio = 'Engineering student looking for help with physics and calculus.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco' WHERE user_id = learner2_id;
  UPDATE public.profiles SET full_name = 'Jasmine Tan', bio = 'Business student interested in improving English communication skills.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine' WHERE user_id = learner3_id;
  UPDATE public.profiles SET full_name = 'Rafael Santos', bio = 'Pre-med student seeking chemistry and biology tutoring.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rafael' WHERE user_id = learner4_id;
  UPDATE public.profiles SET full_name = 'Gabriela Lopez', bio = 'Computer science freshman learning programming fundamentals.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriela' WHERE user_id = learner5_id;
  UPDATE public.profiles SET full_name = 'Daniel Ramos', bio = 'History major looking to deepen understanding of world civilizations.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel' WHERE user_id = learner6_id;

  -- Ensure learner role exists
  INSERT INTO public.user_roles (user_id, role) VALUES
  (learner1_id, 'learner'),
  (learner2_id, 'learner'),
  (learner3_id, 'learner'),
  (learner4_id, 'learner'),
  (learner5_id, 'learner'),
  (learner6_id, 'learner')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Update or insert learner_profiles
  INSERT INTO public.learner_profiles (user_id, registered_year, subjects_of_interest) VALUES
  (learner1_id, '1st Year', ARRAY['Mathematics', 'Programming', 'Computer Science']),
  (learner2_id, '2nd Year', ARRAY['Physics', 'Calculus', 'Engineering', 'Mathematics']),
  (learner3_id, '3rd Year', ARRAY['English', 'Business Communication', 'Writing']),
  (learner4_id, '1st Year', ARRAY['Chemistry', 'Biology', 'Organic Chemistry']),
  (learner5_id, '1st Year', ARRAY['Programming', 'Python', 'JavaScript', 'Web Development']),
  (learner6_id, '2nd Year', ARRAY['History', 'World History', 'Philippine History', 'Social Studies'])
  ON CONFLICT (user_id) DO UPDATE SET
    registered_year = EXCLUDED.registered_year,
    subjects_of_interest = EXCLUDED.subjects_of_interest;

  RAISE NOTICE 'Successfully updated 6 mock learners for documentation';
  RAISE NOTICE 'Learner IDs: %, %, %, %, %, %', learner1_id, learner2_id, learner3_id, learner4_id, learner5_id, learner6_id;
END $$;
