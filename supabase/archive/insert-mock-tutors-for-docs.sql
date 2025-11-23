-- Mock Tutors for Documentation
-- This script creates 6 approved tutors with complete profiles
-- Can be safely deleted after documentation is complete

-- IMPORTANT: This script requires existing user IDs from auth.users
-- You need to either:
-- 1. Create these users through the normal registration process first, OR
-- 2. Replace the user_id values below with actual user IDs from your auth.users table

-- To get existing user IDs, run: SELECT id, email FROM auth.users LIMIT 10;

-- INSTRUCTIONS:
-- 1. First, register 6 test tutor accounts through your app's registration form
-- 2. Get their user IDs from auth.users table
-- 3. Replace the UUIDs below with those actual user IDs
-- 4. Then run this script to update their profiles to approved status with mock data

-- Example with placeholder UUIDs (REPLACE THESE):
DO $$
DECLARE
  -- REPLACE these UUIDs with actual user IDs from your auth.users table
  tutor1_id UUID := '00000000-0000-0000-0000-000000000001'::uuid; -- Replace with real user ID
  tutor2_id UUID := '00000000-0000-0000-0000-000000000002'::uuid; -- Replace with real user ID
  tutor3_id UUID := '00000000-0000-0000-0000-000000000003'::uuid; -- Replace with real user ID
  tutor4_id UUID := '00000000-0000-0000-0000-000000000004'::uuid; -- Replace with real user ID
  tutor5_id UUID := '00000000-0000-0000-0000-000000000005'::uuid; -- Replace with real user ID
  tutor6_id UUID := '00000000-0000-0000-0000-000000000006'::uuid; -- Replace with real user ID
BEGIN
  -- Update existing profiles
  UPDATE public.profiles SET full_name = 'Maria Santos', bio = 'Passionate about mathematics and helping students excel in problem-solving.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria' WHERE user_id = tutor1_id;
  UPDATE public.profiles SET full_name = 'Juan Dela Cruz', bio = 'Computer Science enthusiast with 5 years of programming experience.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan' WHERE user_id = tutor2_id;
  UPDATE public.profiles SET full_name = 'Sofia Reyes', bio = 'English literature graduate dedicated to improving communication skills.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia' WHERE user_id = tutor3_id;
  UPDATE public.profiles SET full_name = 'Carlos Mendoza', bio = 'Physics tutor specializing in mechanics and electromagnetism.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos' WHERE user_id = tutor4_id;
  UPDATE public.profiles SET full_name = 'Ana Garcia', bio = 'Chemistry expert with a focus on organic chemistry and lab techniques.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana' WHERE user_id = tutor5_id;
  UPDATE public.profiles SET full_name = 'Miguel Torres', bio = 'History buff passionate about Philippine history and world civilizations.', avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel' WHERE user_id = tutor6_id;

  -- Ensure tutor role exists
  INSERT INTO public.user_roles (user_id, role) VALUES
  (tutor1_id, 'tutor'),
  (tutor2_id, 'tutor'),
  (tutor3_id, 'tutor'),
  (tutor4_id, 'tutor'),
  (tutor5_id, 'tutor'),
  (tutor6_id, 'tutor')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Update or insert tutor_profiles with approved status
  INSERT INTO public.tutor_profiles (user_id, subject_expertise, bio, status, is_online, registered_year) VALUES
  (tutor1_id, ARRAY['Mathematics', 'Algebra', 'Calculus', 'Statistics'], 'I have been tutoring mathematics for over 3 years. I specialize in making complex concepts easy to understand through real-world examples and interactive problem-solving sessions.', 'approved', true, '4th Year'),
  (tutor2_id, ARRAY['Computer Science', 'Programming', 'Python', 'JavaScript', 'Web Development'], 'Full-stack developer and CS student. I love teaching programming fundamentals and helping students build their first projects. Let''s code together!', 'approved', true, '3rd Year'),
  (tutor3_id, ARRAY['English', 'Literature', 'Writing', 'Grammar'], 'English major with a passion for literature and creative writing. I help students improve their writing skills, grammar, and literary analysis.', 'approved', false, '4th Year'),
  (tutor4_id, ARRAY['Physics', 'Mechanics', 'Electromagnetism', 'Thermodynamics'], 'Physics enthusiast who believes in learning through experiments and visualization. I make physics fun and relatable to everyday life.', 'approved', true, '2nd Year'),
  (tutor5_id, ARRAY['Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Laboratory Techniques'], 'Chemistry graduate student with extensive lab experience. I help students understand chemical reactions, molecular structures, and lab safety.', 'approved', false, '4th Year'),
  (tutor6_id, ARRAY['History', 'Philippine History', 'World History', 'Social Studies'], 'History teacher in training. I bring historical events to life through storytelling and critical analysis. Let''s explore the past together!', 'approved', true, '3rd Year')
  ON CONFLICT (user_id) DO UPDATE SET
    subject_expertise = EXCLUDED.subject_expertise,
    bio = EXCLUDED.bio,
    status = EXCLUDED.status,
    is_online = EXCLUDED.is_online,
    registered_year = EXCLUDED.registered_year;

  RAISE NOTICE 'Successfully updated 6 mock tutors for documentation';
  RAISE NOTICE 'Tutor IDs: %, %, %, %, %, %', tutor1_id, tutor2_id, tutor3_id, tutor4_id, tutor5_id, tutor6_id;
END $$;
