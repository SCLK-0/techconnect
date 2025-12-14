
-- Migration: 20251104124333
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'tutor', 'learner');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create learner_profiles table
CREATE TABLE public.learner_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    registered_year TEXT NOT NULL,
    subjects_of_interest TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tutor_profiles table
CREATE TABLE public.tutor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    subject_expertise TEXT[] NOT NULL,
    bio TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    learner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
    session_type TEXT DEFAULT 'scheduled' CHECK (session_type IN ('scheduled', 'instant')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create resources table
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create feedback table
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for learner_profiles
CREATE POLICY "Users can view all learner profiles"
ON public.learner_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Learners can manage own profile"
ON public.learner_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for tutor_profiles
CREATE POLICY "Users can view approved tutor profiles"
ON public.tutor_profiles FOR SELECT
TO authenticated
USING (status = 'approved' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors can update own profile"
ON public.tutor_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Tutors can insert own profile"
ON public.tutor_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all tutor profiles"
ON public.tutor_profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (tutor_id = auth.uid() OR learner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Learners can create sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Tutors and learners can update their sessions"
ON public.sessions FOR UPDATE
TO authenticated
USING (tutor_id = auth.uid() OR learner_id = auth.uid());

CREATE POLICY "Admins can manage all sessions"
ON public.sessions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for resources
CREATE POLICY "Users can view approved resources"
ON public.resources FOR SELECT
TO authenticated
USING (status = 'approved' OR tutor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors can create resources"
ON public.resources FOR INSERT
TO authenticated
WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can update own resources"
ON public.resources FOR UPDATE
TO authenticated
USING (tutor_id = auth.uid());

CREATE POLICY "Admins can manage all resources"
ON public.resources FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for feedback
CREATE POLICY "Users can view feedback for their sessions"
ON public.feedback FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE id = feedback.session_id 
    AND (tutor_id = auth.uid() OR learner_id = auth.uid())
  ) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create feedback for their sessions"
ON public.feedback FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for announcements
CREATE POLICY "All authenticated users can view announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251104124402
-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Migration: 20251104130913
-- Allow users to insert their own role during registration
-- This is safe because the user can only insert their own user_id
-- and the unique constraint prevents duplicate roles
CREATE POLICY "Users can insert own role during registration"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Migration: 20251104184758
-- Add expiration date to announcements
ALTER TABLE public.announcements
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for tutor resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true);

-- Create policies for resource uploads
CREATE POLICY "Tutors can upload their own resources"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view approved resources"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resources');

CREATE POLICY "Tutors can update their own resources"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Tutors can delete their own resources"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Migration: 20251104190513
-- Add download_count to resources table
ALTER TABLE public.resources
ADD COLUMN download_count integer DEFAULT 0 NOT NULL;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('session', 'announcement', 'approval', 'feedback')),
  related_id uuid,
  read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to calculate tutor average rating
CREATE OR REPLACE FUNCTION public.get_tutor_rating(tutor_user_id uuid)
RETURNS TABLE (
  average_rating numeric,
  total_reviews bigint
) 
LANGUAGE sql
STABLE
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

-- Create trigger to create notification on new session
CREATE OR REPLACE FUNCTION public.notify_new_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE TRIGGER on_session_created
  AFTER INSERT ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_session();

-- Create trigger to notify on session status change
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

CREATE TRIGGER on_session_status_change
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_session_status_change();

-- Create trigger to notify on tutor approval
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

CREATE TRIGGER on_tutor_approved
  AFTER UPDATE ON public.tutor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tutor_approval();

-- Create trigger to notify on new announcement
CREATE OR REPLACE FUNCTION public.notify_new_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify all users
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT 
    id,
    'New Announcement',
    NEW.title,
    'announcement',
    NEW.id
  FROM auth.users;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_announcement();

-- Create function to increment download count
CREATE OR REPLACE FUNCTION public.increment_resource_downloads(resource_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.resources 
  SET download_count = download_count + 1 
  WHERE id = resource_id;
$$;

-- Migration: 20251104190554
-- Fix search_path for get_tutor_rating function
CREATE OR REPLACE FUNCTION public.get_tutor_rating(tutor_user_id uuid)
RETURNS TABLE (
  average_rating numeric,
  total_reviews bigint
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- Fix search_path for increment_resource_downloads function
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

-- Migration: 20251104191743
-- Create tutor availability schedule table
CREATE TABLE public.tutor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(tutor_id, day_of_week, start_time)
);

-- Enable RLS
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for tutor_availability
CREATE POLICY "Tutors can manage own availability"
  ON public.tutor_availability FOR ALL
  USING (tutor_id = auth.uid());

CREATE POLICY "Users can view tutor availability"
  ON public.tutor_availability FOR SELECT
  USING (true);

-- Enable realtime for tutor_availability
ALTER PUBLICATION supabase_realtime ADD TABLE public.tutor_availability;

-- Create donations tracking table
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('platform', 'tutor')),
  recipient_id uuid,
  amount numeric NOT NULL CHECK (amount > 0),
  gcash_number text NOT NULL,
  gcash_name text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'completed')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS policies for donations
