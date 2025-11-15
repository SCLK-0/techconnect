-- Test script to verify whiteboard persistence
-- Run this in Supabase SQL Editor

-- 1. Check if whiteboard_states table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'whiteboard_states'
) AS table_exists;

-- 2. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'whiteboard_states'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'whiteboard_states';

-- 4. Count existing whiteboard states
SELECT COUNT(*) as total_whiteboard_states FROM public.whiteboard_states;

-- 5. View recent whiteboard states (if any)
SELECT 
  id,
  session_id,
  jsonb_array_length(canvas_state->'objects') as object_count,
  created_at,
  updated_at
FROM public.whiteboard_states
ORDER BY updated_at DESC
LIMIT 5;
