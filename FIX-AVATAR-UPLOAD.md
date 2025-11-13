# 🔧 Fix Avatar Upload Error

## The Problem
```
Error uploading avatar: StorageApiError: new row violates row-level security policy
```

This means the storage bucket has RLS enabled but no policies are configured.

## ✅ Quick Fix (2 minutes)

### Step 1: Go to Supabase SQL Editor
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/sql/new

### Step 2: Copy and Run the SQL

Copy the entire contents of `fix-storage-policies.sql` and paste it into the SQL Editor, then click **Run**.

This will create all the necessary storage policies for:
- ✅ avatars bucket
- ✅ resources bucket  
- ✅ donation-proofs bucket

### Step 3: Test Avatar Upload Again

1. Go back to your app: http://localhost:8080
2. Go to Profile/Settings
3. Try uploading an avatar again
4. ✅ Should work now!

---

## Alternative: Manual Fix via Dashboard

If you prefer using the dashboard:

### For Avatars Bucket:

1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/storage/policies
2. Select `avatars` bucket
3. Click "New Policy"
4. Add these 4 policies:

**Policy 1: View avatars**
- Name: `Avatar images are publicly accessible`
- Operation: SELECT
- Policy: `bucket_id = 'avatars'`

**Policy 2: Upload avatar**
- Name: `Users can upload their own avatar`
- Operation: INSERT
- Policy: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 3: Update avatar**
- Name: `Users can update their own avatar`
- Operation: UPDATE
- Policy: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 4: Delete avatar**
- Name: `Users can delete their own avatar`
- Operation: DELETE
- Policy: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`

Repeat similar policies for `resources` and `donation-proofs` buckets.

---

## What These Policies Do

- **SELECT policy**: Allows anyone to view/download avatars (public access)
- **INSERT policy**: Allows users to upload files to their own folder (user_id/filename)
- **UPDATE policy**: Allows users to update their own files
- **DELETE policy**: Allows users to delete their own files

The key part is: `auth.uid()::text = (storage.foldername(name))[1]`

This ensures users can only upload/modify files in folders matching their user ID.

---

## Verify Policies Are Working

After adding policies, run this in SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
```

You should see all the policies listed.

---

**Quick Fix:** Just run `fix-storage-policies.sql` in SQL Editor and you're done! 🚀
