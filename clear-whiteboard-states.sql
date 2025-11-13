-- =============================================
-- CLEAR WHITEBOARD STATES
-- This will remove all saved whiteboard states
-- Use this if whiteboards are showing old/incorrect content
-- =============================================

-- Option 1: Clear ALL whiteboard states (nuclear option)
-- DELETE FROM whiteboard_states;

-- Option 2: Clear whiteboard states for a specific session
-- Replace 'YOUR_SESSION_ID' with the actual session ID
-- DELETE FROM whiteboard_states WHERE session_id = 'YOUR_SESSION_ID';

-- Option 3: Clear old whiteboard states (older than 7 days)
DELETE FROM whiteboard_states 
WHERE updated_at < NOW() - INTERVAL '7 days';

-- Verification: Check remaining whiteboard states
SELECT 
  session_id,
  updated_at,
  jsonb_array_length(canvas_state->'objects') as object_count
FROM whiteboard_states
ORDER BY updated_at DESC
LIMIT 10;
