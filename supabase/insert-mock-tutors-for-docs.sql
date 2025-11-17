-- Mock Tutors for Documentation
-- This script creates 6 approved tutors with complete profiles
-- Can be safely deleted after documentation is complete

-- Note: These are mock users for documentation purposes only
-- Run this script in your Supabase SQL Editor

-- Insert mock users into auth.users (if using Supabase Auth)
-- You may need to adjust this based on your auth setup

DO $$
DECLARE
  tutor1_id UUID := gen_random_uuid();
  tutor2_id UUID := gen_random_uuid();
  tutor3_id UUID := gen_random_uuid();
  tutor4_id UUID := gen_random_uuid();
  tutor5_id UUID := gen_random_uuid();
  tutor6_id UUID := gen_random_uuid();
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, full_name, bio, avatar_url) VALUES
  (tutor1_id, 'Maria Santos', 'Passionate about mathematics and helping students excel in problem-solving.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'),
  (tutor2_id, 'Juan Dela Cruz', 'Computer Science enthusiast with 5 years of programming experience.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan'),
  (tutor3_id, 'Sofia Reyes', 'English literature graduate dedicated to improving communication skills.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia'),
  (tutor4_id, 'Carlos Mendoza', 'Physics tutor specializing in mechanics and electromagnetism.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'),
  (tutor5_id, 'Ana Garcia', 'Chemistry expert with a focus on organic chemistry and lab techniques.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'),
  (tutor6_id, 'Miguel Torres', 'History buff passionate about Philippine history and world civilizations.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel');

  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role) VALUES
  (tutor1_id, 'tutor'),
  (tutor2_id, 'tutor'),
  (tutor3_id, 'tutor'),
  (tutor4_id, 'tutor'),
  (tutor5_id, 'tutor'),
  (tutor6_id, 'tutor');

  -- Insert into tutor_profiles table with approved status
  INSERT INTO public.tutor_profiles (user_id, subject_expertise, bio, status, is_online, registered_year) VALUES
  (tutor1_id, 
   ARRAY['Mathematics', 'Algebra', 'Calculus', 'Statistics'], 
   'I have been tutoring mathematics for over 3 years. I specialize in making complex concepts easy to understand through real-world examples and interactive problem-solving sessions.',
   'approved',
   true,
   '4th Year'),
  
  (tutor2_id,
   ARRAY['Computer Science', 'Programming', 'Python', 'JavaScript', 'Web Development'],
   'Full-stack developer and CS student. I love teaching programming fundamentals and helping students build their first projects. Let''s code together!',
   'approved',
   true,
   '3rd Year'),
  
  (tutor3_id,
   ARRAY['English', 'Literature', 'Writing', 'Grammar'],
   'English major with a passion for literature and creative writing. I help students improve their writing skills, grammar, and literary analysis.',
   'approved',
   false,
   '4th Year'),
  
  (tutor4_id,
   ARRAY['Physics', 'Mechanics', 'Electromagnetism', 'Thermodynamics'],
   'Physics enthusiast who believes in learning through experiments and visualization. I make physics fun and relatable to everyday life.',
   'approved',
   true,
   '2nd Year'),
  
  (tutor5_id,
   ARRAY['Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Laboratory Techniques'],
   'Chemistry graduate student with extensive lab experience. I help students understand chemical reactions, molecular structures, and lab safety.',
   'approved',
   false,
   '4th Year'),
  
  (tutor6_id,
   ARRAY['History', 'Philippine History', 'World History', 'Social Studies'],
   'History teacher in training. I bring historical events to life through storytelling and critical analysis. Let''s explore the past together!',
   'approved',
   true,
   '3rd Year');

  RAISE NOTICE 'Successfully created 6 mock tutors for documentation';
  RAISE NOTICE 'Tutor IDs: %, %, %, %, %, %', tutor1_id, tutor2_id, tutor3_id, tutor4_id, tutor5_id, tutor6_id;
END $$;
