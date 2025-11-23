-- Create a function to automatically clean up past time slots
CREATE OR REPLACE FUNCTION cleanup_past_time_slots()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove time slots from dates that have passed
  UPDATE tutor_day_availability
  SET 
    start_time = NULL,
    end_time = NULL
  WHERE date < CURRENT_DATE
    AND (start_time IS NOT NULL OR end_time IS NOT NULL);
  
  RAISE NOTICE 'Cleaned up time slots for past dates';
END;
$$;

-- Create a scheduled job to run this cleanup daily at midnight
-- Note: This requires pg_cron extension which may need to be enabled
-- If pg_cron is not available, you can run the cleanup_past_time_slots() function manually

-- To enable pg_cron (run this in Supabase SQL editor if not already enabled):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup to run daily at midnight (00:00)
-- Uncomment the following line if pg_cron is enabled:
-- SELECT cron.schedule('cleanup-past-time-slots', '0 0 * * *', 'SELECT cleanup_past_time_slots();');

-- Alternative: You can also call this function manually or via a scheduled task:
-- SELECT cleanup_past_time_slots();
