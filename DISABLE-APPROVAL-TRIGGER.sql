-- =============================================
-- DISABLE TUTOR APPROVAL NOTIFICATION TRIGGER
-- This will stop the automatic creation of approval notifications
-- =============================================

-- Option 1: Drop the trigger completely
DROP TRIGGER IF EXISTS on_tutor_profile_approved ON public.tutor_profiles;
DROP TRIGGER IF EXISTS on_tutor_approved ON public.tutor_profiles;

-- Option 2: Replace the function with a no-op version (keeps trigger but does nothing)
CREATE OR REPLACE FUNCTION public.notify_tutor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Disabled: No longer creating approval notifications
  -- Tutors will see their status in the dashboard instead
  RETURN NEW;
END;
$$;

-- Verify the trigger is disabled
SELECT 
  '✅ Trigger Status' as check_name,
  tgname as trigger_name,
  tgenabled as enabled,
  CASE 
    WHEN tgenabled = 'O' THEN 'Enabled'
    WHEN tgenabled = 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status
FROM pg_trigger
WHERE tgname LIKE '%tutor%approv%';
