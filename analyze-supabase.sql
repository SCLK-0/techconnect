-- Quick analysis queries for your Supabase project
-- Copy and paste these into Supabase Dashboard → SQL Editor

-- 1. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. List all functions
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 3. Check storage buckets
SELECT id, name, public, created_at 
FROM storage.buckets 
ORDER BY name;

-- 4. Check RLS status on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Count policies per table
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 6. Check if admin user exists
SELECT 
  ur.role,
  p.full_name,
  p.user_id
FROM user_roles ur
JOIN profiles p ON p.user_id = ur.user_id
WHERE ur.role = 'admin';

-- 7. Count records in key tables
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'tutor_profiles', COUNT(*) FROM tutor_profiles
UNION ALL
SELECT 'learner_profiles', COUNT(*) FROM learner_profiles
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'resources', COUNT(*) FROM resources
UNION ALL
SELECT 'donations', COUNT(*) FROM donations
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
