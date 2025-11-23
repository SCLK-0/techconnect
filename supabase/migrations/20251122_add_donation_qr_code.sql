-- Add donation QR code field to tutor_profiles

ALTER TABLE public.tutor_profiles 
ADD COLUMN IF NOT EXISTS donation_qr_code TEXT;

COMMENT ON COLUMN public.tutor_profiles.donation_qr_code IS 'Base64 encoded QR code image for receiving donations (GCash, PayMaya, etc.)';
