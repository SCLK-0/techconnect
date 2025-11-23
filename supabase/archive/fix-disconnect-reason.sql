-- Quick fix: Add disconnect_reason column if it doesn't exist
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS disconnect_reason TEXT;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' AND column_name = 'disconnect_reason';
