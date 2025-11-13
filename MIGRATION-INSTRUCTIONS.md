# Complete Migration Guide: Lovable Cloud → External Supabase

This guide will help you migrate from Lovable Cloud to your own Supabase project.

## ⚠️ Important Notes Before Starting

- **Backup Everything**: This migration is one-way. Make sure to backup your current data.
- **Downtime**: Plan for ~30-60 minutes of downtime during migration.
- **Test First**: If possible, test the migration with a copy of your data first.
- **No Auto Data Transfer**: You'll need to manually export/import existing user data.

## Phase 1: Prepare External Supabase Project

### 1.1 Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose:
   - Organization (create new or use existing)
   - Project name: `TechConnect` (or your preference)
   - Database password: **SAVE THIS SECURELY**
   - Region: Choose closest to your users
5. Wait 2-3 minutes for project to provision

### 1.2 Get Your Credentials

In your new Supabase project:
1. Go to Settings → API
2. Copy and save these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJh...`)
   - **Service Role Key** (starts with `eyJh...` - KEEP THIS SECRET!)

### 1.3 Connect Supabase to Lovable

1. In Lovable, go to Settings → Integrations → Supabase
2. Click "Manage Connected Organizations"
3. Follow prompts to connect your Supabase account
4. Select your new TechConnect project

## Phase 2: Run Database Migration

### 2.1 Import Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `migration-to-external-supabase.sql`
4. Paste it into the SQL editor
5. Click "Run" (this may take 30-60 seconds)
6. ✅ Verify: You should see "Success. No rows returned"

### 2.2 Set Up Storage Buckets

Follow the instructions in `storage-setup-guide.md`:
1. Create 3 storage buckets (avatars, resources, donation-proofs)
2. Set policies for each bucket
3. Enable public access where needed

### 2.3 Configure Authentication

1. In Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. **Important**: Disable "Confirm email" for testing (enable later)
4. Set Site URL to: `https://your-lovable-app.lovable.app`
5. Add Redirect URLs:
   - `https://your-lovable-app.lovable.app/**`
   - `http://localhost:5173/**` (for local testing)

### 2.4 Set Up Email Templates (Optional)

If you want custom confirmation emails:
1. Go to Authentication → Email Templates
2. Configure your custom templates
3. Or set up Auth Hooks for custom email handling

## Phase 3: Update Your Lovable Project

### 3.1 Update Environment Variables

You'll need to update these files in your project:

**Create new `.env.local` file** (if deploying outside Lovable):
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**For Lovable hosting:** You'll set these in Project Settings → Environment Variables

### 3.2 Deploy Edge Functions

Your edge functions need to be deployed to the new Supabase project:

1. **send-notification-email**: Deploy this function
2. **send-confirmation-email**: Deploy this function

To deploy edge functions in external Supabase:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR-PROJECT-ID

# Deploy functions
supabase functions deploy send-notification-email
supabase functions deploy send-confirmation-email
```

### 3.3 Set Function Secrets

In Supabase Dashboard → Project Settings → Edge Functions → Secrets:
Add these secrets:
- `RESEND_API_KEY`: Your Resend API key (for emails)
- `SEND_EMAIL_HOOK_SECRET`: Generate a random secret for webhook security

## Phase 4: Export & Import Existing Data

### 4.1 Export Current Data

In your Lovable Cloud backend:
1. Go to each table and export to CSV
2. Save all CSVs to a safe location

Key tables to export:
- `profiles`
- `user_roles`
- `tutor_profiles`
- `learner_profiles`
- `sessions`
- `resources`
- `donations`
- etc.

### 4.2 Import to New Database

In your new Supabase:
1. Go to Table Editor
2. For each table, click "Insert" → "Import data via spreadsheet"
3. Upload the corresponding CSV
4. Map columns correctly
5. Click "Import"

**⚠️ Warning**: Passwords won't transfer. Users will need to reset passwords or you'll need to handle this separately.

## Phase 5: Update & Test

### 5.1 Update Lovable Project Connection

In Lovable:
1. Go to Settings → Integrations → Supabase
2. Select your external Supabase project as the active connection
3. Lovable will now use your external database

### 5.2 Test Everything

Before going live, test:
- [ ] User registration (learner & tutor)
- [ ] Email confirmation
- [ ] Login/Logout
- [ ] Session creation
- [ ] File uploads (avatars, resources, donation proofs)
- [ ] Notifications
- [ ] Admin functions
- [ ] Video sessions
- [ ] Real-time features

### 5.3 Update Production

Once testing is complete:
1. Update your production environment variables
2. Deploy your app
3. Monitor for any issues

## Phase 6: Cleanup (Optional)

After successful migration:
1. Keep Lovable Cloud active for 7-14 days as backup
2. Monitor your external Supabase for any issues
3. Once stable, you can disconnect Lovable Cloud

## Troubleshooting

### Issue: "relation does not exist"
**Solution**: Make sure you ran the complete migration SQL script

### Issue: Users can't log in
**Solution**: Check auth settings and redirect URLs are configured correctly

### Issue: File uploads failing
**Solution**: Verify storage buckets are created and policies are set

### Issue: Edge functions not working
**Solution**: Check function secrets are set and functions are deployed

### Issue: RLS policy errors
**Solution**: Verify all RLS policies were created from migration script

## Need Help?

If you run into issues:
1. Check Supabase logs in Dashboard → Logs
2. Check browser console for client-side errors
3. Ask in chat - I can help debug specific issues!

## Estimated Timeline

- Phase 1 (Setup): 10 minutes
- Phase 2 (Schema): 15 minutes
- Phase 3 (Update Project): 10 minutes
- Phase 4 (Data Migration): 30-60 minutes (depends on data volume)
- Phase 5 (Testing): 30 minutes
- **Total**: ~2 hours

Good luck with your migration! 🚀
