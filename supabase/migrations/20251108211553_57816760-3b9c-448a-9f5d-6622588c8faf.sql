-- Add proof of payment field and donor name to donations table
ALTER TABLE public.donations 
ADD COLUMN proof_of_payment text,
ADD COLUMN donor_name text,
ALTER COLUMN gcash_number DROP NOT NULL,
ALTER COLUMN gcash_name DROP NOT NULL;

-- Create storage bucket for donation proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('donation-proofs', 'donation-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for donation proofs
CREATE POLICY "Authenticated users can upload donation proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'donation-proofs');

CREATE POLICY "Donation proofs are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'donation-proofs');

CREATE POLICY "Admins can delete donation proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'donation-proofs' AND has_role(auth.uid(), 'admin'));