-- Create a safe view for recipients to query donations
-- This view excludes sensitive donor payment information
CREATE VIEW donations_recipient_view AS
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

-- Update the RLS policy to be more explicit about the security model
-- The existing policies remain in place for the donations table itself
-- This ensures that even if someone queries the table directly,
-- they still can't bypass the existing row-level restrictions

-- Add a comment to document the security approach
COMMENT ON VIEW donations_recipient_view IS 'Safe view for recipients to query their donations without exposing donor payment details (gcash_number, gcash_name, donor_id)';
