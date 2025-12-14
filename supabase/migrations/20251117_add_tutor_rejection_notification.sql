-- Add notification for tutor declination
-- This ensures tutors are notified when their application is declined

CREATE OR REPLACE FUNCTION public.notify_tutor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify on approval
  IF NEW.status != OLD.status AND NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      'Tutor Profile Approved',
      'Your tutor profile has been approved! You can now start accepting sessions.',
      'approval',
      NEW.id
    );
  END IF;
  
  -- Notify on declination
  IF NEW.status != OLD.status AND NEW.status = 'declined' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      'Tutor Application Update',
      'Unfortunately, your tutor application was not approved at this time. Please contact support for more information or to reapply.',
      'approval',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;
