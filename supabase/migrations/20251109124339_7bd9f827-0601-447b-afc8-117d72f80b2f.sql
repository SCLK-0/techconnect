-- Drop the old check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated check constraint with all notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['session'::text, 'announcement'::text, 'approval'::text, 'feedback'::text, 'resource'::text, 'tutor_registration'::text, 'donation'::text]));