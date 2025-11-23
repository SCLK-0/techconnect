-- Add registered_year column to tutor_profiles table
ALTER TABLE public.tutor_profiles 
ADD COLUMN IF NOT EXISTS registered_year text;

-- Update existing tutors with a default value if needed
-- (Optional: You can remove this if you don't want to set a default)
UPDATE public.tutor_profiles 
SET registered_year = '3rd Year' 
WHERE registered_year IS NULL;
