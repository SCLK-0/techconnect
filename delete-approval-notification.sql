-- =============================================
-- DELETE OLD APPROVAL NOTIFICATION
-- Remove the persistent approval notification
-- =============================================

-- Delete all approval notifications
DELETE FROM public.notifications
WHERE title LIKE '%Tutor Profile Approved%'
   OR title LIKE '%approved%'
   OR message LIKE '%tutor profile has been approved%'
   OR message LIKE '%full access%';

-- Verify deletion
SELECT 
  '✅ Remaining Notifications' as check_name,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE title LIKE '%approved%') as approval_notifications
FROM public.notifications;

-- Show all notifications for debugging
SELECT 
  id,
  user_id,
  title,
  message,
  created_at,
  read
FROM public.notifications
ORDER BY created_at DESC
LIMIT 10;
