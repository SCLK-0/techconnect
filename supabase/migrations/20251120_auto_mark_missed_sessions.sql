-- Function to automatically mark sessions as missed
-- This handles both pending and accepted sessions that have passed their scheduled time

CREATE OR REPLACE FUNCTION mark_missed_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark PENDING sessions as missed if scheduled time + 15 minutes has passed
  -- (Tutor never accepted, so learner waited in vain)
  UPDATE sessions
  SET 
    status = 'missed',
    session_status = 'missed',
    updated_at = NOW()
  WHERE 
    status = 'pending'
    AND scheduled_at + (duration_minutes || ' minutes')::interval + interval '15 minutes' < NOW();

  -- Mark ACCEPTED sessions as missed if scheduled time + duration + 20 minutes grace period has passed
  -- (Both agreed but neither showed up or started the session)
  UPDATE sessions
  SET 
    status = 'missed',
    session_status = 'missed',
    updated_at = NOW()
  WHERE 
    status = 'accepted'
    AND scheduled_at + (duration_minutes || ' minutes')::interval + interval '20 minutes' < NOW();
    
END;
$$;

-- Create a cron job to run this function every 5 minutes
-- Note: This requires pg_cron extension which may need to be enabled
-- If pg_cron is not available, you can call this function from your application periodically

-- Uncomment the following if pg_cron is available:
-- SELECT cron.schedule(
--   'mark-missed-sessions',
--   '*/5 * * * *', -- Every 5 minutes
--   'SELECT mark_missed_sessions();'
-- );

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_missed_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_missed_sessions() TO service_role;
