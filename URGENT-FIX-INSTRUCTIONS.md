# 🚨 URGENT: Fix Session Chat and Asset Upload

## Problems Identified

Your session features are failing due to database permission issues:

1. ❌ **File uploads failing** - "new row violates row-level security policy"
2. ❌ **Whiteboard not saving** - 400 error when saving drawings  
3. ⚠️ **Realtime warnings** - Deprecation warnings (not breaking, but needs attention)

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/sql/new
2. You should see a blank SQL editor

### Step 2: Copy and Run the Fix

1. Open the file `fix-session-storage-and-realtime.sql` in your editor
2. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
3. **Paste into Supabase SQL Editor** (Ctrl+V)
4. Click the **"Run"** button (or press Ctrl+Enter)

### Step 3: Verify Success

You should see output at the bottom showing:
- ✅ NOTICE: whiteboard_states table created/verified
- ✅ Multiple rows returned from the verification queries
- ✅ No errors

### Step 4: Test

1. Refresh your application
2. Try uploading a file in a session
3. Try drawing on the whiteboard
4. Check browser console - errors should be gone!

## What This Fix Does

### 1. Storage Policies (File Uploads)
**Problem:** Your code uploads files to `session-{id}/filename.jpg` but the RLS policy expected `{user-id}/filename.jpg`

**Solution:** New policies that allow:
- Authenticated users to upload to session folders
- Session participants (tutor/learner) to manage their session files

### 2. Whiteboard States
**Problem:** Table might not exist or has wrong policies

**Solution:** 
- Creates table if missing
- Sets up proper RLS policies
- Only session participants can view/edit whiteboard

### 3. Session Assets
**Problem:** Policies too restrictive or missing

**Solution:**
- Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
- Session participants can manage assets
- Only uploaders or tutors can delete

## If You Get Errors

### "relation already exists"
This is OK - it means the table already exists. The script handles this.

### "policy already exists"  
This is OK - the script drops old policies before creating new ones.

### "permission denied"
You need to be the project owner or have admin access. Check your Supabase project permissions.

## Alternative: Manual Steps

If the SQL script doesn't work, you can apply fixes manually:

### Fix 1: Storage Policies

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Tutors can upload resources" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can update own resources" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can delete own resources" ON storage.objects;

-- Create new session-based policies
CREATE POLICY "Users can upload to session folders in resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] LIKE 'session-%'
);
```

### Fix 2: Session Assets

```sql
CREATE POLICY "Users can insert session assets"
  ON public.session_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_assets.session_id
      AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
    )
  );
```

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify you're logged in as a user with session access
3. Check that the session exists and you're a participant
4. Look at the Supabase logs in Dashboard > Logs

## After Fixing

The realtime deprecation warnings are cosmetic and won't break functionality. They can be addressed later by updating the code to use `httpSend()` explicitly, but this is not urgent.
