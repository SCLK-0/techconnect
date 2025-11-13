# Complete Resend Email Setup Guide

## Overview
This guide sets up Resend for all email needs:
- ✅ Email confirmation (signup)
- ✅ Password reset
- ✅ Notifications

## Prerequisites

1. **Resend Account**
   - Sign up at https://resend.com
   - Get your API key from https://resend.com/api-keys

2. **Supabase CLI**
   - Make sure you're logged in: `supabase login`
   - Link to your project: `supabase link --project-ref frozkocrdudvtqhhgqzl`

## Step 1: Set Environment Variables

### Set RESEND_API_KEY
```powershell
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

Replace `re_your_api_key_here` with your actual Resend API key.

### Set SUPABASE_URL (if not already set)
```powershell
supabase secrets set SUPABASE_URL=https://frozkocrdudvtqhhgqzl.supabase.co
```

### Verify secrets
```powershell
supabase secrets list
```

You should see:
- RESEND_API_KEY
- SUPABASE_URL

## Step 2: Deploy Edge Functions

### Deploy all email functions
```powershell
# Deploy confirmation email function
supabase functions deploy send-confirmation-email

# Deploy password reset function
supabase functions deploy send-password-reset

# Deploy notification email function
supabase functions deploy send-notification-email
```

### Verify deployment
```powershell
supabase functions list
```

All three functions should be listed and deployed.

## Step 3: Configure Auth Hooks in Supabase Dashboard

### A. Email Confirmation Hook

1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

2. Click "Enable Hooks" or "Add Hook"

3. Configure:
   - **Hook Name:** Send confirmation email
   - **Hook Type:** Send Email
   - **Event:** Validate Email (or Signup)
   - **Function URL:** `https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email`
   - **HTTP Method:** POST
   - **HTTP Headers:** Leave empty (no authorization needed)

4. Click "Create" or "Save"

### B. Password Reset Hook

1. In the same Auth Hooks page, click "Add Hook"

2. Configure:
   - **Hook Name:** Send password reset
   - **Hook Type:** Send Email
   - **Event:** Password Recovery
   - **Function URL:** `https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-password-reset`
   - **HTTP Method:** POST
   - **HTTP Headers:** Leave empty

3. Click "Create" or "Save"

## Step 4: Disable Built-in Supabase Emails

Since we're using custom emails, disable Supabase's built-in ones:

1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers

2. Find "Email" provider

3. **Uncheck** these (since we're using custom hooks):
   - ❌ Confirm email (we handle this with our hook)
   
4. Keep these checked:
   - ✅ Enable email provider
   - ✅ Enable email signup

5. Click "Save"

## Step 5: Configure Resend Domain (Optional but Recommended)

### Using Default Domain (Quick Start)
- Emails will come from: `onboarding@resend.dev`
- Works immediately, no setup needed
- Good for testing

### Using Custom Domain (Production)
1. Go to https://resend.com/domains
2. Add your domain (e.g., `techconnect.com`)
3. Add DNS records as instructed
4. Verify domain
5. Update edge functions to use your domain:
   ```typescript
   from: "TechConnect <noreply@yourdomain.com>"
   ```

## Step 6: Test the Setup

### Test Email Confirmation
```powershell
# In your app, try registering a new user
# Or test directly with curl:
curl -X POST https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "user_metadata": {
        "full_name": "Test User"
      }
    },
    "email_data": {
      "token_hash": "test_token",
      "redirect_to": "http://localhost:8080/confirm-email",
      "email_action_type": "signup"
    }
  }'
```

### Test Password Reset
1. Go to your app's login page
2. Click "Forgot Password"
3. Enter email
4. Check inbox for reset email

### Test Notifications
```powershell
curl -X POST https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-notification-email \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "to": "test@example.com",
    "title": "Test Notification",
    "message": "This is a test notification",
    "type": "info"
  }'
```

## Step 7: Monitor and Debug

### Check Function Logs
```powershell
# View logs for confirmation emails
supabase functions logs send-confirmation-email

# View logs for password reset
supabase functions logs send-password-reset

# View logs for notifications
supabase functions logs send-notification-email
```

### Check Resend Dashboard
- Go to https://resend.com/emails
- See all sent emails
- Check delivery status
- View any errors

## Troubleshooting

### "Hook requires authorization token"
- Make sure you didn't add any authorization headers in the hook configuration
- The new functions don't require webhook verification

### Emails not sending
- Check RESEND_API_KEY is set correctly
- Check function logs for errors
- Verify Resend account is active
- Check Resend dashboard for failed emails

### Emails going to spam
- Use a custom verified domain (not resend.dev)
- Add SPF, DKIM, and DMARC records
- Warm up your domain gradually

### Function deployment fails
- Make sure you're logged in: `supabase login`
- Make sure you're linked: `supabase link --project-ref frozkocrdudvtqhhgqzl`
- Check for syntax errors in function code

## Email Templates

All email templates include:
- Responsive design
- Mobile-friendly
- Professional styling
- Security warnings
- Clear call-to-action buttons
- Fallback text links

## Next Steps

1. Test all email flows thoroughly
2. Customize email templates if needed
3. Set up custom domain in Resend
4. Monitor email delivery rates
5. Set up email analytics (optional)

## Cost Considerations

**Resend Pricing:**
- Free tier: 3,000 emails/month
- Pro: $20/month for 50,000 emails
- More at: https://resend.com/pricing

**Supabase Edge Functions:**
- Free tier: 500,000 invocations/month
- Pro: 2,000,000 invocations/month
- More at: https://supabase.com/pricing

## Support

- Resend Docs: https://resend.com/docs
- Supabase Auth Hooks: https://supabase.com/docs/guides/auth/auth-hooks
- Edge Functions: https://supabase.com/docs/guides/functions

## Summary

✅ Three email functions deployed
✅ Auth hooks configured
✅ Resend integrated
✅ Professional email templates
✅ No webhook verification issues
✅ Easy to maintain and extend
