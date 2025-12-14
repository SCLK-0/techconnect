-- Update existing 'completed' donations to 'verified'
UPDATE public.donations 
SET status = 'verified' 
WHERE status = 'completed';

-- Drop the existing check constraint if it exists
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_status_check;

-- Add updated check constraint with all valid statuses
ALTER TABLE public.donations ADD CONSTRAINT donations_status_check 
CHECK (status IN ('pending', 'verified', 'declined', 'completed'));