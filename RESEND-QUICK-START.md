# 🚀 Resend Email - Quick Start

## 1-Minute Setup

### Run the Script
```powershell
.\setup-resend-emails.ps1
```

### What You Need
1. Resend API key from https://resend.com/api-keys
2. Supabase CLI installed and logged in

### What It Does
- ✅ Sets environment variables
- ✅ Deploys 3 email functions
- ✅ Guides you through dashboard setup

## Manual Setup (5 minutes)

### 1. Set Secrets
```powershell
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set SUPABASE_URL=https://frozkocrdudvtqhhgqzl.supabase.co
```

### 2. Deploy Functions
```powershell
supabase functions deploy send-confirmation-email --no-verify-jwt
supabase functions deploy send-password-reset --no-verify-jwt
supabase functions deploy send-notification-email --no-verify-jwt
```

### 3. Configure Hooks

**Auth Hooks Page:**
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

**Add Two Hooks:**

**Hook 1: Email Confirmation**
- Name: `Send confirmation email`
- Type: `Send Email`
- Event: `Validate Email`
- URL: `https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email`
- Method: `POST`
- Headers: (empty)

**Hook 2: Password Reset**
- Name: `Send password reset`
- Type: `Send Email`
- Event: `Password Recovery`
- URL: `https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-password-reset`
- Method: `POST`
- Headers: (empty)

### 4. Disable Built-in Emails

**Email Provider Page:**
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers

- ✅ Enable email provider
- ❌ Confirm email (uncheck - we use custom)
- ✅ Enable email signup

### 5. Test

```powershell
# Test registration
# Go to http://localhost:8080 and register

# View logs
supabase functions logs send-confirmation-email
```

## Email Functions

### 1. Confirmation Email
- **Trigger:** User signs up
- **Template:** Welcome message with confirmation link
- **Function:** `send-confirmation-email`

### 2. Password Reset
- **Trigger:** User requests password reset
- **Template:** Reset link with 1-hour expiry
- **Function:** `send-password-reset`

### 3. Notifications
- **Trigger:** Manual (from your code)
- **Template:** Generic notification
- **Function:** `send-notification-email`

## Usage Examples

### Send Notification from Code
```typescript
const { data, error } = await supabase.functions.invoke('send-notification-email', {
  body: {
    to: 'user@example.com',
    title: 'New Message',
    message: 'You have a new message from your tutor',
    type: 'info'
  }
});
```

### Check Logs
```powershell
# Real-time logs
supabase functions logs send-confirmation-email --follow

# Last 100 lines
supabase functions logs send-password-reset
```

## Troubleshooting

### "Hook requires authorization token"
- Don't add authorization headers in hook config
- Functions don't use webhook verification

### Emails not sending
```powershell
# Check secrets
supabase secrets list

# Check logs
supabase functions logs send-confirmation-email

# Check Resend dashboard
# https://resend.com/emails
```

### Function not found
```powershell
# Redeploy
supabase functions deploy send-confirmation-email --no-verify-jwt

# List functions
supabase functions list
```

## Email Customization

Edit these files to customize templates:
- `supabase/functions/send-confirmation-email/index.ts`
- `supabase/functions/send-password-reset/index.ts`
- `supabase/functions/send-notification-email/index.ts`

Then redeploy:
```powershell
supabase functions deploy send-confirmation-email
```

## Cost

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for testing and small apps

**Upgrade when needed:**
- Pro: $20/month for 50,000 emails

## Links

- 📧 Resend Dashboard: https://resend.com/emails
- 🔑 API Keys: https://resend.com/api-keys
- 🪝 Auth Hooks: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
- 📖 Full Guide: SETUP-RESEND-EMAILS.md

## Status Check

After setup, verify:
- [ ] Secrets set (`supabase secrets list`)
- [ ] Functions deployed (`supabase functions list`)
- [ ] Hooks configured (check dashboard)
- [ ] Built-in emails disabled (check providers)
- [ ] Test registration works
- [ ] Test password reset works
- [ ] Emails received in inbox

## Done! 🎉

Your email system is now:
- ✅ Professional looking
- ✅ Reliable
- ✅ Easy to maintain
- ✅ Scalable
- ✅ Cost-effective
