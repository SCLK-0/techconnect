-- =============================================
-- FIX TUTOR APPROVAL NOTIFICATION
-- Mark old approval notifications as read
-- =============================================

-- Option 1: Mark ALL approval notifications as read for all users
UPDATE public.notifications
SET read = true
WHERE title LIKE '%approved%'
  OR message LIKE '%approved%'
  OR message LIKE '%full access%';

-- Option 2: Delete old approval notifications (if you prefer to remove them)
-- Uncomment the lines below if you want to delete instead of marking as read
/*
DELETE FROM public.notifications
WHERE title LIKE '%approved%'
  OR message LIKE '%approved%'
  OR message LIKE '%full access%';
*/

-- Verification: Check remaining unread approval notifications
SELECT 
  '📊 Remaining Approval Notifications' as check_name,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE read = false) as unread_count
FROM public.notifications
WHERE title LIKE '%approved%'
  OR message LIKE '%approved%'
  OR message LIKE '%full access%';

-- Show all notifications for debugging
SELECT 
  user_id,
  title,
  message,
  read,
  created_at
FROM public.notifications
WHERE title LIKE '%approved%'
  OR message LIKE '%approved%'
  OR message LIKE '%full access%'
ORDER BY created_at DESC
LIMIT 10;
