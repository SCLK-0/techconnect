-- Fix sessions that are stuck in "in_progress" status
-- This happens when a session is canceled or interrupted without proper cleanup

-- First, let's see what sessions are stuck
SELECT 
  id,
  tutor_id,
  learner_id,
  status,
  scheduled_at,
  created_at,
  updated_at
FROM sessions
WHERE status = 'in_progress'
ORDER BY scheduled_at DESC;

-- Fix: Set stuck sessions to 'completed' if they're old (more than 2 hours from scheduled time)
UPDATE sessions
SET 
  status = 'completed',
  updated_at = NOW()
WHERE status = 'in_progress'
  AND scheduled_at < NOW() - INTERVAL '2 hours';

-- Alternative: If you want to cancel them instead of completing them
-- UPDATE sessions
-- SET 
--   status = 'cancelled',
--   updated_at = NOW()
-- WHERE status = 'in_progress'
--   AND scheduled_at < NOW() - INTERVAL '2 hours';

-- Verify the fix
SELECT 
  id,
  tutor_id,
  learner_id,
  status,
  scheduled_at,
  created_at,
  updated_at
FROM sessions
WHERE status = 'in_progress'
ORDER BY scheduled_at DESC;
