-- Fix Missing Tutor Year Levels
-- This script adds the registered_year column if missing and populates it with data

-- Add the column if it doesn't exist
ALTER TABLE public.tutor_profiles 
ADD COLUMN IF NOT EXISTS registered_year TEXT;

-- Update all tutors that don't have a year level with a random distribution
UPDATE public.tutor_profiles 
SET registered_year = CASE 
  WHEN (random() * 4)::int = 0 THEN '1st Year'
  WHEN (random() * 4)::int = 1 THEN '2nd Year'
  WHEN (random() * 4)::int = 2 THEN '3rd Year'
  ELSE '4th Year'
END
WHERE registered_year IS NULL OR registered_year = '';

-- Verify the fix
SELECT 
  'Total Tutors' as metric,
  COUNT(*) as count
FROM public.tutor_profiles
UNION ALL
SELECT 
  'Tutors with Year Level' as metric,
  COUNT(*) as count
FROM public.tutor_profiles
WHERE registered_year IS NOT NULL AND registered_year != ''
UNION ALL
SELECT 
  'Tutors without Year Level' as metric,
  COUNT(*) as count
FROM public.tutor_profiles
WHERE registered_year IS NULL OR registered_year = '';

-- Show distribution by year level
SELECT 
  registered_year,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM public.tutor_profiles
WHERE registered_year IS NOT NULL
GROUP BY registered_year
ORDER BY registered_year;
