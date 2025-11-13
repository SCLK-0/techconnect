-- Set replica identity to full for session_assets to enable DELETE events with old data
ALTER TABLE public.session_assets REPLICA IDENTITY FULL;