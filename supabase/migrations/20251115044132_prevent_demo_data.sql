-- ============================================
-- PREVENT DEMO DATA FROM BEING CREATED
-- This migration ensures no demo/test data exists
-- ============================================

-- Clean up any existing demo sessions
DELETE FROM session_logs 
WHERE topics_covered LIKE '%introduction to core concepts%'
   OR topics_covered LIKE '%Session 2%'
   OR topics_covered LIKE '%Session 3%';

DELETE FROM sessions 
WHERE subject IN ('Programming Fundamentals', 'Automotive Basics', 'Web Development')
  AND status = 'completed'
  AND duration_minutes IN (60, 90, 120);

-- Note: This migration will run once and clean up demo data
-- If data keeps coming back, check:
-- 1. Supabase Dashboard → Database → Backups (don't restore old backups)
-- 2. Don't run 'supabase db reset' as it might restore demo data
-- 3. Check if anyone else has access to your Supabase project
