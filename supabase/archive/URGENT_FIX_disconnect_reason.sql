-- URGENT FIX: Add disconnect_reason column to sessions table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS disconnect_reason TEXT;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND column_name = 'disconnect_reason';

-- You should see one row returned with:
-- column_name: disconnect_reason
-- data_type: text
-- is_nullable: YES
