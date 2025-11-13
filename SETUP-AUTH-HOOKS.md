# Setup Auth Hooks for Email Confirmation

## The Problem
Registration is failing with a 500 error because auth hooks are not configured in your new Supabase project.

## Solution: Configure Auth Hooks

### Step 1: Go to Auth Hooks Dashboard
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

### Step 2: Enable and Configure Hook

Click **"Enable Hooks"** or **"Create Hook"**

**Configure these settings:**

1. **Hook Name:** `Send confirmation email`

2. **Hook Type:** Select **"Send Email"** from dropdown

3. **Hook URL:** 
   ```
   https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email
   ```

4. **HTTP Method:** `POST`

5. **HTTP Headers:** (Optional, but recommended)
   ```json
   {
     "Content-Type": "application/json"
   }
   ```

6. **Secrets:** (Important!)
   - The hook will automatically use the secrets you've already set
   - Make sure `SEND_EMAIL_HOOK_SECRET` is set (you already did this)

7. **Events to trigger:** 
   - Check **"Signup"** 
   - Check **"Password Recovery"** (if you want password reset emails)

8. Click **"Create"** or **"Save"**

### Step 3: Verify Hook is Active

After creating, you should see:
- Hook status: **Active** or **Enabled**
- Hook URL pointing to your edge function

### Step 4: Test Registration

1. Go to your app: http://localhost:8080
2. Try registering a new learner
3. Check your email for confirmation

---

## Alternative: Check Current Hook Configuration

If hooks are already configured, check:

1. **Hook URL is correct:**
   - Should be: `https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email`
   - NOT the old Lovable URL

2. **Secrets are set:**
   ```bash
   supabase secrets list
   ```
   Should show `SEND_EMAIL_HOOK_SECRET`

3. **Function is deployed:**
   ```bash
   supabase functions list
   ```
   Should show `send-confirmation-email` as ACTIVE

---

## Troubleshooting

### If you see "Hook requires authorization token"
- The hook secret is missing or incorrect
- Set it with: `supabase secrets set SEND_EMAIL_HOOK_SECRET=your_secret_here`

### If you see 500 Internal Server Error
- Check function logs in Dashboard → Edge Functions → send-confirmation-email → Logs
- Verify RESEND_API_KEY is set correctly
- Make sure the function is deployed (Version 8 is current)

### If emails don't arrive
- Check spam folder
- Verify RESEND_API_KEY is valid
- Check function logs for errors
- Make sure your Resend domain is verified

---

## Quick Check Commands

```bash
# Check if function is deployed
supabase functions list

# Check if secrets are set
supabase secrets list

# Check project link
supabase projects list
```

---

## What Lovable Does Differently

Lovable automatically configures auth hooks for you. When migrating to your own Supabase:
- You need to manually configure the hooks in the dashboard
- The hook URL changes from Lovable's to your own
- Secrets need to be set via CLI

This is a one-time setup - once configured, it works just like Lovable! 🚀
