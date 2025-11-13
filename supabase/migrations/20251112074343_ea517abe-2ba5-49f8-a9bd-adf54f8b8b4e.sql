-- Create trigger to handle tutor profile creation after email confirmation
CREATE OR REPLACE FUNCTION public.create_tutor_profile_on_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if user was just confirmed and has tutor metadata
  IF NEW.email_confirmed_at IS NOT NULL 
     AND OLD.email_confirmed_at IS NULL 
     AND NEW.raw_user_meta_data ? 'subject_expertise'
     AND NEW.raw_user_meta_data ? 'bio'
     AND NEW.raw_user_meta_data ? 'is_tutor' THEN
    
    -- Update profile with bio
    UPDATE public.profiles 
    SET bio = NEW.raw_user_meta_data->>'bio'
    WHERE user_id = NEW.id;
    
    -- Create tutor profile
    INSERT INTO public.tutor_profiles (user_id, subject_expertise, bio, status)
    VALUES (
      NEW.id,
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'subject_expertise')),
      NEW.raw_user_meta_data->>'bio',
      'pending'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign tutor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'tutor'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_confirmed_create_tutor_profile ON auth.users;

-- Create trigger for when user confirms email
CREATE TRIGGER on_user_confirmed_create_tutor_profile
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_tutor_profile_on_confirmation();