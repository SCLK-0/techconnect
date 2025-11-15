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

  -- Session 1: 10 minutes from now (test missed session)
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
    'Mathematics - Test Missed',
    NOW() + INTERVAL '10 minutes',
    60,
    'accepted',
    'scheduled',
    NOW()
  );

  -- Session 2: 2 minutes from now (test immediate join and timeout)
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
    'Physics - Test Timeout',
    NOW() + INTERVAL '2 minutes',
    45,
    'accepted',
    'scheduled',
    NOW()
  );

  -- Session 3: 5 minutes from now (test cancellation)
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
    'Chemistry - Test Cancel',
    NOW() + INTERVAL '5 minutes',
    30,
    'accepted',
    'scheduled',
    NOW()
  );

  -- Session 4: 1 minute from now (test immediate scenarios)
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
    'Computer Science - Test Immediate',
    NOW() + INTERVAL '1 minute',
    60,
    'accepted',
    'scheduled',
    NOW()
  );

  -- Session 5: 15 minutes from now (test normal flow)
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
    'Biology - Test Normal',
    NOW() + INTERVAL '15 minutes',
    45,
    'accepted',
    'scheduled',
    NOW()
  );

  RAISE NOTICE 'Successfully created 5 test sessions for learner % and tutor %', v_learner_id, v_tutor_id;
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
