-- =============================================
-- FIX ALL SESSION ISSUES - COMBINED
-- Run this in Supabase SQL Editor to fix:
-- 1. File upload (storage RLS)
-- 2. Whiteboard save (whiteboard_states)
-- 3. Chat not displaying (realtime)
-- =============================================

-- =============================================
-- PART 1: STORAGE RLS POLICIES
-- =============================================

-- Drop existing restrictive policies for resources
DROP POLICY IF EXISTS "Tutors can upload resources" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can update own resources" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can delete own resources" ON storage.objects;

-- Allow authenticated users to upload to session folders in resources bucket
CREATE POLICY "Users can upload to session folders in resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] LIKE 'session-%'
);

-- Allow authenticated users to update files in session folders they have access to
CREATE POLICY "Users can update session resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resources' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] LIKE 'session-%'
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE (storage.foldername(name))[1] = 'session-' || s.id::text
    AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
  )
);

-- Allow authenticated users to delete files in session folders they have access to
CREATE POLICY "Users can delete session resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] LIKE 'session-%'
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE (storage.foldername(name))[1] = 'session-' || s.id::text
    AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
  )
);

-- =============================================
-- PART 2: WHITEBOARD STATES TABLE
-- =============================================

-- Check if whiteboard_states table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whiteboard_states') THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.whiteboard_states (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      session_id UUID NOT NULL UNIQUE,
      state JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT whiteboard_states_session_id_fkey 
        FOREIGN KEY (session_id) 
        REFERENCES public.sessions(id) 
        ON DELETE CASCADE
    );
    
    -- Enable RLS
    ALTER TABLE public.whiteboard_states ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view whiteboard state for their sessions"
      ON public.whiteboard_states FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.sessions s
          WHERE s.id = whiteboard_states.session_id
          AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
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
    
    RAISE NOTICE '✅ whiteboard_states table created successfully';
  ELSE
    RAISE NOTICE '✅ whiteboard_states table already exists';
  END IF;
END $$;

-- =============================================
-- PART 3: SESSION ASSETS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view session assets" ON public.session_assets;
DROP POLICY IF EXISTS "Users can manage session assets" ON public.session_assets;

-- Create comprehensive policies for session_assets
CREATE POLICY "Users can view session assets"
  ON public.session_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_assets.session_id
      AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert session assets"
  ON public.session_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_assets.session_id
      AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can update session assets"
  ON public.session_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_assets.session_id
      AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete session assets"
  ON public.session_assets FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_assets.session_id
      AND s.tutor_id = auth.uid()
    )
  );

-- =============================================
-- PART 4: SESSION CHAT - ENABLE REALTIME
-- =============================================

-- Verify session_messages table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_messages') THEN
    RAISE EXCEPTION '❌ session_messages table does not exist! Run migration first.';
  ELSE
    RAISE NOTICE '✅ session_messages table exists';
  END IF;
END $$;

-- Enable realtime for session_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;

-- Drop and recreate session_messages policies
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON public.session_messages;
DROP POLICY IF EXISTS "Users can send messages in their sessions" ON public.session_messages;
DROP POLICY IF EXISTS "Admins can view all session messages" ON public.session_messages;

-- Create SELECT policy
CREATE POLICY "Users can view messages from their sessions"
  ON public.session_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_messages.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

-- Create INSERT policy
CREATE POLICY "Users can send messages in their sessions"
  ON public.session_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_messages.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

-- Create admin policy
CREATE POLICY "Admins can view all session messages"
  ON public.session_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================
-- VERIFICATION
-- =============================================

-- Check storage policies
SELECT 
  '✅ Storage Policies' as check_name,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%session%';

-- Check session_assets policies
SELECT 
  '✅ Session Assets Policies' as check_name,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'session_assets';

-- Check whiteboard_states
SELECT 
  '✅ Whiteboard States' as check_name,
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whiteboard_states')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'whiteboard_states') as policy_count;

-- Check session_messages realtime
SELECT 
  '✅ Chat Realtime' as check_name,
  CASE 
    WHEN 'session_messages' = ANY(
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN 'ENABLED'
    ELSE 'DISABLED'
  END as realtime_status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_messages') as policy_count;

-- Final summary
SELECT 
  '📊 FINAL SUMMARY' as section,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%session%') as storage_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_assets') as asset_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'whiteboard_states') as whiteboard_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_messages') as chat_policies,
  CASE 
    WHEN 'session_messages' = ANY(SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime')
    THEN '✅ ALL FIXES APPLIED'
    ELSE '⚠️ REALTIME NOT ENABLED'
  END as status;
