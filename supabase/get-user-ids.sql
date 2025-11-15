-- Helper script to get user IDs for testing
-- Run this first to find the user IDs you need

-- Get all learners
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  'learner' as role
FROM profiles p
INNER JOIN user_roles ur ON p.user_id = ur.user_id
WHERE ur.role = 'learner'
ORDER BY p.full_name;

-- Get all tutors
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  'tutor' as role
FROM profiles p
INNER JOIN user_roles ur ON p.user_id = ur.user_id
WHERE ur.role = 'tutor'
ORDER BY p.full_name;
