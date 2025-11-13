# 🔧 Fix Whiteboard & Assets Issues

## Issues

1. **Whiteboard not syncing** - Drawings don't appear on other user's screen
2. **Assets not showing for other user** - Uploaded files only visible to uploader

## Root Causes

### Whiteboard Issue
The broadcast logic is still intact. If whiteboard isn't syncing, it's likely:
- Realtime connection issue
- Channel not subscribed properly
- Need to run the session fixes SQL

### Assets Issue
The `session_assets` table doesn't have realtime enabled, so INSERT events aren't being broadcast.

## Quick Fixes

### Fix 1: Enable Assets Realtime (REQUIRED)

Run this in Supabase SQL Editor:

```sql
-- Enable realtime for session_assets
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_assets;
```

Or run the file: `fix-assets-realtime.sql`

### Fix 2: Ensure Session Fixes Are Applied

If you haven't run this yet, run it now:

1. Open: [Supabase SQL Editor](https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/sql/new)
2. Copy contents of `fix-all-session-issues.sql`
3. Paste and click "Run"

This enables:
- ✅ Storage policies for file upload
- ✅ Whiteboard states table
- ✅ Session assets policies
- ✅ Chat realtime

### Fix 3: Check Browser Console

Open browser console (F12) and look for:

**For Whiteboard:**
- `📤 BROADCASTING: path:created` - Should see this when you draw
- `📥 RECEIVED: path:created` - Other user should see this
- `✅ BROADCAST SUCCESS` - Confirms broadcast worked

**For Assets:**
- `Asset added:` - Should see this when file is uploaded
- Check for any errors

## Testing After Fix

### Test 1: Assets Realtime
1. Run `fix-assets-realtime.sql` in Supabase
2. Refresh both browsers
3. User A uploads a file
4. ✅ User B should see it appear immediately
5. Check console for "Asset added:" log

### Test 2: Whiteboard Realtime
1. Ensure both users are in the session
2. Wait for "Whiteboard ready" toast (2 seconds)
3. User A draws something
4. ✅ User B should see it appear
5. User B draws something
6. ✅ User A should see it appear

## Debugging

### If Whiteboard Still Doesn't Sync

**Check 1: Console Logs**
Look for these in BOTH browsers:
```
✅ [Name] whiteboard channel SUBSCRIBED
✅ [Name] presence tracked on channel
📤 [Name] BROADCASTING: path:created
📥 [Name] RECEIVED: path:created
```

**Check 2: Channel Status**
If you see:
```
❌ BROADCAST FAILED: Channel not initialized
⏳ BROADCAST BLOCKED: Channel not ready
```
Then the channel isn't ready. Wait for "Whiteboard ready" toast.

**Check 3: Run Session Fixes**
Make sure you've run `fix-all-session-issues.sql`

### If Assets Still Don't Show

**Check 1: Realtime Enabled**
Run this query:
```sql
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename = 'session_assets';
```
Should return 1 row. If empty, run `fix-assets-realtime.sql`

**Check 2: Console Logs**
In the OTHER user's browser, you should see:
```
Asset added: {id: "...", file_name: "..."}
```

**Check 3: RLS Policies**
Run this query:
```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'session_assets';
```
Should return at least 4 policies.

## Summary

**For Assets:**
1. Run `fix-assets-realtime.sql` ← **REQUIRED**
2. Refresh browsers
3. Test upload

**For Whiteboard:**
1. Check browser console for errors
2. Ensure "Whiteboard ready" toast appears
3. Wait 2 seconds after joining before drawing
4. Check if `fix-all-session-issues.sql` was run

---

**Quick Test:** After running the SQL fix, refresh both browsers and try uploading a file. It should appear for both users immediately!
