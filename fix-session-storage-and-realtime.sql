-- =============================================
-- FIX SESSION STORAGE AND REALTIME ISSUES
-- Run this in Supabase SQL Editor
-- =============================================

-- ISSUE 1: Storage RLS Policies for Session Resources
-- The current policy expects user_id as first folder, but we're using session-{id}
-- We need to allow session-based paths for resources bucket
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

-- ISSUE 2: Whiteboard States Table - Check if it exists and has proper constraints
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
    
    RAISE NOTICE 'whiteboard_states table created successfully';
  ELSE
    RAISE NOTICE 'whiteboard_states table already exists';
  END IF;
END $$;

-- ISSUE 3: Session Assets Table - Ensure proper RLS policies
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
-- VERIFICATION
-- =============================================

-- Check storage policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%session%'
ORDER BY policyname;

-- Check session_assets policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'session_assets'
ORDER BY policyname;

-- Check whiteboard_states table and policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'whiteboard_states'
ORDER BY policyname;
