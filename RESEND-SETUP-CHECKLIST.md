# ✅ Resend Email Setup Checklist

## Pre-Setup

- [ ] Supabase CLI installed
- [ ] Logged into Supabase CLI (`supabase login`)
- [ ] Project linked (`supabase link --project-ref frozkocrdudvtqhhgqzl`)
- [ ] Resend account created at https://resend.com
- [ ] Resend API key obtained from https://resend.com/api-keys

## Setup Steps

### Part 1: Environment Variables (2 min)

- [ ] Set RESEND_API_KEY
  ```powershell
  supabase secrets set RESEND_API_KEY=re_your_key_here
  ```

- [ ] Set SUPABASE_URL
  ```powershell
  supabase secrets set SUPABASE_URL=https://frozkocrdudvtqhhgqzl.supabase.co
  ```

- [ ] Verify secrets
  ```powershell
  supabase secrets list
  ```
  Should show: RESEND_API_KEY, SUPABASE_URL

### Part 2: Deploy Functions (3 min)

- [ ] Deploy confirmation email function
  ```powershell
  supabase functions deploy send-confirmation-email --no-verify-jwt
  ```

- [ ] Deploy password reset function
  ```powershell
  supabase functions deploy send-password-reset --no-verify-jwt
  ```

- [ ] Deploy notification email function
  ```powershell
  supabase functions deploy send-notification-email --no-verify-jwt
  ```

- [ ] Verify deployment
  ```powershell
  supabase functions list
  ```
  Should show all 3 functions

### Part 3: Configure Auth Hooks (5 min)

#### Email Confirmation Hook

- [ ] Open https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
- [ ] Click "Add Hook" or "Enable Hooks"
- [ ] Fill in:
  - Hook Name: `Send confirmation email`
  - Hook Type: `Send Email`
  - Event: `Validate Email` (or `Signup`)
  - Function URL: `https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email`
  - HTTP Method: `POST`
  - HTTP Headers: (leave empty)
- [ ] Click "Create" or "Save"
- [ ] Verify hook appears in list

#### Password Reset Hook

- [ ] Click "Add Hook" again
- [ ] Fill in:
  - Hook Name: `Send password reset`
  - Hook Type: `Send Email`
  - Event: `Password Recovery`
  - Function URL: `https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-password-reset`
  - HTTP Method: `POST`
  - HTTP Headers: (leave empty)
- [ ] Click "Create" or "Save"
- [ ] Verify hook appears in list

### Part 4: Configure Email Provider (2 min)

- [ ] Open https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
- [ ] Find "Email" section
- [ ] Configure:
  - ✅ Enable email provider (checked)
  - ❌ Confirm email (unchecked - we use custom hook)
  - ✅ Enable email signup (checked)
- [ ] Click "Save"

### Part 5: Testing (5 min)

#### Test Email Confirmation

- [ ] Open http://localhost:8080
- [ ] Click "Register"
- [ ] Choose "Learner" or "Tutor"
- [ ] Fill in form with real email
- [ ] Click "Create Account"
- [ ] See success message (not error)
- [ ] Check email inbox
- [ ] Receive confirmation email from TechConnect
- [ ] Email has professional design
- [ ] Click confirmation link
- [ ] Redirected to app successfully
- [ ] Can login with new account

#### Test Password Reset

- [ ] Go to login page
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] Submit
- [ ] Check email inbox
- [ ] Receive password reset email
- [ ] Email has professional design
- [ ] Click reset link
- [ ] Can set new password
- [ ] Can login with new password

#### Test Notifications (Optional)

- [ ] Run test command:
  ```powershell
  curl -X POST https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-notification-email `
    -H "Content-Type: application/json" `
    -H "apikey: YOUR_SUPABASE_ANON_KEY" `
    -d '{"to":"test@example.com","title":"Test","message":"Test message","type":"info"}'
  ```
- [ ] Receive notification email

### Part 6: Monitoring (Ongoing)

- [ ] Check function logs:
  ```powershell
  supabase functions logs send-confirmation-email
  ```

- [ ] Check Resend dashboard:
  https://resend.com/emails

- [ ] Monitor email delivery rates

- [ ] Check for any errors or bounces

## Verification

### All Systems Go ✅

- [ ] No "Hook requires authorization token" errors
- [ ] Registration sends confirmation email
- [ ] Password reset sends reset email
- [ ] Emails have professional design
- [ ] Emails arrive within 1 minute
- [ ] Links in emails work correctly
- [ ] No errors in function logs
- [ ] Resend dashboard shows successful sends

## Troubleshooting

### If emails not sending:

- [ ] Check secrets are set: `supabase secrets list`
- [ ] Check functions deployed: `supabase functions list`
- [ ] Check function logs: `supabase functions logs send-confirmation-email`
- [ ] Check Resend dashboard for errors
- [ ] Verify Resend API key is valid
- [ ] Check spam folder

### If getting auth errors:

- [ ] Verify no authorization headers in hook config
- [ ] Redeploy functions with `--no-verify-jwt` flag
- [ ] Check hook URLs are correct
- [ ] Verify hooks are enabled

### If emails going to spam:

- [ ] Set up custom domain in Resend
- [ ] Add SPF, DKIM, DMARC records
- [ ] Warm up domain gradually
- [ ] Improve email content

## Optional Enhancements

- [ ] Set up custom domain in Resend
- [ ] Customize email templates
- [ ] Add email analytics
- [ ] Set up email webhooks
- [ ] Add unsubscribe links
- [ ] Implement email preferences

## Documentation

- [ ] Read SETUP-RESEND-EMAILS.md for details
- [ ] Read RESEND-QUICK-START.md for quick reference
- [ ] Bookmark Resend docs: https://resend.com/docs
- [ ] Bookmark Supabase auth hooks docs

## Completion

**Setup completed on:** _______________

**Tested by:** _______________

**Status:** 
- [ ] ✅ All working
- [ ] ⚠️ Partial (note issues below)
- [ ] ❌ Not working (see troubleshooting)

**Notes:**
_________________________________
_________________________________
_________________________________

## Next Steps

- [ ] Test with real users
- [ ] Monitor email delivery
- [ ] Customize templates if needed
- [ ] Set up custom domain
- [ ] Configure email analytics
- [ ] Document for team

---

**Time to complete:** ~15 minutes
**Difficulty:** Medium ⭐⭐
**Impact:** High 🚀🚀🚀
