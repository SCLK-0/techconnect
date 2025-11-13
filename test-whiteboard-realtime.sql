-- =============================================
-- TEST WHITEBOARD REALTIME
-- Check if realtime is enabled for whiteboard
-- =============================================

-- Check if realtime is enabled on whiteboard_states table
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename = 'whiteboard_states';

-- Check current whiteboard states
SELECT 
  session_id,
  updated_at,
  canvas_state->>'version' as version,
  jsonb_array_length(canvas_state->'objects') as object_count
FROM whiteboard_states
ORDER BY updated_at DESC;

-- Clear ALL whiteboard states to start fresh
-- Uncomment this line to clear everything:
-- TRUNCATE TABLE whiteboard_states;

-- Or clear just one session (replace with your session ID):
-- DELETE FROM whiteboard_states WHERE session_id = 'your-session-id-here';
