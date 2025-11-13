-- =============================================
-- COMPLETE MIGRATION SCRIPT FOR EXTERNAL SUPABASE
-- This script contains your entire database schema
-- Run this in your new Supabase SQL Editor
-- =============================================

-- 1. CREATE ENUM TYPES
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'tutor', 'learner');

-- 2. CREATE TABLES
-- =============================================

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Roles Table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tutor Profiles Table
CREATE TABLE public.tutor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  subject_expertise TEXT[] NOT NULL,
  bio TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learner Profiles Table
CREATE TABLE public.learner_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  registered_year TEXT NOT NULL,
  subjects_of_interest TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tutor Availability Table
CREATE TABLE public.tutor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tutor Day Availability Table
CREATE TABLE public.tutor_day_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  start_time TIME WITHOUT TIME ZONE,
  end_time TIME WITHOUT TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sessions Table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL,
  learner_id UUID NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER NOT NULL,
  duration TEXT DEFAULT '60',
  session_type TEXT DEFAULT 'scheduled',
  session_status TEXT DEFAULT 'waiting',
  tutor_peer_id TEXT,
  learner_peer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Session Logs Table
CREATE TABLE public.session_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  topics_covered TEXT NOT NULL,
  accomplishments TEXT,
  homework TEXT,
  next_steps TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session Messages Table
CREATE TABLE public.session_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session Assets Table
CREATE TABLE public.session_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Whiteboard Actions Table
CREATE TABLE public.whiteboard_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Whiteboard States Table
CREATE TABLE public.whiteboard_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  canvas_state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Feedback Table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Resources Table
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  status TEXT DEFAULT 'pending',
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Donations Table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL,
  donor_name TEXT,
  gcash_name TEXT,
  gcash_number TEXT,
  amount NUMERIC NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_id UUID,
  proof_of_payment TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements Table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Donations Recipient View
CREATE VIEW public.donations_recipient_view AS
SELECT 
  id,
  recipient_type,
  recipient_id,
  amount,
  status,
  created_at
FROM public.donations;

-- 3. CREATE SECURITY DEFINER FUNCTIONS
-- =============================================

-- Has Role Function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get Tutor Rating Function
CREATE OR REPLACE FUNCTION public.get_tutor_rating(tutor_user_id uuid)
RETURNS TABLE(average_rating numeric, total_reviews bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROUND(AVG(f.rating)::numeric, 1) as average_rating,
    COUNT(f.id) as total_reviews
  FROM public.feedback f
  INNER JOIN public.sessions s ON s.id = f.session_id
  WHERE s.tutor_id = tutor_user_id 
    AND s.status = 'completed'
    AND f.rating IS NOT NULL
$$;

-- Get Tutor Stats Function
CREATE OR REPLACE FUNCTION public.get_tutor_stats(tutor_user_id uuid)
RETURNS TABLE(
  total_sessions bigint,
  completed_sessions bigint,
  pending_sessions bigint,
  total_donations numeric,
  average_rating numeric,
  total_reviews bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(s.id) as total_sessions,
    COUNT(s.id) FILTER (WHERE s.status = 'completed') as completed_sessions,
    COUNT(s.id) FILTER (WHERE s.status = 'pending') as pending_sessions,
    COALESCE(SUM(d.amount), 0) as total_donations,
    ROUND(AVG(f.rating)::numeric, 1) as average_rating,
    COUNT(f.id) as total_reviews
  FROM public.sessions s
  LEFT JOIN public.donations d ON d.recipient_id = tutor_user_id 
    AND d.recipient_type = 'tutor' AND d.status = 'completed'
  LEFT JOIN public.feedback f ON f.session_id = s.id
  WHERE s.tutor_id = tutor_user_id
$$;

-- Is Tutor Actually Online Function
CREATE OR REPLACE FUNCTION public.is_tutor_actually_online(tutor_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
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

-- Increment Resource Downloads Function
CREATE OR REPLACE FUNCTION public.increment_resource_downloads(resource_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.resources 
  SET download_count = download_count + 1 
  WHERE id = resource_id;
$$;

-- Update Updated At Column Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Handle New User Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Auto Assign Admin Role Function
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'techconnect.mod@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create Learner Profile On Confirmation Function
CREATE OR REPLACE FUNCTION public.create_learner_profile_on_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL 
     AND OLD.email_confirmed_at IS NULL 
     AND NEW.raw_user_meta_data ? 'registered_year'
     AND NEW.raw_user_meta_data ? 'subjects_of_interest' THEN
    
    INSERT INTO public.learner_profiles (user_id, registered_year, subjects_of_interest)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'registered_year',
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'subjects_of_interest'))
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'learner'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create Tutor Profile On Confirmation Function
CREATE OR REPLACE FUNCTION public.create_tutor_profile_on_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL 
     AND OLD.email_confirmed_at IS NULL 
     AND NEW.raw_user_meta_data ? 'subject_expertise'
     AND NEW.raw_user_meta_data ? 'bio'
     AND NEW.raw_user_meta_data ? 'is_tutor' THEN
    
    UPDATE public.profiles 
    SET bio = NEW.raw_user_meta_data->>'bio'
    WHERE user_id = NEW.id;
    
    INSERT INTO public.tutor_profiles (user_id, subject_expertise, bio, status)
    VALUES (
      NEW.id,
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'subject_expertise')),
      NEW.raw_user_meta_data->>'bio',
      'pending'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'tutor'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Notification Functions
CREATE OR REPLACE FUNCTION public.notify_new_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (
    NEW.tutor_id,
    'New Session Request',
    'You have a new session request',
    'session',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_session_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'completed') THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.learner_id,
      'Session ' || NEW.status,
      'Your session has been ' || NEW.status,
      'session',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_tutor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_resource_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.notify_tutor_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.notify_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.notify_new_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- 4. CREATE TRIGGERS
-- =============================================

-- Profile and User Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin_role();

CREATE TRIGGER on_user_confirmed_create_learner_profile
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_learner_profile_on_confirmation();

CREATE TRIGGER on_user_confirmed_create_tutor_profile
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_tutor_profile_on_confirmation();

-- Update Timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Notification Triggers
CREATE TRIGGER on_session_created
  AFTER INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_session();

CREATE TRIGGER on_session_status_changed
  AFTER UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_session_status_change();

CREATE TRIGGER on_tutor_profile_approved
  AFTER UPDATE ON public.tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_tutor_approval();

CREATE TRIGGER on_resource_submitted
  AFTER INSERT ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.notify_resource_submission();

CREATE TRIGGER on_tutor_profile_created
  AFTER INSERT ON public.tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_tutor_registration();

CREATE TRIGGER on_donation_created
  AFTER INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.notify_donation();

CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_announcement();

-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_day_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES
-- =============================================

-- Profiles Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

-- User Roles Policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own role during registration"
  ON public.user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Tutor Profiles Policies
CREATE POLICY "Users can view approved tutor profiles"
  ON public.tutor_profiles FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors can insert own profile"
  ON public.tutor_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Tutors can update own profile"
  ON public.tutor_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all tutor profiles"
  ON public.tutor_profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Learner Profiles Policies
CREATE POLICY "Users can view all learner profiles"
  ON public.learner_profiles FOR SELECT
  USING (true);

CREATE POLICY "Learners can view own profile"
  ON public.learner_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Learners can insert own profile during registration"
  ON public.learner_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Learners can update own profile"
  ON public.learner_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Learners can delete own profile"
  ON public.learner_profiles FOR DELETE
  USING (user_id = auth.uid());

-- Tutor Availability Policies
CREATE POLICY "Users can view tutor availability"
  ON public.tutor_availability FOR SELECT
  USING (true);

CREATE POLICY "Tutors can manage own availability"
  ON public.tutor_availability FOR ALL
  USING (tutor_id = auth.uid());

-- Tutor Day Availability Policies
CREATE POLICY "Users can view tutor day availability"
  ON public.tutor_day_availability FOR SELECT
  USING (true);

CREATE POLICY "Tutors can manage own day availability"
  ON public.tutor_day_availability FOR ALL
  USING (tutor_id = auth.uid());

-- Sessions Policies
CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  USING (tutor_id = auth.uid() OR learner_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Learners can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Tutors and learners can update their sessions"
  ON public.sessions FOR UPDATE
  USING (tutor_id = auth.uid() OR learner_id = auth.uid());

CREATE POLICY "Admins can manage all sessions"
  ON public.sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Session Logs Policies
CREATE POLICY "Users can view logs from their sessions"
  ON public.session_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = session_logs.session_id
    AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
  ));

