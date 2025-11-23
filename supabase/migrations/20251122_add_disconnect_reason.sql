-- Add disconnect_reason column to sessions table
ALTER TABLE sessions ADD COLUMN disconnect_reason TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN sessions.disconnect_reason IS 'Reason for session completion: auto_completed_due_to_disconnect, normal_completion, etc.';
