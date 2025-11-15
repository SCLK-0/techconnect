-- Test script to create upcoming sessions for testing missed, cancelled, and timeout scenarios
-- Run this script to create test sessions at different time intervals

-- First, let's get the current user IDs (you'll need to replace these with actual IDs from your database)
-- To find your user IDs, run: SELECT user_id, full_name FROM profiles WHERE role IN ('learner', 'tutor');

-- INSTRUCTIONS:
-- 1. Replace 'YOUR_LEARNER_ID' with an actual learner user_id
-- 2. Replace 'YOUR_TUTOR_ID' with an actual tutor user_id
-- 3. Run this script in your Supabase SQL Editor

-- Session 1: Scheduled 10 minutes from now (to test missed session after 15 min grace period)
INSERT INTO sessions (
  learner_id,
  tutor_id,
  subject,
  scheduled_at,
  duration_minutes,
  status,
  session_type,
  created_at
) VALUES (
  'YOUR_LEARNER_ID',
  'YOUR_TUTOR_ID',
  'Mathematics',
  NOW() + INTERVAL '10 minutes',
  60,
  'accepted',
  'scheduled',
  NOW()
);

-- Session 2: Scheduled 2 minutes from now (to test immediate join and timeout)
INSERT INTO sessions (
  learner_id,
  tutor_id,
  subject,
  scheduled_at,
  duration_minutes,
  status,
  session_type,
  created_at
) VALUES (
  'YOUR_LEARNER_ID',
  'YOUR_TUTOR_ID',
  'Physics',
  NOW() + INTERVAL '2 minutes',
  45,
  'accepted',
  'scheduled',
  NOW()
);

-- Session 3: Scheduled 5 minutes from now (to test cancellation)
INSERT INTO sessions (
  learner_id,
  tutor_id,
  subject,
  scheduled_at,
  duration_minutes,
  status,
  session_type,
  created_at
) VALUES (
  'YOUR_LEARNER_ID',
  'YOUR_TUTOR_ID',
  'Chemistry',
  NOW() + INTERVAL '5 minutes',
  30,
  'accepted',
  'scheduled',
  NOW()
);

-- Session 4: Scheduled 1 minute from now (to test immediate scenarios)
INSERT INTO sessions (
  learner_id,
  tutor_id,
  subject,
  scheduled_at,
  duration_minutes,
  status,
  session_type,
  created_at
) VALUES (
  'YOUR_LEARNER_ID',
  'YOUR_TUTOR_ID',
  'Computer Science',
  NOW() + INTERVAL '1 minute',
  60,
  'accepted',
  'scheduled',
  NOW()
);

-- Session 5: Scheduled 15 minutes from now (to test normal flow)
INSERT INTO sessions (
  learner_id,
  tutor_id,
  subject,
  scheduled_at,
  duration_minutes,
  status,
  session_type,
  created_at
) VALUES (
  'YOUR_LEARNER_ID',
  'YOUR_TUTOR_ID',
  'Biology',
  NOW() + INTERVAL '15 minutes',
  45,
  'accepted',
  'scheduled',
  NOW()
);

-- Verify the sessions were created
SELECT 
  id,
  subject,
  scheduled_at,
  duration_minutes,
  status,
  session_type,
  EXTRACT(EPOCH FROM (scheduled_at - NOW())) / 60 as minutes_until_session
FROM sessions
WHERE scheduled_at > NOW()
  AND status = 'accepted'
ORDER BY scheduled_at;
