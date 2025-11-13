-- =============================================
-- FIX ASSETS REALTIME
-- Enable realtime for session_assets table
-- =============================================

-- Enable realtime for session_assets
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_assets;

-- Verify realtime is enabled
SELECT 
  '✅ Assets Realtime Status' as check_name,
  CASE 
    WHEN 'session_assets' = ANY(
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN 'ENABLED ✅'
    ELSE 'DISABLED ❌'
  END as realtime_status;

-- Check RLS policies
SELECT 
  '✅ Session Assets Policies' as check_name,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'session_assets'
ORDER BY policyname;
