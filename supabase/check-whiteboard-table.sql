-- Quick check if whiteboard_states table exists and is accessible

-- 1. Check if table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'whiteboard_states';

-- 2. If table exists, try to select from it
SELECT COUNT(*) as row_count FROM public.whiteboard_states;

-- 3. Check if you can insert (this will fail if RLS blocks you, which is expected)
-- Don't run this if you're not in a session
-- INSERT INTO public.whiteboard_states (session_id, canvas_state) 
-- VALUES ('00000000-0000-0000-0000-000000000000', '{"objects": []}');
