-- =============================================
-- VERIFY SESSION FIXES WERE APPLIED
-- Run this after applying fix-session-storage-and-realtime.sql
-- =============================================

-- Check 1: Storage policies for session folders
SELECT 
  '✅ Storage Policies' as check_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%session%';

-- Check 2: Session assets policies
SELECT 
  '✅ Session Assets Policies' as check_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'session_assets';

-- Check 3: Whiteboard states table exists
SELECT 
  '✅ Whiteboard States Table' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'whiteboard_states'
    ) THEN 'EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check 4: Whiteboard states policies
SELECT 
  '✅ Whiteboard States Policies' as check_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'whiteboard_states';

-- Check 5: Resources bucket exists
SELECT 
  '✅ Resources Bucket' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM storage.buckets 
      WHERE id = 'resources'
    ) THEN 'EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check 6: List all storage policies (for debugging)
SELECT 
  '📋 All Storage Policies' as info,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%session%' THEN '✅ Session-related'
    ELSE 'Other'
  END as relevance
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY relevance DESC, policyname;

-- Summary
SELECT 
  '📊 SUMMARY' as section,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%session%') as storage_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_assets') as asset_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'whiteboard_states') as whiteboard_policies,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%session%') >= 3
    AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_assets') >= 4
    AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'whiteboard_states') >= 2
    THEN '✅ ALL FIXES APPLIED'
    ELSE '⚠️ SOME FIXES MISSING'
  END as status;
