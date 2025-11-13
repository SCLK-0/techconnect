-- =============================================
-- DELETE ALL APPROVAL NOTIFICATIONS
-- This will remove all tutor approval notifications from the database
-- =============================================

-- Delete all approval notifications
DELETE FROM public.notifications
WHERE type = 'approval'
  OR title LIKE '%Tutor Profile Approved%'
  OR title LIKE '%approved%'
  OR message LIKE '%tutor profile has been approved%'
  OR message LIKE '%full access%'
  OR message LIKE '%start accepting sessions%';

-- Verify deletion
SELECT 
  '✅ Remaining Approval Notifications' as check_name,
  COUNT(*) as count
FROM public.notifications
WHERE type = 'approval'
  OR title LIKE '%approved%'
  OR message LIKE '%approved%';

-- Show all remaining notifications for the user (replace with actual user_id if needed)
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  read,
  created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 20;
