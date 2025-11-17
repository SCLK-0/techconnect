-- Add start_time and end_time columns to tutor_day_availability table
-- This allows tutors to set specific time slots for individual dates

ALTER TABLE public.tutor_day_availability 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add a check constraint to ensure end_time is after start_time
ALTER TABLE public.tutor_day_availability
ADD CONSTRAINT check_time_range CHECK (
  (start_time IS NULL AND end_time IS NULL) OR 
  (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_tutor_day_availability_date 
ON public.tutor_day_availability(tutor_id, date);
