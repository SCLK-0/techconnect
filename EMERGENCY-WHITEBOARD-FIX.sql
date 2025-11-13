-- =============================================
-- EMERGENCY WHITEBOARD FIX
-- Run this immediately to fix sync issues
-- =============================================

-- Step 1: Clear all whiteboard states
TRUNCATE TABLE whiteboard_states;

-- Step 2: Check if the table has the right structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whiteboard_states';

-- Step 3: Recreate the table with proper structure if needed
-- DROP TABLE IF EXISTS whiteboard_states CASCADE;

-- CREATE TABLE whiteboard_states (
--   session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
--   canvas_state JSONB NOT NULL DEFAULT '{}'::jsonb,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Step 4: Enable RLS (if not already enabled)
ALTER TABLE whiteboard_states ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies for whiteboard access
DROP POLICY IF EXISTS "Users can view whiteboard for their sessions" ON whiteboard_states;
DROP POLICY IF EXISTS "Users can update whiteboard for their sessions" ON whiteboard_states;
DROP POLICY IF EXISTS "Users can insert whiteboard for their sessions" ON whiteboard_states;

CREATE POLICY "Users can view whiteboard for their sessions"
ON whiteboard_states FOR SELECT
USING (
  session_id IN (
    SELECT id FROM sessions 
    WHERE tutor_id = auth.uid() OR learner_id = auth.uid()
  )
);

CREATE POLICY "Users can update whiteboard for their sessions"
ON whiteboard_states FOR UPDATE
USING (
  session_id IN (
    SELECT id FROM sessions 
    WHERE tutor_id = auth.uid() OR learner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert whiteboard for their sessions"
ON whiteboard_states FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM sessions 
    WHERE tutor_id = auth.uid() OR learner_id = auth.uid()
  )
);

-- Verify
SELECT * FROM whiteboard_states;
