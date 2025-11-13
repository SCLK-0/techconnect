-- Add last_seen column to track when tutors were last active
ALTER TABLE public.tutor_profiles 
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_last_seen 
ON public.tutor_profiles(last_seen);

-- Function to check if a tutor is truly online (active within last 2 minutes)
CREATE OR REPLACE FUNCTION public.is_tutor_actually_online(tutor_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE 
      WHEN tp.is_online = true 
        AND tp.last_seen > (now() - interval '2 minutes')
      THEN true
      ELSE false
    END as is_actually_online
  FROM public.tutor_profiles tp
  WHERE tp.user_id = tutor_user_id
$$;