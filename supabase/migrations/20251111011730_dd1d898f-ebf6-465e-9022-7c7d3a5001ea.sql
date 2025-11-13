-- Add delete policy for session_assets
-- Allow users to delete assets they uploaded in their sessions
CREATE POLICY "Users can delete their own session assets"
ON public.session_assets
FOR DELETE
USING (
  uploaded_by = auth.uid() 
  AND EXISTS (
    SELECT 1 
    FROM sessions 
    WHERE sessions.id = session_assets.session_id 
    AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
  )
);