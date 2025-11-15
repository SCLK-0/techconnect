-- Automated test script for upcoming sessions
-- This script automatically uses the first available learner and tutor
-- No need to manually replace IDs

-- Create test sessions using the first available learner and tutor
DO $$
DECLARE
  v_learner_id UUID;
  v_tutor_id UUID;
BEGIN
  -- Get first learner
  SELECT p.user_id INTO v_learner_id
  FROM profiles p
  INNER JOIN user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'learner'
  LIMIT 1;

  -- Get first tutor
  SELECT p.user_id INTO v_tutor_id
  FROM profiles p
  INNER JOIN user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'tutor'
  LIMIT 1;

  -- Check if we found both users
  IF v_learner_id IS NULL OR v_tutor_id IS NULL THEN
    RAISE EXCEPTION 'Could not find learner or tutor. Please ensure you have users with these roles.';
  END IF;

  -- Session 1: Starting in 1 minute, Duration: 10 minutes
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
    v_learner_id,
    v_tutor_id,
    'Mathematics - 10min Duration',
    NOW() + INTERVAL '1 minute',
    10,
    'accepted',
    'scheduled',
    NOW()
  );

  -- Session 2: Starting in 2 minutes, Duration: 2 minutes (quick test)
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
    v_learner_id,
    v_tutor_id,
    'Physics - 2min Duration',
    NOW() + INTERVAL '2 minutes',
    2,
    'accepted',
    'scheduled',
    NOW()
  );

  -- Session 3: Starting in 3 minutes, Duration: 5 minutes
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
    v_learner_id,
    v_tutor_id,
    'Chemistry - 5min Duration',
    NOW() + INTERVAL '3 minutes',
    5,
    'accepted',
    'scheduled',
    NOW()
  );

  -- Session 4: Starting now (immediate), Duration: 3 minutes
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
    v_learner_id,
    v_tutor_id,
    'Computer Science - 3min Duration',
    NOW(),
    3,
    'accepted',
    'scheduled',
    NOW()
  );

  -- Session 5: Starting in 5 minutes, Duration: 15 minutes (longer test)
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
    v_learner_id,
    v_tutor_id,
    'Biology - 15min Duration',
    NOW() + INTERVAL '5 minutes',
    15,
    'accepted',
    'scheduled',
    NOW()
  );

  RAISE NOTICE 'Successfully created 5 test sessions with different durations for learner % and tutor %', v_learner_id, v_tutor_id;
  RAISE NOTICE 'Session durations: 10min, 2min, 5min, 3min, 15min';
  RAISE NOTICE 'Sessions start immediately and within the next 5 minutes';
END $$;

-- Verify the sessions were created
SELECT 
  id,
  subject,
  scheduled_at,
  TO_CHAR(scheduled_at, 'HH24:MI:SS') as scheduled_time,
  duration_minutes,
  status,
  session_type,
  ROUND(EXTRACT(EPOCH FROM (scheduled_at - NOW())) / 60, 1) as minutes_until_session
FROM sessions
WHERE scheduled_at > NOW()
  AND status = 'accepted'
  AND subject LIKE '%Test%'
ORDER BY scheduled_at;
