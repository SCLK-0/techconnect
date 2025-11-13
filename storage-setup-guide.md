# Storage Buckets Setup Guide

After running the main migration SQL, you need to manually create storage buckets in your Supabase dashboard.

## Step 1: Create Storage Buckets

Go to your Supabase dashboard → Storage → Create bucket

Create these 3 buckets:

### 1. avatars (Public)
- Name: `avatars`
- Public bucket: **Yes** (check the box)
- File size limit: 2 MB (recommended)
- Allowed MIME types: `image/*`

### 2. resources (Public)
- Name: `resources`
- Public bucket: **Yes** (check the box)
- File size limit: 50 MB (recommended)
- Allowed MIME types: `application/pdf`, `image/*`, `application/zip`, etc.

### 3. donation-proofs (Public)
- Name: `donation-proofs`
- Public bucket: **Yes** (check the box)
- File size limit: 5 MB (recommended)
- Allowed MIME types: `image/*`

## Step 2: Set Storage Policies

After creating the buckets, go to each bucket → Policies and add these policies:

### For `avatars` bucket:

```sql
-- Allow public to view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### For `resources` bucket:

```sql
-- Allow public to view approved resources
CREATE POLICY "Public can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Allow tutors to upload resources
CREATE POLICY "Tutors can upload resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow tutors to update their own resources
CREATE POLICY "Tutors can update own resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow tutors to delete their own resources
CREATE POLICY "Tutors can delete own resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### For `donation-proofs` bucket:

```sql
-- Allow public to view donation proofs
CREATE POLICY "Public can view donation proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'donation-proofs');

-- Allow users to upload donation proofs
CREATE POLICY "Users can upload donation proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'donation-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own donation proofs
CREATE POLICY "Users can update own donation proofs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'donation-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 3: Enable Realtime (Optional but Recommended)

Go to Database → Replication → enable realtime for these tables:
- `sessions`
- `session_messages`
- `notifications`
- `whiteboard_actions`
- `whiteboard_states`

## Done!

Your storage is now configured and ready to use.
