-- Delete Mock Tutors and Learners Created for Documentation
-- This script removes all mock users created by:
-- - insert-mock-tutors-for-docs.sql
-- - insert-mock-learners-for-docs.sql
-- Run this after you're done with documentation

-- Delete mock tutors by their names
-- This will cascade delete related records in tutor_profiles and user_roles
DELETE FROM public.profiles 
WHERE full_name IN (
  'Maria Santos',
  'Juan Dela Cruz',
  'Sofia Reyes',
  'Carlos Mendoza',
  'Ana Garcia',
  'Miguel Torres'
);

-- Delete mock learners by their names
-- This will cascade delete related records in learner_profiles and user_roles
DELETE FROM public.profiles 
WHERE full_name IN (
  'Isabella Cruz',
  'Marco Villanueva',
  'Jasmine Tan',
  'Rafael Santos',
  'Gabriela Lopez',
  'Daniel Ramos'
);

-- Verify deletion
SELECT 
  'Mock Tutors Remaining' as type,
  COUNT(*) as count
FROM public.profiles 
WHERE full_name IN (
  'Maria Santos',
  'Juan Dela Cruz',
  'Sofia Reyes',
  'Carlos Mendoza',
  'Ana Garcia',
  'Miguel Torres'
)
UNION ALL
SELECT 
  'Mock Learners Remaining' as type,
  COUNT(*) as count
FROM public.profiles 
WHERE full_name IN (
  'Isabella Cruz',
  'Marco Villanueva',
  'Jasmine Tan',
  'Rafael Santos',
  'Gabriela Lopez',
  'Daniel Ramos'
);

-- If both counts are 0, deletion was successful
