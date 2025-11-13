-- Allow admins to view session assets for monitoring
CREATE POLICY "Admins can view all session assets"
ON public.session_assets
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view session messages for monitoring
CREATE POLICY "Admins can view all session messages"
ON public.session_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));