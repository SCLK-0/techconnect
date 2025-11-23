-- FORCE FIX: Set ALL "in_progress" sessions to "completed"
-- Use this if sessions are stuck and you want to clear them all

-- First, see what will be affected
SELECT 
  id,
  tutor_id,
  learner_id,
  status,
  scheduled_at,
  created_at,
  updated_at
FROM sessions
WHERE status = 'in_progress';

-- Fix ALL in_progress sessions
UPDATE sessions
SET 
  status = 'completed',
  updated_at = NOW()
WHERE status = 'in_progress'
RETURNING id, tutor_id, learner_id, status, scheduled_at;

-- Verify - should return no rows
SELECT 
  id,
  tutor_id,
  learner_id,
  status,
  scheduled_at
FROM sessions
WHERE status = 'in_progress';
