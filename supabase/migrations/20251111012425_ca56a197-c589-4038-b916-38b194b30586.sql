-- Add foreign key from session_assets.uploaded_by to profiles.user_id
ALTER TABLE public.session_assets
ADD CONSTRAINT session_assets_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;