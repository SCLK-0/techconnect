-- ============================================
-- CLEAN SESSIONS AND SESSION LOGS ONLY
-- This will delete only session-related data
-- ============================================

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Delete session-related data (order matters due to foreign keys)
DELETE FROM feedback;
DELETE FROM session_messages;
DELETE FROM session_assets;
DELETE FROM session_logs;
DELETE FROM sessions;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================
-- Verification
-- ============================================

-- Check remaining records
SELECT 'sessions' as table_name, COUNT(*) as count FROM sessions
UNION ALL
SELECT 'session_logs', COUNT(*) FROM session_logs
UNION ALL
SELECT 'session_messages', COUNT(*) FROM session_messages
UNION ALL
SELECT 'session_assets', COUNT(*) FROM session_assets
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback;
