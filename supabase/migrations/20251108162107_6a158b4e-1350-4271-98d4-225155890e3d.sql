-- Add foreign key from user_roles to profiles
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

-- Add foreign key from tutor_profiles to profiles
ALTER TABLE public.tutor_profiles
DROP CONSTRAINT IF EXISTS tutor_profiles_user_id_fkey,
ADD CONSTRAINT tutor_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

-- Add foreign key from learner_profiles to profiles
ALTER TABLE public.learner_profiles
DROP CONSTRAINT IF EXISTS learner_profiles_user_id_fkey,
ADD CONSTRAINT learner_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

-- Add foreign keys from sessions to profiles
ALTER TABLE public.sessions
DROP CONSTRAINT IF EXISTS sessions_tutor_id_fkey,
ADD CONSTRAINT sessions_tutor_id_fkey 
  FOREIGN KEY (tutor_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

ALTER TABLE public.sessions
DROP CONSTRAINT IF EXISTS sessions_learner_id_fkey,
ADD CONSTRAINT sessions_learner_id_fkey 
  FOREIGN KEY (learner_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;