-- Create notification trigger for resource submissions
CREATE OR REPLACE FUNCTION public.notify_resource_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Notify all admins when a new resource is submitted
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT 
    ur.user_id,
    'New Resource Submission',
    'A tutor has submitted a new resource for approval: ' || NEW.title,
    'resource',
    NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;
  RETURN NEW;
END;
$function$;

-- Create notification trigger for tutor registrations
CREATE OR REPLACE FUNCTION public.notify_tutor_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Notify all admins when a new tutor registers
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    SELECT 
      ur.user_id,
      'New Tutor Registration',
      'A new tutor has registered and is pending approval',
      'tutor_registration',
      NEW.id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'::app_role;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create notification trigger for donations
CREATE OR REPLACE FUNCTION public.notify_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Notify all admins when a new donation is made
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT 
    ur.user_id,
    'New Donation',
    'A new donation has been submitted for verification',
    'donation',
    NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;
  RETURN NEW;
END;
$function$;

-- Update the announcement notification to only notify non-admins
CREATE OR REPLACE FUNCTION public.notify_new_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Notify all non-admin users (learners and tutors)
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT 
    au.id,
    'New Announcement',
    NEW.title,
    'announcement',
    NEW.id
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = au.id 
    AND ur.role = 'admin'::app_role
  );
  RETURN NEW;
END;
$function$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_resource_insert ON public.resources;
DROP TRIGGER IF EXISTS on_tutor_profile_insert ON public.tutor_profiles;
DROP TRIGGER IF EXISTS on_donation_insert ON public.donations;

-- Create triggers
CREATE TRIGGER on_resource_insert
  AFTER INSERT ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_resource_submission();

CREATE TRIGGER on_tutor_profile_insert
  AFTER INSERT ON public.tutor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tutor_registration();

CREATE TRIGGER on_donation_insert
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_donation();