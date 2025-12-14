-- Add declination reason and reschedule functionality

-- Add declination_reason column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS declination_reason TEXT,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);

-- Create function to decline session with reason and notify learner
CREATE OR REPLACE FUNCTION public.decline_session_with_reason(
  p_session_id uuid,
  p_tutor_id uuid,
  p_declination_reason text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_learner_id uuid;
  v_learner_name text;
  v_tutor_name text;
  v_subject text;
  v_scheduled_at timestamp with time zone;
BEGIN
  -- Get session details
  SELECT 
    s.learner_id,
    s.subject,
    s.scheduled_at,
    lp.full_name,
    tp.full_name
  INTO 
    v_learner_id,
    v_subject,
    v_scheduled_at,
    v_learner_name,
    v_tutor_name
  FROM sessions s
  INNER JOIN profiles lp ON lp.user_id = s.learner_id
  INNER JOIN profiles tp ON tp.user_id = s.tutor_id
  WHERE s.id = p_session_id
    AND s.tutor_id = p_tutor_id
    AND s.status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Session not found or already processed'
    );
  END IF;

  -- Update session status
  UPDATE sessions
  SET 
    status = 'declined',
    session_status = 'cancelled',
    declination_reason = p_declination_reason,
    declined_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Create notification for learner
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_id
  ) VALUES (
    v_learner_id,
    'Session Request Declined',
    format(
      '%s declined your session request for %s on %s. Reason: %s. You can reschedule or find another tutor.',
      v_tutor_name,
      v_subject,
      to_char(v_scheduled_at, 'Mon DD at HH24:MI'),
      p_declination_reason
    ),
    'session',
    p_session_id
  );

  RETURN json_build_object(
    'success', true,
    'learner_id', v_learner_id,
    'learner_name', v_learner_name
  );
END;
$$;

-- Create function to cancel session with reason
CREATE OR REPLACE FUNCTION public.cancel_session_with_reason(
  p_session_id uuid,
  p_user_id uuid,
  p_cancellation_reason text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_record record;
  v_other_user_id uuid;
  v_other_user_name text;
  v_canceller_name text;
  v_is_tutor boolean;
BEGIN
  -- Get session details
  SELECT 
    s.*,
    lp.full_name as learner_name,
    tp.full_name as tutor_name
  INTO v_session_record
  FROM sessions s
  INNER JOIN profiles lp ON lp.user_id = s.learner_id
  INNER JOIN profiles tp ON tp.user_id = s.tutor_id
  WHERE s.id = p_session_id
    AND (s.learner_id = p_user_id OR s.tutor_id = p_user_id)
    AND s.status IN ('pending', 'accepted');

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Session not found or cannot be cancelled'
    );
  END IF;

  -- Determine who is cancelling and who to notify
  IF v_session_record.tutor_id = p_user_id THEN
    v_is_tutor := true;
    v_other_user_id := v_session_record.learner_id;
    v_other_user_name := v_session_record.learner_name;
    v_canceller_name := v_session_record.tutor_name;
  ELSE
    v_is_tutor := false;
    v_other_user_id := v_session_record.tutor_id;
    v_other_user_name := v_session_record.tutor_name;
    v_canceller_name := v_session_record.learner_name;
  END IF;

  -- Update session status
  UPDATE sessions
  SET 
    status = 'cancelled',
    session_status = 'cancelled',
    cancelled_reason = p_cancellation_reason,
    cancelled_at = NOW(),
    cancelled_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Create notification for the other party
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_id
  ) VALUES (
    v_other_user_id,
    'Session Cancelled',
    format(
      '%s cancelled the session for %s on %s. Reason: %s',
      v_canceller_name,
      v_session_record.subject,
      to_char(v_session_record.scheduled_at, 'Mon DD at HH24:MI'),
      p_cancellation_reason
    ),
    'session',
    p_session_id
  );

  RETURN json_build_object(
    'success', true,
    'cancelled_by', CASE WHEN v_is_tutor THEN 'tutor' ELSE 'learner' END,
    'notified_user', v_other_user_name
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.decline_session_with_reason(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_session_with_reason(uuid, uuid, text) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_declination_reason ON public.sessions(declination_reason) WHERE declination_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_cancelled_by ON public.sessions(cancelled_by) WHERE cancelled_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_declined_at ON public.sessions(declined_at) WHERE declined_at IS NOT NULL;

COMMENT ON COLUMN public.sessions.declination_reason IS 'Reason provided by tutor when declining a session request';
COMMENT ON COLUMN public.sessions.declined_at IS 'Timestamp when session was declined';
COMMENT ON COLUMN public.sessions.cancelled_reason IS 'Reason provided when cancelling a session';
COMMENT ON COLUMN public.sessions.cancelled_at IS 'Timestamp when session was cancelled';
COMMENT ON COLUMN public.sessions.cancelled_by IS 'User ID of who cancelled the session';
COMMENT ON FUNCTION public.decline_session_with_reason IS 'Decline a session with reason and notify learner';
COMMENT ON FUNCTION public.cancel_session_with_reason IS 'Cancel a session with reason and notify the other party';
