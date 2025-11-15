-- ============================================
-- CHECK SESSION CREATION DETAILS
-- Run this to see when sessions were created
-- ============================================

-- Check all sessions with creation details
SELECT 
  id,
  subject,
  tutor_id,
  learner_id,
  created_at,
  updated_at,
  status
FROM sessions
ORDER BY created_at DESC;

-- Check session logs
SELECT 
  id,
  session_id,
  user_id,
  topics_covered,
  created_at
FROM session_logs
ORDER BY created_at DESC;

-- Check if there are any database triggers that might be creating sessions
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('sessions', 'session_logs');
