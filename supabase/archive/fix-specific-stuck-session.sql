-- Fix a specific stuck session
-- Replace the values below with your actual session details

-- Option 1: Fix by session ID
-- UPDATE sessions
-- SET 
--   status = 'cancelled',
--   ended_at = NOW(),
--   updated_at = NOW()
-- WHERE id = 'YOUR_SESSION_ID_HERE';

-- Option 2: Fix by tutor ID (fixes all stuck sessions for a specific tutor)
-- UPDATE sessions
-- SET 
--   status = 'cancelled',
--   ended_at = NOW(),
--   updated_at = NOW()
-- WHERE tutor_id = 'YOUR_TUTOR_ID_HERE'
--   AND status = 'in_progress';

-- Option 3: Fix by learner ID (fixes all stuck sessions for a specific learner)
-- UPDATE sessions
-- SET 
--   status = 'cancelled',
--   ended_at = NOW(),
--   updated_at = NOW()
-- WHERE learner_id = 'YOUR_LEARNER_ID_HERE'
--   AND status = 'in_progress';

-- Option 4: Find and fix the most recent stuck session
UPDATE sessions
SET 
  status = 'cancelled',
  ended_at = NOW(),
  updated_at = NOW()
WHERE id = (
  SELECT id 
  FROM sessions 
  WHERE status = 'in_progress'
  ORDER BY created_at DESC
  LIMIT 1
)
RETURNING id, tutor_id, learner_id, status, scheduled_at;
