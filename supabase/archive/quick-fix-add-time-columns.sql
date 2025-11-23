-- Quick fix: Add time columns to tutor_day_availability
-- Run this if the migration didn't work

DO $$ 
BEGIN
    -- Add start_time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutor_day_availability' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE public.tutor_day_availability ADD COLUMN start_time TIME;
        RAISE NOTICE 'Added start_time column';
    ELSE
        RAISE NOTICE 'start_time column already exists';
    END IF;

    -- Add end_time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutor_day_availability' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE public.tutor_day_availability ADD COLUMN end_time TIME;
        RAISE NOTICE 'Added end_time column';
    ELSE
        RAISE NOTICE 'end_time column already exists';
    END IF;
END $$;

-- Verify the result
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tutor_day_availability'
ORDER BY ordinal_position;
