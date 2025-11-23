-- ============================================
-- DELETE ALL SESSIONS - Fresh Deployment
-- ============================================
-- WARNING: This will permanently delete ALL session data
-- Use this for a clean deployment start
-- ============================================

-- Delete all sessions
DELETE FROM sessions;

-- Delete all whiteboard states (if you want to clean these too)
DELETE FROM whiteboard_states;

-- Reset any session-related notifications (optional)
-- DELETE FROM notifications WHERE type LIKE '%session%';

-- Verify deletion
SELECT 
  'sessions' as table_name,
  COUNT(*) as remaining_records
FROM sessions
UNION ALL
SELECT 
  'whiteboard_states' as table_name,
  COUNT(*) as remaining_records
FROM whiteboard_states;

-- Show message
SELECT 'All sessions deleted successfully. Database is clean for deployment.' as status;
