-- =============================================
-- FIX SESSION CHAT - Enable Realtime
-- Run this in Supabase SQL Editor
-- =============================================

-- ISSUE: Chat messages not displaying in realtime
-- The session_messages table exists but realtime is not enabled
-- =============================================

-- Step 1: Verify session_messages table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_messages') THEN
    RAISE EXCEPTION 'session_messages table does not exist! Run migration first.';
  ELSE
    RAISE NOTICE '✅ session_messages table exists';
  END IF;
END $$;

-- Step 2: Enable realtime for session_messages
-- This allows the Supabase client to receive real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;

-- Step 3: Verify RLS policies exist
DO $$ 
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'session_messages';
  
  IF policy_count < 2 THEN
    RAISE WARNING 'Only % policies found for session_messages. Expected at least 2.', policy_count;
  ELSE
    RAISE NOTICE '✅ Found % RLS policies for session_messages', policy_count;
  END IF;
END $$;

-- Step 4: Ensure proper RLS policies (in case they're missing)
-- Drop existing policies first
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

-- Step 5: Verify foreign keys exist
DO $$ 
BEGIN
  -- Check session_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'session_messages_session_id_fkey'
    AND table_name = 'session_messages'
  ) THEN
    RAISE NOTICE 'Adding session_id foreign key...';
    ALTER TABLE public.session_messages
    ADD CONSTRAINT session_messages_session_id_fkey 
    FOREIGN KEY (session_id) 
    REFERENCES public.sessions(id) 
    ON DELETE CASCADE;
  ELSE
    RAISE NOTICE '✅ session_id foreign key exists';
  END IF;

  -- Check user_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'session_messages_user_id_fkey'
    AND table_name = 'session_messages'
  ) THEN
    RAISE NOTICE 'Adding user_id foreign key...';
    ALTER TABLE public.session_messages
    ADD CONSTRAINT session_messages_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  ELSE
    RAISE NOTICE '✅ user_id foreign key exists';
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

-- Check if realtime is enabled
SELECT 
  '✅ Realtime Status' as check_name,
  schemaname,
  tablename,
  CASE 
    WHEN tablename = ANY(
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN 'ENABLED ✅'
    ELSE 'DISABLED ❌'
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'session_messages';

-- Check RLS policies
SELECT 
  '✅ RLS Policies' as check_name,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'session_messages'
ORDER BY policyname;

-- Check foreign keys
SELECT 
  '✅ Foreign Keys' as check_name,
  constraint_name,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'session_messages'
  AND constraint_type = 'FOREIGN KEY';

-- Summary
SELECT 
  '📊 SUMMARY' as section,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_messages') as policy_count,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'session_messages' AND constraint_type = 'FOREIGN KEY') as fk_count,
  CASE 
    WHEN 'session_messages' = ANY(
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN '✅ REALTIME ENABLED'
    ELSE '❌ REALTIME DISABLED'
  END as realtime_status;
