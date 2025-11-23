-- COMPLETE DATABASE WIPE
-- This deletes EVERYTHING - all users, all data
-- You'll need to re-register admin after running this

-- Delete in order (respecting foreign key constraints)

-- 1. Delete feedback
DELETE FROM feedback;

-- 2. Delete session logs
DELETE FROM session_logs;

-- 3. Delete whiteboard states
DELETE FROM whiteboard_states;

-- 4. Delete sessions
DELETE FROM sessions;

-- 5. Delete resources
DELETE FROM resources;

-- 6. Delete donations
DELETE FROM donations;

-- 7. Delete tutor availability
DELETE FROM tutor_availability;

-- 8. Delete tutor day availability
DELETE FROM tutor_day_availability;

-- 9. Delete announcements
DELETE FROM announcements;

-- 10. Delete notifications
DELETE FROM notifications;

-- 11. Delete tutor profiles
DELETE FROM tutor_profiles;

-- 12. Delete learner profiles
DELETE FROM learner_profiles;

-- 13. Delete user roles
DELETE FROM user_roles;

-- 14. Delete profiles
DELETE FROM profiles;

-- 15. Delete auth users (this removes all authentication data)
DELETE FROM auth.users;

-- Optional: Reset sequences to start IDs from 1
-- Uncomment if you want clean ID numbering:
-- ALTER SEQUENCE IF EXISTS sessions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS resources_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS donations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS feedback_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS announcements_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;

-- Verify everything is gone
SELECT 'Database Wipe Complete!' as status;
SELECT 'Auth users: ' || COUNT(*) as count FROM auth.users;
SELECT 'Profiles: ' || COUNT(*) as count FROM profiles;
SELECT 'User roles: ' || COUNT(*) as count FROM user_roles;
SELECT 'Tutor profiles: ' || COUNT(*) as count FROM tutor_profiles;
SELECT 'Learner profiles: ' || COUNT(*) as count FROM learner_profiles;
SELECT 'Sessions: ' || COUNT(*) as count FROM sessions;
SELECT 'Resources: ' || COUNT(*) as count FROM resources;
SELECT 'Donations: ' || COUNT(*) as count FROM donations;
SELECT 'Feedback: ' || COUNT(*) as count FROM feedback;
SELECT 'Announcements: ' || COUNT(*) as count FROM announcements;
SELECT 'Notifications: ' || COUNT(*) as count FROM notifications;

-- All counts should be 0
-- You can now register a fresh admin account!
