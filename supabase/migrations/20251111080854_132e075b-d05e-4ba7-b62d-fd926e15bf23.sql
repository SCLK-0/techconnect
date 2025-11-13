-- Fix the function to have proper search_path set
CREATE OR REPLACE FUNCTION public.is_tutor_actually_online(tutor_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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