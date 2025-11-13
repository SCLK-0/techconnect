# 🔧 Fix Persistent Toast Notification Popup

## 🚨 Problem

The toast notification (popup at bottom right) keeps showing:
> "Your tutor profile has been approved! You now have full access."

This appears every time you load the page or navigate, even though the tutor was approved days ago.

## 🔍 Root Cause

The issue has two parts:

### 1. Database Trigger
When a tutor is approved, this trigger fires:
```sql
CREATE TRIGGER on_tutor_approved
  AFTER UPDATE ON public.tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION notify_tutor_approval();
```

This creates a notification in the database.

### 2. Realtime Subscription
The `NotificationBell` component subscribes to new notifications:
```typescript
supabase
  .channel("notifications")
  .on("postgres_changes", {
    event: "INSERT",
    table: "notifications",
  }, (payload) => {
    toast.info(payload.new.title, {
      description: payload.new.message,
    });
  })
```

**The Problem:** The realtime subscription was showing a toast for ALL notifications, including old ones, every time the page loaded.

## ✅ Solutions

### Solution 1: Code Fix (APPLIED)

I've updated `src/components/NotificationBell.tsx` to only show toasts for notifications created in the last 10 seconds:

```typescript
// Only show toast for notifications created in the last 10 seconds
const notificationAge = Date.now() - new Date(newNotification.created_at).getTime();
if (notificationAge < 10000) {
  toast.info(newNotification.title, {
    description: newNotification.message,
  });
}
```

**This fix is already applied!** Just refresh your browser and the old toast should stop appearing.

### Solution 2: Delete Old Notifications (SQL)

If the toast still appears, delete the old approval notification:

1. Open: [Supabase SQL Editor](https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/sql/new)
2. Copy contents of `fix-toast-notification-popup.sql`
3. Paste and click "Run"

This will delete approval notifications older than 1 day.

### Solution 3: Mark as Read (SQL)

If you want to keep the notification in the bell dropdown but stop the toast:

```sql
UPDATE public.notifications
SET read = true
WHERE title LIKE '%Tutor Profile Approved%'
  AND read = false;
```

## 🧪 Testing

After applying the fix:

1. **Refresh the browser** (Ctrl+F5 or Cmd+Shift+R)
2. **Navigate between pages** - No toast should appear
3. **Check the bell icon** - Old notification might still be there (that's OK)
4. **Test new notifications** - They should still show toasts immediately

## 📋 How It Works Now

### Before Fix:
```
Page loads → Realtime connects → Receives ALL notifications → 
Shows toast for old approval → Toast appears every time
```

### After Fix:
```
Page loads → Realtime connects → Receives ALL notifications → 
Checks notification age → Only shows toast if < 10 seconds old → 
Old toasts don't appear ✅
```

## 🔍 Understanding the Components

### The Trigger Function
Located in database migrations:

```sql
CREATE OR REPLACE FUNCTION public.notify_tutor_approval()
RETURNS trigger AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Tutor Profile Approved',
      'Your tutor profile has been approved! You can now start accepting sessions.',
      'approval',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

This runs when `tutor_profiles.status` changes to `'approved'`.

### The NotificationBell Component
Located in `src/components/NotificationBell.tsx`:

**What it does:**
- Queries notifications from database
- Subscribes to realtime INSERT events
- Shows toast for new notifications
- Displays unread count in bell icon
- Allows marking notifications as read

**The Fix:**
Added age check before showing toast:
```typescript
const notificationAge = Date.now() - new Date(newNotification.created_at).getTime();
if (notificationAge < 10000) { // Only if less than 10 seconds old
  toast.info(newNotification.title, {
    description: newNotification.message,
  });
}
```

## ❓ Why Does This Happen?

### The Realtime Behavior

When you subscribe to Postgres changes with Supabase Realtime:
1. Connection establishes
2. You receive events for changes that happen AFTER subscription
3. However, sometimes old events can be replayed

The 10-second age check ensures:
- ✅ New notifications (just created) show toast
- ❌ Old notifications (from days ago) don't show toast
- ✅ Notification still appears in bell dropdown
- ✅ Unread count still updates

## 🛡️ Prevention

To prevent similar issues in the future:

### 1. Always Check Notification Age
When showing toasts from realtime events, check if the data is recent:
```typescript
const isRecent = Date.now() - new Date(data.created_at).getTime() < 10000;
if (isRecent) {
  toast.info(data.message);
}
```

### 2. Use Notification Types
Filter toasts by type:
```typescript
if (notification.type === 'urgent' && isRecent) {
  toast.info(notification.message);
}
```

### 3. Add Expiry to Notifications
Set an expiry date and don't show expired notifications:
```sql
ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMPTZ;
UPDATE notifications SET expires_at = created_at + INTERVAL '7 days';
```

### 4. Clean Up Old Notifications
Schedule a job to delete old notifications:
```sql
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days';
```

## 🆘 Still Showing?

If the toast still appears after the fix:

### Check 1: Clear Browser Cache
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Or clear cache completely
- Or try incognito mode

### Check 2: Verify Code Change
Check that `src/components/NotificationBell.tsx` has the age check:
```typescript
const notificationAge = Date.now() - new Date(newNotification.created_at).getTime();
if (notificationAge < 10000) {
```

### Check 3: Check Database
See if old notifications exist:
```sql
SELECT 
  id,
  title,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_old
FROM notifications
WHERE title LIKE '%approved%'
ORDER BY created_at DESC;
```

### Check 4: Delete the Notification
If all else fails, just delete it:
```sql
DELETE FROM notifications 
WHERE title LIKE '%Tutor Profile Approved%'
  AND created_at < NOW() - INTERVAL '1 day';
```

## 💡 Alternative Solutions

If you want different behavior:

### Option A: Never Show Approval Toasts
```typescript
if (notification.type !== 'approval' && isRecent) {
  toast.info(notification.title, {
    description: notification.message,
  });
}
```

### Option B: Only Show Toasts When Tab is Active
```typescript
if (document.visibilityState === 'visible' && isRecent) {
  toast.info(notification.title, {
    description: notification.message,
  });
}
```

### Option C: Show Toast Only Once Per Session
```typescript
const shownNotifications = useRef(new Set());

if (isRecent && !shownNotifications.current.has(notification.id)) {
  toast.info(notification.title, {
    description: notification.message,
  });
  shownNotifications.current.add(notification.id);
}
```

## 📚 Files Modified/Created

| File | Action | Purpose |
|------|--------|---------|
| `src/components/NotificationBell.tsx` | Modified | Added age check for toasts |
| `fix-toast-notification-popup.sql` | Created | SQL to delete old notifications |
| `FIX-TOAST-POPUP.md` | Created | This guide |

## ✨ Summary

**The Fix:** Added a 10-second age check before showing toast notifications. Old notifications (like the approval from days ago) won't trigger toasts anymore, but new notifications will still work normally.

**Action Required:** Just refresh your browser! The code fix is already applied.

**If Still Showing:** Run `fix-toast-notification-popup.sql` to delete the old notification from the database.

---

**Quick Test:** Refresh your browser and navigate between pages. The approval toast should no longer appear!