CREATE POLICY "Users can create logs for their sessions"
  ON public.session_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_logs.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all session logs"
  ON public.session_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Session Messages Policies
CREATE POLICY "Users can view messages from their sessions"
  ON public.session_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = session_messages.session_id
    AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
  ));

CREATE POLICY "Users can send messages in their sessions"
  ON public.session_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_messages.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all session messages"
  ON public.session_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Session Assets Policies
CREATE POLICY "Users can view assets from their sessions"
  ON public.session_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = session_assets.session_id
    AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
  ));

CREATE POLICY "Users can upload assets to their sessions"
  ON public.session_assets FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_assets.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own session assets"
  ON public.session_assets FOR DELETE
  USING (
    uploaded_by = auth.uid() AND EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_assets.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all session assets"
  ON public.session_assets FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Whiteboard Actions Policies
CREATE POLICY "Users can view actions from their sessions"
  ON public.whiteboard_actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = whiteboard_actions.session_id
    AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
  ));

CREATE POLICY "Users can insert actions into their sessions"
  ON public.whiteboard_actions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = whiteboard_actions.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all whiteboard actions"
  ON public.whiteboard_actions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Whiteboard States Policies
CREATE POLICY "Users can view whiteboard state for their sessions"
  ON public.whiteboard_states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = whiteboard_states.session_id
      AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Users can manage whiteboard state for their sessions"
  ON public.whiteboard_states FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = whiteboard_states.session_id
    AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
  ));

-- Feedback Policies
CREATE POLICY "Users can view feedback for their sessions"
  ON public.feedback FOR SELECT
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = feedback.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    ) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create feedback for their sessions"
  ON public.feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Resources Policies
CREATE POLICY "Users can view approved resources"
  ON public.resources FOR SELECT
  USING (status = 'approved' OR tutor_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors can create resources"
  ON public.resources FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can update own resources"
  ON public.resources FOR UPDATE
  USING (tutor_id = auth.uid());

CREATE POLICY "Admins can manage all resources"
  ON public.resources FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Donations Policies
CREATE POLICY "Users can create donations"
  ON public.donations FOR INSERT
  WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Donors can view full donation details"
  ON public.donations FOR SELECT
  USING (donor_id = auth.uid());

CREATE POLICY "Recipients can view limited donation info"
  ON public.donations FOR SELECT
  USING (recipient_id = auth.uid() AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all donations"
  ON public.donations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage donations"
  ON public.donations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Only system functions can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (false);

-- Announcements Policies
CREATE POLICY "All authenticated users can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Next Steps:
-- 1. Create storage buckets: avatars, resources, donation-proofs
-- 2. Set up storage policies (see storage-policies.sql)
-- 3. Update your .env with new Supabase credentials
-- 4. Enable Realtime for required tables
-- 5. Deploy edge functions to new project
-- =============================================
