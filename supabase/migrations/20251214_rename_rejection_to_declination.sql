-- Rename rejection-related columns to declination for better terminology
-- This migration updates existing databases to use "decline" instead of "reject"

-- Rename columns in sessions table
ALTER TABLE public.sessions 
RENAME COLUMN rejection_reason TO declination_reason;

ALTER TABLE public.sessions 
RENAME COLUMN rejected_at TO declined_at;

-- Update existing data: change 'rejected' status to 'declined'
UPDATE public.sessions 
SET status = 'declined' 
WHERE status = 'rejected';

-- Update tutor_profiles status values
UPDATE public.tutor_profiles 
SET status = 'declined' 
WHERE status = 'rejected';

-- Update resources status values  
UPDATE public.resources 
SET status = 'declined' 
WHERE status = 'rejected';

-- Update donations status values (if any exist)
UPDATE public.donations 
SET status = 'declined' 
WHERE status = 'rejected';

-- Drop old indexes and create new ones
DROP INDEX IF EXISTS idx_sessions_rejection_reason;
DROP INDEX IF EXISTS idx_sessions_rejected_at;

CREATE INDEX IF NOT EXISTS idx_sessions_declination_reason ON public.sessions(declination_reason) WHERE declination_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_declined_at ON public.sessions(declined_at) WHERE declined_at IS NOT NULL;

-- Update function name and parameters
DROP FUNCTION IF EXISTS public.reject_session_with_reason(uuid, uuid, text);

-- The new function should already exist from the updated migration file
-- But let's ensure it exists with the correct name
CREATE OR REPLACE FUNCTION public.decline_session_with_reason(
  p_session_id uuid,
  p_tutor_id uuid,
  p_declination_reason text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
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
$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.decline_session_with_reason(uuid, uuid, text) TO authenticated;

-- Update comments
COMMENT ON COLUMN public.sessions.declination_reason IS 'Reason provided by tutor when declining a session request';
COMMENT ON COLUMN public.sessions.declined_at IS 'Timestamp when session was declined';
COMMENT ON FUNCTION public.decline_session_with_reason IS 'Decline a session with reason and notify learner';

-- Update notification trigger for tutor status changes
CREATE OR REPLACE FUNCTION public.notify_tutor_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify on approval
  IF NEW.status != OLD.status AND NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      'Application Approved! 🎉',
      'Congratulations! Your tutor application has been approved. You can now start accepting session requests from learners.',
      'approval',
      NEW.id
    );
  END IF;
  
  -- Notify on declination
  IF NEW.status != OLD.status AND NEW.status = 'declined' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      'Application Update',
      'Your tutor application needs some updates. Please review your profile and resubmit for approval.',
      'approval',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;