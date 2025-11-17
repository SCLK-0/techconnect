-- Add start_time and end_time columns to tutor_day_availability table
-- This allows tutors to set specific time slots for individual dates

-- First, drop the constraint if it exists (in case of re-running)
ALTER TABLE public.tutor_day_availability 
DROP CONSTRAINT IF EXISTS check_time_range;

-- Add the columns
ALTER TABLE public.tutor_day_availability 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_tutor_day_availability_date 
ON public.tutor_day_availability(tutor_id, date);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tutor_day_availability' 
  AND column_name IN ('start_time', 'end_time');
