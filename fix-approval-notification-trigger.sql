-- =============================================
-- FIX APPROVAL NOTIFICATION TRIGGER
-- Prevent duplicate approval notifications
-- =============================================

-- Step 1: Delete existing old approval notifications
DELETE FROM public.notifications
WHERE (title LIKE '%Tutor Profile Approved%'
   OR title LIKE '%approved%'
   OR message LIKE '%tutor profile has been approved%'
   OR message LIKE '%full access%')
  AND created_at < NOW() - INTERVAL '1 hour';

-- Step 2: Update the trigger function to prevent duplicates
CREATE OR REPLACE FUNCTION public.notify_tutor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create notification if status changed from non-approved to approved
  IF NEW.status != OLD.status AND NEW.status = 'approved' THEN
    -- Check if notification already exists for this user
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = NEW.user_id
        AND type = 'approval'
        AND title = 'Tutor Profile Approved'
        AND created_at > NOW() - INTERVAL '7 days'
    ) THEN
      -- Create notification only if it doesn't exist
      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        NEW.user_id,
        'Tutor Profile Approved',
        'Your tutor profile has been approved! You can now start accepting sessions.',
        'approval',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 3: Verify the fix
SELECT 
  '✅ Approval Notifications' as check_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as recent_count
FROM public.notifications
WHERE title LIKE '%Tutor Profile Approved%';

-- Step 4: Show remaining notifications
SELECT 
  id,
  user_id,
  title,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_old
FROM public.notifications
WHERE title LIKE '%Tutor Profile Approved%'
ORDER BY created_at DESC
LIMIT 5;
