-- Clean up time slots for past dates
-- This removes start_time and end_time from tutor_day_availability records where the date has passed

-- First, see what will be cleaned up
SELECT 
  id,
  tutor_id,
  date,
  start_time,
  end_time,
  is_available
FROM tutor_day_availability
WHERE date < CURRENT_DATE
  AND (start_time IS NOT NULL OR end_time IS NOT NULL);

-- Remove time slots from past dates (keeps the availability status)
UPDATE tutor_day_availability
SET 
  start_time = NULL,
  end_time = NULL
WHERE date < CURRENT_DATE
  AND (start_time IS NOT NULL OR end_time IS NOT NULL);

-- Verify cleanup
SELECT 
  id,
  tutor_id,
  date,
  start_time,
  end_time,
  is_available
FROM tutor_day_availability
WHERE date < CURRENT_DATE
  AND (start_time IS NOT NULL OR end_time IS NOT NULL);

-- This should return no rows after cleanup
