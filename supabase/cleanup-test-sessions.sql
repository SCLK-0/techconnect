-- Cleanup script to remove test sessions
-- Run this after you're done testing

-- Delete all test sessions (identified by "Test" in subject)
DELETE FROM sessions
WHERE subject LIKE '%Test%';

-- Or delete all upcoming sessions created in the last hour
-- DELETE FROM sessions
-- WHERE scheduled_at > NOW()
--   AND created_at > NOW() - INTERVAL '1 hour';

-- Verify deletion
SELECT COUNT(*) as remaining_test_sessions
FROM sessions
WHERE subject LIKE '%Test%';
