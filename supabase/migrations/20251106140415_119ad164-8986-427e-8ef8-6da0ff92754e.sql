-- Add time slot columns to tutor_day_availability
ALTER TABLE public.tutor_day_availability 
ADD COLUMN start_time time without time zone,
ADD COLUMN end_time time without time zone;

-- Add comment explaining the logic
COMMENT ON TABLE public.tutor_day_availability IS 'Day-specific availability overrides. If is_available=false, day is blocked. If is_available=true with times, uses those times. If is_available=true without times, falls back to weekly schedule.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tutor_day_availability_date 
ON public.tutor_day_availability(tutor_id, date);