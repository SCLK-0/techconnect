# 🔧 Fix Persistent Approval Toast

## Problem

Toast notification keeps showing:
> "Your tutor profile has been approved! You now have full access."

## Root Cause

The trigger that creates approval notifications doesn't check for duplicates, so:
1. Every time the tutor profile is updated (for any reason)
2. A new notification is created
3. The toast appears again

## Solution

Run this SQL to:
1. Delete old approval notifications
2. Update the trigger to prevent duplicates

### Quick Fix

1. Open: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/sql/new
2. Copy contents of `fix-approval-notification-trigger.sql`
3. Click "Run"
4. Refresh your browser

### What the Fix Does

**Before:**
```sql
-- Old trigger - creates notification every time
IF NEW.status = 'approved' THEN
  INSERT INTO notifications ...
END IF;
```

**After:**
```sql
-- New trigger - checks for duplicates first
IF NEW.status != OLD.status AND NEW.status = 'approved' THEN
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE ...) THEN
    INSERT INTO notifications ...
  END IF;
END IF;
```

**Changes:**
1. ✅ Only creates notification when status CHANGES to approved
2. ✅ Checks if notification already exists (within 7 days)
3. ✅ Prevents duplicate notifications

## Alternative: Just Delete the Notification

If you just want to remove the notification without fixing the trigger:

```sql
DELETE FROM public.notifications
WHERE title LIKE '%Tutor Profile Approved%';
```

Then refresh your browser.

## Testing

After running the fix:
1. Refresh browser
2. ✅ Toast should not appear
3. Navigate between pages
4. ✅ Toast should not appear
5. Check bell icon - notification might still be there (that's OK)
6. Click notification to mark as read

## Why the Toast Kept Appearing

The age check in `NotificationBell.tsx` only shows toasts for notifications less than 10 seconds old. But if:
- A new notification is created on every page load
- Or the realtime subscription receives it as a new INSERT event
- Then the toast appears again

The fix prevents new notifications from being created in the first place.

## Summary

**Quick Fix:**
1. Run `fix-approval-notification-trigger.sql`
2. Refresh browser
3. Toast should be gone

**What Changed:**
- ✅ Trigger now checks for duplicates
- ✅ Old notifications deleted
- ✅ Won't create new ones unless status actually changes

---

**Note:** The notification will still appear in the bell dropdown (that's normal). You can click it to mark as read, or run the delete SQL to remove it completely.
