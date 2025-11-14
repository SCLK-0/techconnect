-- ============================================
-- CLEAN UP AUTH USERS
-- Run this AFTER running clean-database.sql
-- This requires admin privileges in Supabase
-- ============================================

-- WARNING: This will delete ALL users from authentication
-- Make sure you want to do this!

-- Delete all users (this will cascade to auth.sessions and other auth tables)
DELETE FROM auth.users;

-- Verify cleanup
SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT COUNT(*) as remaining_sessions FROM auth.sessions;

-- ============================================
-- NOTES:
-- ============================================
-- After running this, you'll need to:
-- 1. Create a new admin account
-- 2. Re-test your OAuth flow
-- 3. Create fresh test users if needed
-- ============================================
