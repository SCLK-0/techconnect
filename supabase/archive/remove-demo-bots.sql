-- Remove demo bot accounts and related data
-- Run this manually in Supabase SQL Editor if you want to clean up demo bots

-- Delete any sessions with demo bots
DELETE FROM sessions 
WHERE tutor_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
   OR learner_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Delete tutor profiles for demo bots
DELETE FROM tutor_profiles 
WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Delete learner profiles for demo bots
DELETE FROM learner_profiles 
WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Delete profiles for demo bots
DELETE FROM profiles 
WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Delete auth users for demo bots (this will cascade delete everything else)
-- Note: This requires admin privileges and should be run carefully
DELETE FROM auth.users 
WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
