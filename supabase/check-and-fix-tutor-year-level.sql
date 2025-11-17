-- Check and Fix Tutor Year Level Issue
-- This script checks if registered_year column exists and has data

-- Step 1: Check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tutor_profiles' 
  AND column_name = 'registered_year';

-- Step 2: Check current data
SELECT 
  id,
  user_id,
  registered_year,
  status
FROM public.tutor_profiles
LIMIT 10;

-- Step 3: If column exists but data is missing, you can update with sample data
-- Uncomment the following lines to add year levels to existing tutors:

/*
UPDATE public.tutor_profiles 
SET registered_year = CASE 
  WHEN random() < 0.25 THEN '1st Year'
  WHEN random() < 0.5 THEN '2nd Year'
  WHEN random() < 0.75 THEN '3rd Year'
  ELSE '4th Year'
END
WHERE registered_year IS NULL;
*/

-- Step 4: Verify the update
SELECT 
  registered_year,
  COUNT(*) as count
FROM public.tutor_profiles
GROUP BY registered_year
ORDER BY registered_year;
