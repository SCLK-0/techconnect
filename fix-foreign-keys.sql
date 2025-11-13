-- =============================================
-- ADD MISSING FOREIGN KEY CONSTRAINTS
-- This fixes the "Could not find a relationship" error
-- =============================================

-- Add foreign key from profiles to auth.users
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from user_roles to auth.users
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from tutor_profiles to auth.users
ALTER TABLE public.tutor_profiles
ADD CONSTRAINT tutor_profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from learner_profiles to auth.users
ALTER TABLE public.learner_profiles
ADD CONSTRAINT learner_profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from sessions to tutor and learner
ALTER TABLE public.sessions
ADD CONSTRAINT sessions_tutor_id_fkey 
FOREIGN KEY (tutor_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.sessions
ADD CONSTRAINT sessions_learner_id_fkey 
FOREIGN KEY (learner_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from session_logs to sessions and users
ALTER TABLE public.session_logs
ADD CONSTRAINT session_logs_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.sessions(id) 
ON DELETE CASCADE;

ALTER TABLE public.session_logs
ADD CONSTRAINT session_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from session_messages to sessions and users
ALTER TABLE public.session_messages
ADD CONSTRAINT session_messages_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.sessions(id) 
ON DELETE CASCADE;

ALTER TABLE public.session_messages
ADD CONSTRAINT session_messages_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from session_assets to sessions and users
ALTER TABLE public.session_assets
ADD CONSTRAINT session_assets_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.sessions(id) 
ON DELETE CASCADE;

ALTER TABLE public.session_assets
ADD CONSTRAINT session_assets_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from whiteboard_actions to sessions and users
ALTER TABLE public.whiteboard_actions
ADD CONSTRAINT whiteboard_actions_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.sessions(id) 
ON DELETE CASCADE;

ALTER TABLE public.whiteboard_actions
ADD CONSTRAINT whiteboard_actions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from whiteboard_states to sessions
ALTER TABLE public.whiteboard_states
ADD CONSTRAINT whiteboard_states_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.sessions(id) 
ON DELETE CASCADE;

-- Add foreign key from feedback to sessions and users
ALTER TABLE public.feedback
ADD CONSTRAINT feedback_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.sessions(id) 
ON DELETE CASCADE;

ALTER TABLE public.feedback
ADD CONSTRAINT feedback_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from resources to tutor
ALTER TABLE public.resources
ADD CONSTRAINT resources_tutor_id_fkey 
FOREIGN KEY (tutor_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from donations to donor and recipient
ALTER TABLE public.donations
ADD CONSTRAINT donations_donor_id_fkey 
FOREIGN KEY (donor_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.donations
ADD CONSTRAINT donations_recipient_id_fkey 
FOREIGN KEY (recipient_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Add foreign key from notifications to users
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from announcements to creator
ALTER TABLE public.announcements
ADD CONSTRAINT announcements_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from tutor_availability to tutor
ALTER TABLE public.tutor_availability
ADD CONSTRAINT tutor_availability_tutor_id_fkey 
FOREIGN KEY (tutor_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key from tutor_day_availability to tutor
ALTER TABLE public.tutor_day_availability
ADD CONSTRAINT tutor_day_availability_tutor_id_fkey 
FOREIGN KEY (tutor_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- =============================================
-- VERIFICATION
-- Check all foreign keys were created
-- =============================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
