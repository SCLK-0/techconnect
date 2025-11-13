# Fix Registration & Email Confirmation

## The Problem
Registration fails with auth hook error because email confirmation hooks are not configured.

## Quick Fix Steps

### Step 1: Go to Auth Hooks
Open this URL in your browser:
```
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
```

### Step 2: Create Email Hook

Click **"Enable Hooks"** or **"Add Hook"**

Fill in these details:

**Hook Name:** `Send confirmation email`

**Hook Type:** Select **"Send Email"**

**Function URL:**
```
https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email
```

**Events:** Check these boxes:
- ✅ Signup (for email confirmation)
- ✅ Password Recovery (for password reset)

**HTTP Method:** `POST`

Click **"Create"** or **"Save"**

### Step 3: Verify Secrets Are Set

In your terminal, run:
```bash
supabase secrets list
```

You should see:
- `RESEND_API_KEY` (for sending emails)
- `SEND_EMAIL_HOOK_SECRET` (for hook security)

If missing, set them:
```bash
supabase secrets set RESEND_API_KEY=your_resend_key_here
supabase secrets set SEND_EMAIL_HOOK_SECRET=your_secret_here
```

### Step 4: Test Registration

1. Go to your app
2. Click "Register as Learner" or "Register as Tutor"
3. Fill in the form
4. Submit
5. Check your email for confirmation link

## If It Still Doesn't Work

### Check Function Logs
1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/functions
2. Click on `send-confirmation-email`
3. Click "Logs" tab
4. Look for errors

### Common Issues

**"Hook requires authorization"**
- The `SEND_EMAIL_HOOK_SECRET` is not set
- Set it with: `supabase secrets set SEND_EMAIL_HOOK_SECRET=any_random_string`

**"Function not found"**
- The edge function is not deployed
- Deploy it with: `supabase functions deploy send-confirmation-email`

**"Invalid API key"**
- The `RESEND_API_KEY` is wrong or expired
- Get a new one from: https://resend.com/api-keys
- Set it with: `supabase secrets set RESEND_API_KEY=re_xxxxx`

## Alternative: Disable Email Confirmation (Quick Fix for Demo)

If you just need it working for your deadline and don't care about email confirmation:

1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
2. Scroll to "Email" provider
3. **Uncheck** "Confirm email"
4. Click "Save"

This will let users register without email confirmation. Good for demos, but not for production!

## After Your Deadline

Once you have more time, properly configure:
1. Email confirmation (for security)
2. Password reset emails
3. Custom email templates
4. Email rate limiting

But for now, just get it working! 🚀
