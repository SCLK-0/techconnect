-- Verify the tutor_day_availability table schema
-- Run this to check if the columns were added successfully

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tutor_day_availability'
ORDER BY ordinal_position;

-- Also check for any constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tutor_day_availability'::regclass;
