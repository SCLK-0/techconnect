-- Clean Database Script (Keep Admin Accounts)
-- This script removes all data except admin users and their related records
-- Run this in your Supabase SQL Editor

-- Step 1: Get admin user IDs (we'll preserve these)
-- First, let's see who the admins are (uncomment to check):
-- SELECT p.full_name, p.user_id, ur.role 
-- FROM profiles p 
-- JOIN user_roles ur ON p.user_id = ur.user_id 
-- WHERE ur.role = 'admin';

-- Step 2: Delete non-admin data in order (respecting foreign key constraints)

-- Delete feedback (for non-admin sessions)
DELETE FROM feedback 
WHERE session_id IN (
  SELECT id FROM sessions 
  WHERE tutor_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')
  OR learner_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

-- Delete session logs (for non-admin sessions)
DELETE FROM session_logs 
WHERE session_id IN (
  SELECT id FROM sessions 
  WHERE tutor_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')
  OR learner_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

-- Delete whiteboard states (for non-admin sessions)
DELETE FROM whiteboard_states 
WHERE session_id IN (
  SELECT id FROM sessions 
  WHERE tutor_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')
  OR learner_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

-- Delete sessions (non-admin)
DELETE FROM sessions 
WHERE tutor_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')
OR learner_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Delete resources (non-admin tutors)
DELETE FROM resources 
WHERE tutor_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Delete donations (non-admin)
DELETE FROM donations 
WHERE donor_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')
OR tutor_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Delete tutor availability (non-admin tutors)
DELETE FROM tutor_availability 
WHERE tutor_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Delete tutor day availability (non-admin tutors)
DELETE FROM tutor_day_availability 
WHERE tutor_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Delete announcements (non-admin creators)
DELETE FROM announcements 
WHERE created_by NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Delete notifications (non-admin users)
DELETE FROM notifications 
WHERE user_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Delete tutor profiles (non-admin)
DELETE FROM tutor_profiles 
WHERE user_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Delete learner profiles (non-admin)
DELETE FROM learner_profiles 
WHERE user_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Delete user roles (non-admin)
DELETE FROM user_roles 
WHERE role != 'admin';

-- Delete profiles (non-admin)
DELETE FROM profiles 
WHERE user_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Step 3: Clean up auth.users (non-admin users)
-- Note: This requires admin privileges and should be done carefully
-- Uncomment the following line to delete non-admin auth users:
-- DELETE FROM auth.users 
-- WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');

-- Step 4: Reset sequences (optional - if you want IDs to start from 1 again)
-- Uncomment if needed:
-- ALTER SEQUENCE IF EXISTS sessions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS resources_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS donations_id_seq RESTART WITH 1;

-- Step 5: Verify cleanup
SELECT 'Cleanup Summary:' as info;
SELECT 'Profiles remaining: ' || COUNT(*) FROM profiles;
SELECT 'User roles remaining: ' || COUNT(*) FROM user_roles;
SELECT 'Tutor profiles remaining: ' || COUNT(*) FROM tutor_profiles;
SELECT 'Learner profiles remaining: ' || COUNT(*) FROM learner_profiles;
SELECT 'Sessions remaining: ' || COUNT(*) FROM sessions;
SELECT 'Resources remaining: ' || COUNT(*) FROM resources;
SELECT 'Donations remaining: ' || COUNT(*) FROM donations;
SELECT 'Feedback remaining: ' || COUNT(*) FROM feedback;
SELECT 'Announcements remaining: ' || COUNT(*) FROM announcements;
SELECT 'Notifications remaining: ' || COUNT(*) FROM notifications;

-- Show remaining admin users
SELECT 'Admin users preserved:' as info;
SELECT p.full_name, p.user_id, ur.role, p.created_at
FROM profiles p 
JOIN user_roles ur ON p.user_id = ur.user_id 
WHERE ur.role = 'admin';
