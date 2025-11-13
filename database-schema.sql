-- TechConnect Database Schema with RLS Policies
-- Complete schema export for migration to self-hosted Supabase

-- =============================================
-- 1. CREATE ENUM TYPES
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'tutor', 'learner');

-- =============================================
-- 2. CREATE TABLES
-- =============================================

-- Profiles Table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- User Roles Table
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tutor Profiles Table
CREATE TABLE public.tutor_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bio text NOT NULL,
  subject_expertise text[] NOT NULL,
  status text DEFAULT 'pending',
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Learner Profiles Table
CREATE TABLE public.learner_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subjects_of_interest text[] NOT NULL,
  registered_year text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Tutor Availability Table (Weekly Schedule)
CREATE TABLE public.tutor_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tutor Day Availability Table (Specific Dates)
CREATE TABLE public.tutor_day_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Sessions Table
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  duration_minutes integer NOT NULL,
  duration text DEFAULT '60',
  scheduled_at timestamp with time zone,
  status text DEFAULT 'pending',
  session_status text DEFAULT 'waiting',
  session_type text DEFAULT 'scheduled',
  tutor_peer_id text,
  learner_peer_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Session Logs Table
CREATE TABLE public.session_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role text NOT NULL,
  topics_covered text NOT NULL,
  accomplishments text,
  homework text,
  next_steps text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Session Messages Table
CREATE TABLE public.session_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Session Assets Table
CREATE TABLE public.session_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Whiteboard Actions Table
CREATE TABLE public.whiteboard_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Whiteboard States Table
CREATE TABLE public.whiteboard_states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  canvas_state jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Feedback Table
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer,
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

-- Resources Table
CREATE TABLE public.resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  status text DEFAULT 'pending',
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Donations Table
CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  donor_name text,
  gcash_name text,
  gcash_number text,
  recipient_type text NOT NULL,
  recipient_id uuid,
  amount numeric NOT NULL,
  proof_of_payment text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Donations Recipient View (for limited visibility)
CREATE VIEW public.donations_recipient_view AS
SELECT 
  id,
  recipient_id,
  recipient_type,
  amount,
  status,
  created_at
FROM public.donations;

-- Notifications Table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  related_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Announcements Table
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 3. ENABLE ROW LEVEL SECURITY
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

-- =============================================
-- 4. CREATE SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get tutor rating
CREATE OR REPLACE FUNCTION public.get_tutor_rating(tutor_user_id uuid)
RETURNS TABLE(average_rating numeric, total_reviews bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function to get tutor stats
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
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COUNT(s.id) as total_sessions,
    COUNT(s.id) FILTER (WHERE s.status = 'completed') as completed_sessions,
    COUNT(s.id) FILTER (WHERE s.status = 'pending') as pending_sessions,
    COALESCE(SUM(d.amount), 0) as total_donations,
    ROUND(AVG(f.rating)::numeric, 1) as average_rating,
    COUNT(f.id) as total_reviews
  FROM public.sessions s
  LEFT JOIN public.donations d ON d.recipient_id = tutor_user_id AND d.recipient_type = 'tutor' AND d.status = 'completed'
  LEFT JOIN public.feedback f ON f.session_id = s.id
  WHERE s.tutor_id = tutor_user_id
$$;

-- Function to check if tutor is actually online
CREATE OR REPLACE FUNCTION public.is_tutor_actually_online(tutor_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function to increment resource downloads
CREATE OR REPLACE FUNCTION public.increment_resource_downloads(resource_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.resources 
  SET download_count = download_count + 1 
  WHERE id = resource_id;
$$;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function to auto assign admin role
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if the user email matches the admin email
  IF NEW.email = 'techconnect.mod@gmail.com' THEN
    -- Insert admin role for this user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Function to notify new session
CREATE OR REPLACE FUNCTION public.notify_new_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Notify tutor
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

-- Function to notify session status change
CREATE OR REPLACE FUNCTION public.notify_session_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function to notify tutor approval
CREATE OR REPLACE FUNCTION public.notify_tutor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function to notify resource submission
CREATE OR REPLACE FUNCTION public.notify_resource_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Function to notify tutor registration
CREATE OR REPLACE FUNCTION public.notify_tutor_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Function to notify donation
CREATE OR REPLACE FUNCTION public.notify_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Function to notify new announcement
CREATE OR REPLACE FUNCTION public.notify_new_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- =============================================
-- 5. CREATE TRIGGERS
-- =============================================

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for auto admin role assignment
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin_role();

-- Trigger for updating updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at on sessions
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for new session notification
CREATE TRIGGER on_session_created
  AFTER INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_session();

-- Trigger for session status change notification
CREATE TRIGGER on_session_status_changed
  AFTER UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_session_status_change();

-- Trigger for tutor approval notification
CREATE TRIGGER on_tutor_approved
  AFTER UPDATE ON public.tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_tutor_approval();

-- Trigger for tutor registration notification
CREATE TRIGGER on_tutor_registered
  AFTER INSERT ON public.tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_tutor_registration();

-- Trigger for resource submission notification
CREATE TRIGGER on_resource_submitted
  AFTER INSERT ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.notify_resource_submission();

-- Trigger for donation notification
CREATE TRIGGER on_donation_created
  AFTER INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.notify_donation();

-- Trigger for new announcement notification
CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_announcement();

-- =============================================
-- 6. CREATE RLS POLICIES
-- =============================================

-- Profiles Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

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

CREATE POLICY "Learners can manage own profile"
  ON public.learner_profiles FOR ALL
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
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_logs.session_id 
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create logs for their sessions"
  ON public.session_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
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
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_messages.session_id 
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their sessions"
  ON public.session_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
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
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_assets.session_id 
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload assets to their sessions"
  ON public.session_assets FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_assets.session_id 
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own session assets"
  ON public.session_assets FOR DELETE
  USING (
    uploaded_by = auth.uid() AND
    EXISTS (
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
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = whiteboard_actions.session_id 
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert actions into their sessions"
  ON public.whiteboard_actions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
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
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can manage whiteboard state for their sessions"
  ON public.whiteboard_states FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = whiteboard_states.session_id 
      AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
    )
  );

-- Feedback Policies
CREATE POLICY "Users can view feedback for their sessions"
  ON public.feedback FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = feedback.session_id 
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    ) OR
    has_role(auth.uid(), 'admin')
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
-- 7. STORAGE BUCKETS (Create via Supabase Dashboard)
-- =============================================

-- Create these buckets manually in Supabase Dashboard:
-- 1. avatars (public)
-- 2. resources (public)
-- 3. donation-proofs (public)

-- Storage Policies for avatars bucket
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload their own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update their own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own avatar"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for resources bucket
-- CREATE POLICY "Resources are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'resources');

-- CREATE POLICY "Tutors can upload resources"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'resources' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Tutors can update their own resources"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Tutors can delete their own resources"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for donation-proofs bucket
-- CREATE POLICY "Donation proofs are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'donation-proofs');

-- CREATE POLICY "Users can upload donation proofs"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'donation-proofs' AND auth.uid() IS NOT NULL);

-- =============================================
-- 8. ENABLE REALTIME (Optional)
-- =============================================

-- Enable realtime for tables that need it
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_actions;

-- =============================================
-- NOTES:
-- =============================================
-- 1. Replace 'techconnect.mod@gmail.com' in auto_assign_admin_role function with your admin email
-- 2. Create storage buckets manually in Supabase Dashboard
-- 3. Storage policies are commented out - enable them after creating buckets
-- 4. Realtime is optional - uncomment if needed
-- 5. This schema assumes you're using Supabase Auth for user management
