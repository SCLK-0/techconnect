-- ============================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- WARNING: This will delete ALL data from your tables
-- Use this only in development/testing environments
-- ============================================

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = 'replica';

-- 1. Clean up session-related data (order matters due to foreign keys)
DELETE FROM feedback;
DELETE FROM session_messages;
DELETE FROM session_assets;
DELETE FROM session_logs;
DELETE FROM sessions;

-- 2. Clean up user-related data
DELETE FROM user_roles;
DELETE FROM learner_profiles;
DELETE FROM tutor_profiles;
DELETE FROM tutor_availability;
DELETE FROM tutor_day_availability;
DELETE FROM profiles;

-- 3. Clean up resources and announcements
DELETE FROM resources;
DELETE FROM announcements;

-- 4. Clean up donations
DELETE FROM donations;

-- 5. Clean up notifications
DELETE FROM notifications;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================
-- Clean up Supabase Auth users
-- Note: This needs to be run separately in Supabase SQL Editor
-- with proper permissions
-- ============================================

-- Delete all users from auth.users (this will cascade to related tables)
-- IMPORTANT: Run this AFTER cleaning up your custom tables
-- DELETE FROM auth.users;

-- ============================================
-- Reset sequences (optional - to start IDs from 1 again)
-- ============================================

-- Uncomment these if you want to reset auto-increment IDs
-- ALTER SEQUENCE profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE sessions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE session_logs_id_seq RESTART WITH 1;
-- ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
-- ALTER SEQUENCE donations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE resources_id_seq RESTART WITH 1;
-- ALTER SEQUENCE announcements_id_seq RESTART WITH 1;

-- ============================================
-- Verification queries (run these to confirm cleanup)
-- ============================================

-- Check remaining records
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'session_logs', COUNT(*) FROM session_logs
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'donations', COUNT(*) FROM donations
UNION ALL
SELECT 'resources', COUNT(*) FROM resources
UNION ALL
SELECT 'announcements', COUNT(*) FROM announcements;
