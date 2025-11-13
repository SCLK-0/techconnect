-- =============================================
-- FIX PERSISTENT TOAST NOTIFICATION POPUP
-- Remove old approval notifications that keep showing
-- =============================================

-- ISSUE: Toast notification "Your tutor profile has been approved!" 
-- keeps popping up at the bottom of the screen
-- 
-- CAUSE: Old approval notifications in the database trigger
-- the realtime subscription every time the page loads
-- =============================================

-- Solution 1: Delete old approval notifications (RECOMMENDED)
-- This removes the notification completely
DELETE FROM public.notifications
WHERE (title LIKE '%Tutor Profile Approved%'
  OR title LIKE '%approved%'
  OR message LIKE '%tutor profile has been approved%')
  AND created_at < NOW() - INTERVAL '1 day';

-- Solution 2: Mark as read (keeps notification in bell dropdown)
-- Uncomment if you want to keep the notification but stop the toast
/*
UPDATE public.notifications
SET read = true
WHERE (title LIKE '%Tutor Profile Approved%'
  OR title LIKE '%approved%'
  OR message LIKE '%tutor profile has been approved%')
  AND read = false;
*/

-- Verification: Check remaining approval notifications
SELECT 
  '📊 Remaining Approval Notifications' as check_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE read = false) as unread_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as recent_count
FROM public.notifications
WHERE title LIKE '%Tutor Profile Approved%'
  OR title LIKE '%approved%'
  OR message LIKE '%tutor profile has been approved%';

-- Show details of remaining notifications
SELECT 
  id,
  user_id,
  title,
  message,
  read,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_old
FROM public.notifications
WHERE title LIKE '%Tutor Profile Approved%'
  OR title LIKE '%approved%'
  OR message LIKE '%tutor profile has been approved%'
ORDER BY created_at DESC
LIMIT 10;
