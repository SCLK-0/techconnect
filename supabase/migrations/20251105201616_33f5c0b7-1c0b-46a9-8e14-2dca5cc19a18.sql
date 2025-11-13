-- Drop and recreate the view with explicit SECURITY INVOKER
-- This ensures the view uses the permissions of the querying user, not the creator
DROP VIEW IF EXISTS donations_recipient_view;

CREATE VIEW donations_recipient_view 
WITH (security_invoker = true) AS
SELECT 
  id,
  recipient_id,
  recipient_type,
  amount,
  status,
  created_at
FROM donations;

-- Grant access to the view for authenticated users
GRANT SELECT ON donations_recipient_view TO authenticated;

-- Add a comment to document the security approach
COMMENT ON VIEW donations_recipient_view IS 'Safe view for recipients to query their donations without exposing donor payment details (gcash_number, gcash_name, donor_id). Uses SECURITY INVOKER to enforce RLS policies of the querying user.';
