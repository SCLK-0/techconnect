# Quick Migration Checklist

Use this checklist to migrate from Lovable Cloud to your own Supabase project.

## ✅ Pre-Migration Checklist

- [ ] Supabase account created at [supabase.com](https://supabase.com)
- [ ] New project created (save your database password!)
- [ ] Project credentials copied from Settings → API:
  - [ ] Project URL: `https://xxxxx.supabase.co`
  - [ ] Anon/Public Key: `eyJh...`
  - [ ] Service Role Key: `eyJh...` (keep secret!)
  - [ ] Project Reference ID: `xxxxx`

## 📦 Step 1: Database Schema Migration

### Option A: Use the All-in-One Migration (Recommended)
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `migration-to-external-supabase.sql`
3. Paste and click "Run"
4. Wait 30-60 seconds
5. ✅ Verify: Should see "Success. No rows returned"

### Option B: Run Individual Migrations (If Option A fails)
Run each migration file in order from `supabase/migrations/`:
```bash
# You have 29 migration files - run them in timestamp order
20251105193208_remix_batch_13_migrations.sql
20251105194637_86818a8b-7bb8-4253-a655-cc5ce5c78695.sql
# ... and so on
```

## 🗄️ Step 2: Storage Buckets Setup

### Create 3 Buckets (Dashboard → Storage → Create bucket)

1. **avatars** (Public)
   - [ ] Created
   - [ ] Set to Public
   - [ ] Policies added (see `storage-setup-guide.md`)

2. **resources** (Public)
   - [ ] Created
   - [ ] Set to Public
   - [ ] Policies added

3. **donation-proofs** (Public)
   - [ ] Created
   - [ ] Set to Public
   - [ ] Policies added

## 🔐 Step 3: Authentication Setup

Dashboard → Authentication → Providers:
- [ ] Email provider enabled
- [ ] Site URL set: `https://your-app.lovable.app` (or your domain)
- [ ] Redirect URLs added:
  - `https://your-app.lovable.app/**`
  - `http://localhost:5173/**`
- [ ] Email confirmation: Disabled for testing (enable later)

## ⚡ Step 4: Deploy Edge Functions

### Install Supabase CLI
```bash
npm install -g supabase
```

### Deploy Functions
```bash
# Login
supabase login

# Link to your project
supabase link --project-ref YOUR-PROJECT-REF

# Deploy all 3 functions
supabase functions deploy send-confirmation-email
supabase functions deploy send-notification-email
supabase functions deploy send-password-reset
```

### Set Function Secrets
```bash
supabase secrets set RESEND_API_KEY=your_resend_key_here
```

## 🔄 Step 5: Enable Realtime (Optional but Recommended)

Dashboard → Database → Replication → Enable for:
- [ ] sessions
- [ ] session_messages
- [ ] notifications
- [ ] whiteboard_actions
- [ ] whiteboard_states

## 🌐 Step 6: Update Environment Variables

### For Local Development
Update `.env` file:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-ref
```

### For Lovable Hosting
Go to Lovable → Project Settings → Environment Variables and update the same values.

## 🧪 Step 7: Test Everything

Run locally:
```bash
npm install
npm run dev
```

Test these features:
- [ ] User registration (learner)
- [ ] User registration (tutor)
- [ ] Email confirmation (check inbox)
- [ ] Login/Logout
- [ ] Profile updates
- [ ] Avatar upload
- [ ] Session creation
- [ ] Session acceptance
- [ ] File uploads (resources, donation proofs)
- [ ] Notifications
- [ ] Admin functions (if applicable)

## 📊 Step 8: Data Migration (If you have existing users)

### Export from Lovable Cloud
1. Go to each table in Lovable's Supabase
2. Export to CSV
3. Save all CSVs

### Import to New Supabase
1. Dashboard → Table Editor
2. For each table → Insert → Import via spreadsheet
3. Upload CSV and map columns

**⚠️ Important**: User passwords won't transfer. Options:
- Users reset passwords via "Forgot Password"
- Or manually handle auth migration

## 🚀 Step 9: Go Live

- [ ] All tests passing
- [ ] Edge functions working
- [ ] Storage working
- [ ] Emails sending
- [ ] Update production environment variables
- [ ] Deploy to production
- [ ] Monitor logs for 24-48 hours

## 🔍 Troubleshooting

### "relation does not exist" error
→ Run the complete migration SQL script

### Users can't log in
→ Check auth settings and redirect URLs

### File uploads failing
→ Verify storage buckets created and policies set

### Edge functions not working
→ Check secrets are set: `supabase secrets list`

### RLS policy errors
→ Verify all policies created from migration script

## 📝 Quick Commands Reference

```bash
# Check Supabase CLI version
supabase --version

# List all functions
supabase functions list

# View function logs
supabase functions logs send-notification-email

# List secrets
supabase secrets list

# Unlink project (if needed)
supabase unlink
```

## ⏱️ Estimated Time

- Database setup: 15 minutes
- Storage setup: 10 minutes
- Edge functions: 10 minutes
- Testing: 30 minutes
- Data migration (if needed): 30-60 minutes
- **Total**: 1-2 hours

## 🆘 Need Help?

Check these logs:
- Supabase Dashboard → Logs → Database
- Supabase Dashboard → Logs → Edge Functions
- Browser Console (F12)

---

**Current Status**: Your project is already configured with:
- ✅ 29 migration files ready
- ✅ 3 edge functions ready
- ✅ Complete schema in `migration-to-external-supabase.sql`
- ✅ Storage policies documented
- ✅ Environment variables template

You're ready to migrate! 🎉
