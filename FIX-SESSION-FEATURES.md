# 🔧 Fix Session Features - Complete Guide

## 🚨 Current Problems

Your session features are broken due to database permission issues:

| Feature | Status | Error |
|---------|--------|-------|
| File Upload | ❌ Broken | `new row violates row-level security policy` |
| Whiteboard Save | ❌ Broken | `400 Bad Request` |
| Realtime Sync | ⚠️ Warning | Deprecation warning (still works) |

## 🎯 Quick Fix (5 Minutes)

### Step 1: Open Supabase SQL Editor

Click this link: [Open SQL Editor](https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/sql/new)

### Step 2: Run the Fix

1. Open `fix-session-storage-and-realtime.sql` in your code editor
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor (Ctrl+V)
4. Click **"Run"** button

### Step 3: Verify

1. Open `verify-fixes.sql` in your code editor
2. Copy contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Check output shows: `✅ ALL FIXES APPLIED`

### Step 4: Test

1. Refresh your app
2. Join a session
3. Try uploading a file ✅
4. Try drawing on whiteboard ✅
5. Check console - no more errors! ✅

## 📋 What Gets Fixed

### 1. Storage Policies (File Uploads)

**Before:**
```
Policy expects: resources/{user-id}/file.jpg
Code uploads to: resources/session-{id}/file.jpg
Result: ❌ Permission denied
```

**After:**
```
Policy allows: resources/session-{id}/file.jpg
Code uploads to: resources/session-{id}/file.jpg
Result: ✅ Upload succeeds
```

### 2. Whiteboard States

**Before:**
- Table might not exist
- Policies might be wrong
- Result: ❌ 400 error

**After:**
- Table exists with proper schema
- RLS policies allow session participants
- Result: ✅ Whiteboard saves

### 3. Session Assets

**Before:**
- Generic policies
- Missing INSERT policy
- Result: ❌ Can't add assets

**After:**
- Separate policies for each operation
- Session participants can manage
- Result: ✅ Assets work

## 🔍 Detailed Explanation

### Why File Upload Failed

Your `AssetsPanel.tsx` uploads files like this:

```typescript
const filePath = `session-${sessionId}/${Date.now()}-${file.name}`;
const { error } = await supabase.storage
  .from("resources")
  .upload(filePath, file);
```

But the old RLS policy expected:
```sql
-- Old policy (WRONG)
WITH CHECK (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
```

This checks if the first folder name equals the user ID. But you're using `session-{id}`, not user ID!

**New policy (CORRECT):**
```sql
WITH CHECK (
  bucket_id = 'resources' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] LIKE 'session-%'
)
```

This allows any authenticated user to upload to folders starting with `session-`.

### Why Whiteboard Failed

The whiteboard tries to save state to `whiteboard_states` table, but:
1. Table might not exist in your new Supabase project
2. RLS policies might be missing or wrong

The fix ensures:
- Table exists with correct schema
- Policies allow session participants to read/write
- Unique constraint on `session_id` prevents duplicates

## 🧪 Testing Checklist

After applying the fix, test these scenarios:

### Test 1: File Upload (Tutor)
- [ ] Login as tutor
- [ ] Join a session
- [ ] Click upload button
- [ ] Select a file
- [ ] File uploads successfully
- [ ] File appears in assets list

### Test 2: File Upload (Learner)
- [ ] Login as learner
- [ ] Join a session
- [ ] Click upload button
- [ ] Select a file
- [ ] File uploads successfully
- [ ] File appears in assets list

### Test 3: Whiteboard Drawing
- [ ] Join a session
- [ ] Select draw tool
- [ ] Draw something
- [ ] Check console: "✅ BROADCAST SUCCESS"
- [ ] No 400 errors
- [ ] Drawing persists on refresh

### Test 4: Whiteboard Sync
- [ ] Open session in two browsers
- [ ] Login as different users
- [ ] Draw in browser 1
- [ ] Drawing appears in browser 2
- [ ] Both users see each other's cursors

### Test 5: File Download
- [ ] Upload a file
- [ ] Click download button
- [ ] File downloads successfully

## ❓ Troubleshooting

### "Policy already exists" error
**Solution:** This is OK! The script drops old policies first. If you see this, the old policy was removed and new one created.

### "Table already exists" error
**Solution:** This is OK! The script checks if table exists before creating.

### Still getting 400 errors
**Possible causes:**
1. Fix wasn't applied - run verify-fixes.sql to check
2. Not logged in - check authentication
3. Not a session participant - verify you're tutor or learner
4. Session doesn't exist - check session ID

**Debug steps:**
1. Open browser console
2. Look for specific error message
3. Check Supabase Dashboard > Logs
4. Verify session exists in database

### Still getting RLS errors
**Possible causes:**
1. Wrong bucket name - should be "resources"
2. Not authenticated - check login status
3. Policies not applied - run verify-fixes.sql

**Debug steps:**
1. Check which bucket you're uploading to
2. Verify authentication token exists
3. Check Supabase Dashboard > Storage > Policies

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `fix-session-storage-and-realtime.sql` | Main fix - run this first |
| `verify-fixes.sql` | Check if fixes were applied |
| `URGENT-FIX-INSTRUCTIONS.md` | Quick start guide |
| `SESSION-ISSUES-SUMMARY.md` | Detailed problem analysis |
| `FIX-SESSION-FEATURES.md` | This file - complete guide |

## 🎓 Understanding RLS Policies

Row Level Security (RLS) policies control who can access what data. Think of them as "if statements" for database access:

```sql
-- Policy: "Users can upload to session folders"
CREATE POLICY "policy_name"
ON storage.objects FOR INSERT
WITH CHECK (
  -- This is like: if (condition) { allow } else { deny }
  bucket_id = 'resources'           -- Must be resources bucket
  AND auth.role() = 'authenticated' -- Must be logged in
  AND (storage.foldername(name))[1] LIKE 'session-%' -- Must be session folder
);
```

When you try to upload a file:
1. Supabase checks all INSERT policies
2. If ANY policy returns true, upload allowed
3. If ALL policies return false, upload denied

## 🚀 Next Steps

After fixing these issues:

1. **Monitor:** Watch for any new errors in console
2. **Test:** Have real users test file upload and whiteboard
3. **Optimize:** Consider adding file size limits
4. **Enhance:** Add file type restrictions if needed
5. **Update:** Fix realtime deprecation warnings (non-urgent)

## 💡 Prevention

To avoid similar issues in the future:

1. **Test RLS policies** before deploying
2. **Match code and policies** - ensure paths align
3. **Use migrations** - track all schema changes
4. **Test with real users** - not just as admin
5. **Check logs** - Supabase Dashboard > Logs

## 🆘 Still Need Help?

If you're still stuck:

1. Run `verify-fixes.sql` and share output
2. Share exact error message from console
3. Check Supabase Dashboard > Logs for server errors
4. Verify you're logged in and part of the session
5. Try with a fresh session (create new one)

---

**Remember:** The realtime deprecation warnings are cosmetic and won't break functionality. Focus on fixing the file upload and whiteboard issues first!
