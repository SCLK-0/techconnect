-- Add is_active column to profiles table for user activation/deactivation
ALTER TABLE public.profiles 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add index for better query performance
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Add comment
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active. Admins can deactivate accounts.';