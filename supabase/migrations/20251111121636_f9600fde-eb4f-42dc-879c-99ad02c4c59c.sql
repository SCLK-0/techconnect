-- Allow admins to view all session logs
CREATE POLICY "Admins can view all session logs"
ON public.session_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));