CREATE POLICY "Users can view own donations"
  ON public.donations FOR SELECT
  USING (donor_id = auth.uid() OR recipient_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create donations"
  ON public.donations FOR INSERT
  WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Admins can manage donations"
  ON public.donations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to get tutor statistics
CREATE OR REPLACE FUNCTION public.get_tutor_stats(tutor_user_id uuid)
RETURNS TABLE (
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
  LEFT JOIN public.donations d ON d.recipient_id = tutor_user_id AND d.recipient_type = 'tutor' AND d.status = 'completed'
  LEFT JOIN public.feedback f ON f.session_id = s.id
  WHERE s.tutor_id = tutor_user_id
$$;

-- Migration: 20251104200353
-- Create table for day-specific availability overrides
CREATE TABLE IF NOT EXISTS public.tutor_day_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tutor_id, date)
);

-- Enable RLS
ALTER TABLE public.tutor_day_availability ENABLE ROW LEVEL SECURITY;

-- Policies for day availability
CREATE POLICY "Tutors can manage own day availability"
  ON public.tutor_day_availability
  FOR ALL
  USING (tutor_id = auth.uid());

CREATE POLICY "Users can view tutor day availability"
  ON public.tutor_day_availability
  FOR SELECT
  USING (true);

-- Enable realtime for day availability
ALTER PUBLICATION supabase_realtime ADD TABLE tutor_day_availability;

-- Migration: 20251104204503
-- Add duration and peer_id columns to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS duration text DEFAULT '60',
ADD COLUMN IF NOT EXISTS tutor_peer_id text,
ADD COLUMN IF NOT EXISTS learner_peer_id text;

-- Create session_messages table for chat
CREATE TABLE IF NOT EXISTS public.session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on session_messages
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_messages
CREATE POLICY "Users can view messages from their sessions"
  ON public.session_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_messages.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their sessions"
  ON public.session_messages
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_messages.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

-- Create session_assets table for file sharing
CREATE TABLE IF NOT EXISTS public.session_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on session_assets
ALTER TABLE public.session_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_assets
CREATE POLICY "Users can view assets from their sessions"
  ON public.session_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_assets.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload assets to their sessions"
  ON public.session_assets
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_assets.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

-- Create session_logs table for session documentation
CREATE TABLE IF NOT EXISTS public.session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_role text NOT NULL,
  topics_covered text NOT NULL,
  accomplishments text,
  homework text,
  next_steps text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on session_logs
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_logs
CREATE POLICY "Users can view logs from their sessions"
  ON public.session_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_logs.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create logs for their sessions"
  ON public.session_logs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_logs.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

-- Enable realtime for session_messages and session_assets
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_assets;

-- Migration: 20251104211556
-- Add session_status column to track waiting room state
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_status TEXT DEFAULT 'waiting' CHECK (session_status IN ('waiting', 'active', 'completed'));

-- Update existing sessions to 'active' if they have a status
UPDATE public.sessions SET session_status = 'active' WHERE status = 'accepted' OR status = 'ongoing';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_status ON public.sessions(session_status);

-- Migration: 20251104214933
-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Migration: 20251105065225

-- Drop the existing check constraint on sessions status
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_status_check;

-- Add the new check constraint with 'missed' included
ALTER TABLE public.sessions ADD CONSTRAINT sessions_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled', 'missed'));


-- Migration: 20251105071159

-- Drop the existing check constraint on session_status
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_session_status_check;

-- Update all cancelled sessions to have session_status = 'cancelled'
UPDATE public.sessions 
SET session_status = 'cancelled' 
WHERE status = 'cancelled';

-- Update all missed sessions to have session_status = 'missed'
UPDATE public.sessions 
SET session_status = 'missed' 
WHERE status = 'missed';

-- Update any remaining sessions to ensure they have valid session_status
UPDATE public.sessions 
SET session_status = CASE 
  WHEN status = 'completed' THEN 'completed'
  WHEN session_status NOT IN ('waiting', 'in_progress', 'completed') THEN 'waiting'
  ELSE session_status
END
WHERE session_status NOT IN ('waiting', 'in_progress', 'completed', 'cancelled', 'missed');

-- Add the new check constraint with 'cancelled' and 'missed' included
ALTER TABLE public.sessions ADD CONSTRAINT sessions_session_status_check 
CHECK (session_status IN ('waiting', 'in_progress', 'completed', 'cancelled', 'missed'));

