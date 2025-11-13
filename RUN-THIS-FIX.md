# Fix Session Storage and Realtime Issues

## Issues Found

1. **Asset Upload Failing** - RLS policy violation when uploading files
   - Error: `new row violates row-level security policy`
   - The storage policies expect user ID as first folder, but code uses `session-{id}` format

2. **Whiteboard Save Failing** - 400 error when saving whiteboard state
   - Error: `Failed to load resource: the server responded with a status of 400`
   - Need to verify whiteboard_states table exists and has proper policies

3. **Realtime Deprecation Warning** - Not breaking but needs attention
   - Warning: `Realtime send() is automatically falling back to REST API`
   - This is a deprecation warning from Supabase JS client

## How to Fix

### Step 1: Run the SQL Fix

1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl
2. Go to **SQL Editor**
3. Copy and paste the contents of `fix-session-storage-and-realtime.sql`
4. Click **Run**

### Step 2: Verify the Fix

After running the SQL, check the output at the bottom. You should see:

- Storage policies for session folders created
- Session assets policies updated
- Whiteboard states table verified/created

### Step 3: Test

1. Try uploading a file in a session
2. Try drawing on the whiteboard
3. Check browser console for errors

## What the Fix Does

### Storage Policies
- Allows authenticated users to upload files to `session-{id}` folders in resources bucket
- Allows users to manage files in sessions they're part of (tutor or learner)

### Session Assets Policies
- Separate policies for SELECT, INSERT, UPDATE, DELETE
- Users can only manage assets for sessions they're part of
- Only uploaders or tutors can delete assets

### Whiteboard States
- Creates table if it doesn't exist
- Ensures proper RLS policies for viewing and managing whiteboard state
- Only session participants can access whiteboard state

## Alternative: Use Supabase CLI

If you prefer using CLI:

```bash
# Read the SQL file and execute it
Get-Content fix-session-storage-and-realtime.sql | supabase db execute --db-url $env:SUPABASE_DB_URL
```

Or connect with psql:
```bash
psql "$env:SUPABASE_DB_URL" -f fix-session-storage-and-realtime.sql
```
