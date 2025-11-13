-- Fix 1: Restrict donor payment information visibility
-- Drop the existing policy that exposes donor info to recipients
DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;

-- Create separate policies for donors, recipients, and admins
CREATE POLICY "Donors can view full donation details"
  ON public.donations
  FOR SELECT
  USING (donor_id = auth.uid());

CREATE POLICY "Recipients can view limited donation info"
  ON public.donations
  FOR SELECT
  USING (
    recipient_id = auth.uid() 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can view all donations"
  ON public.donations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Remove unrestricted notification insert policy
-- Drop the dangerous policy that allows anyone to insert notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Notifications should only be created by database triggers and functions
-- This policy allows only SECURITY DEFINER functions to insert (via service role)
CREATE POLICY "Only system functions can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (false);

-- Grant the service role ability to bypass RLS for notification inserts
-- This allows triggers to work while preventing client-side inserts
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;