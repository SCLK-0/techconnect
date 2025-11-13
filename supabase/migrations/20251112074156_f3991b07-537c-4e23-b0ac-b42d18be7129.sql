-- Create trigger to handle learner profile creation after email confirmation
CREATE OR REPLACE FUNCTION public.create_learner_profile_on_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if user was just confirmed and has learner metadata
  IF NEW.email_confirmed_at IS NOT NULL 
     AND OLD.email_confirmed_at IS NULL 
     AND NEW.raw_user_meta_data ? 'registered_year'
     AND NEW.raw_user_meta_data ? 'subjects_of_interest' THEN
    
    -- Create learner profile
    INSERT INTO public.learner_profiles (user_id, registered_year, subjects_of_interest)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'registered_year',
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'subjects_of_interest'))
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign learner role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'learner'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_confirmed_create_learner_profile ON auth.users;

-- Create trigger for when user confirms email
CREATE TRIGGER on_user_confirmed_create_learner_profile
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_learner_profile_on_confirmation();