# 📝 Quick Commands Reference

## Setup Commands

### Run Automated Setup
```powershell
.\setup-resend-emails.ps1
```

### Manual Setup
```powershell
# Set secrets
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set SUPABASE_URL=https://frozkocrdudvtqhhgqzl.supabase.co

# Deploy functions
supabase functions deploy send-confirmation-email --no-verify-jwt
supabase functions deploy send-password-reset --no-verify-jwt
supabase functions deploy send-notification-email --no-verify-jwt
```

## Verification Commands

### List Secrets
```powershell
supabase secrets list
```

### List Functions
```powershell
supabase functions list
```

### Check Function Status
```powershell
supabase functions inspect send-confirmation-email
```

## Logging Commands

### View Recent Logs
```powershell
supabase functions logs send-confirmation-email
supabase functions logs send-password-reset
supabase functions logs send-notification-email
```

### Follow Logs (Real-time)
```powershell
supabase functions logs send-confirmation-email --follow
```

### View Last N Lines
```powershell
supabase functions logs send-confirmation-email --tail 50
```

## Testing Commands

### Test Confirmation Email
```powershell
curl -X POST https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email `
  -H "Content-Type: application/json" `
  -d '{
    "user": {
      "email": "test@example.com",
      "user_metadata": {"full_name": "Test User"}
    },
    "email_data": {
      "token_hash": "test_token",
      "redirect_to": "http://localhost:8080/confirm-email",
      "email_action_type": "signup"
    }
  }'
```

### Test Password Reset
```powershell
curl -X POST https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-password-reset `
  -H "Content-Type: application/json" `
  -d '{
    "user": {
      "email": "test@example.com",
      "user_metadata": {"full_name": "Test User"}
    },
    "email_data": {
      "token_hash": "test_token",
      "redirect_to": "http://localhost:8080/reset-password",
      "email_action_type": "recovery"
    }
  }'
```

### Test Notification Email
```powershell
curl -X POST https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-notification-email `
  -H "Content-Type: application/json" `
  -H "apikey: YOUR_SUPABASE_ANON_KEY" `
  -d '{
    "to": "test@example.com",
    "title": "Test Notification",
    "message": "This is a test notification",
    "type": "info"
  }'
```

## Redeployment Commands

### Redeploy Single Function
```powershell
supabase functions deploy send-confirmation-email
```

### Redeploy All Functions
```powershell
supabase functions deploy send-confirmation-email
supabase functions deploy send-password-reset
supabase functions deploy send-notification-email
```

### Force Redeploy
```powershell
supabase functions deploy send-confirmation-email --no-verify-jwt --force
```

## Troubleshooting Commands

### Check Supabase Status
```powershell
supabase status
```

### Check Login Status
```powershell
supabase projects list
```

### Relink Project
```powershell
supabase link --project-ref frozkocrdudvtqhhgqzl
```

### Check Function Errors
```powershell
supabase functions logs send-confirmation-email | Select-String "error"
```

## Dashboard URLs

### Open Auth Hooks
```powershell
Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks"
```

### Open Email Provider
```powershell
Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers"
```

### Open Functions
```powershell
Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/functions"
```

### Open Resend Dashboard
```powershell
Start-Process "https://resend.com/emails"
```

### Open Resend API Keys
```powershell
Start-Process "https://resend.com/api-keys"
```

## Cleanup Commands

### Delete Function (if needed)
```powershell
supabase functions delete send-confirmation-email
```

### Unset Secret (if needed)
```powershell
supabase secrets unset RESEND_API_KEY
```

## Development Commands

### Run Function Locally (if supported)
```powershell
supabase functions serve send-confirmation-email
```

### Test Local Function
```powershell
curl -X POST http://localhost:54321/functions/v1/send-confirmation-email `
  -H "Content-Type: application/json" `
  -d '{"user":{"email":"test@example.com"},"email_data":{"token_hash":"test"}}'
```

## Monitoring Commands

### Check Email Delivery
```powershell
# Check Resend dashboard
Start-Process "https://resend.com/emails"
```

### Check Function Invocations
```powershell
# Check Supabase dashboard
Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/functions"
```

## Quick Fixes

### If Auth Token Error
```powershell
# Redeploy without JWT verification
supabase functions deploy send-confirmation-email --no-verify-jwt
```

### If Secrets Not Working
```powershell
# Reset secrets
supabase secrets unset RESEND_API_KEY
supabase secrets set RESEND_API_KEY=re_your_new_key
```

### If Function Not Found
```powershell
# Redeploy
supabase functions deploy send-confirmation-email --no-verify-jwt
```

## Useful Aliases (Optional)

Add to your PowerShell profile:

```powershell
# Add to: $PROFILE

function Deploy-EmailFunctions {
    supabase functions deploy send-confirmation-email --no-verify-jwt
    supabase functions deploy send-password-reset --no-verify-jwt
    supabase functions deploy send-notification-email --no-verify-jwt
}

function Watch-EmailLogs {
    supabase functions logs send-confirmation-email --follow
}

function Open-EmailDashboard {
    Start-Process "https://resend.com/emails"
}

function Open-AuthHooks {
    Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks"
}
```

Then use:
```powershell
Deploy-EmailFunctions
Watch-EmailLogs
Open-EmailDashboard
Open-AuthHooks
```

## Environment Variables

### Required
- `RESEND_API_KEY` - Your Resend API key
- `SUPABASE_URL` - Your Supabase project URL

### Optional
- None (we removed SEND_EMAIL_HOOK_SECRET)

## Common Workflows

### Initial Setup
```powershell
.\setup-resend-emails.ps1
# Then configure dashboard
```

### Update Email Template
```powershell
# 1. Edit function file
# 2. Redeploy
supabase functions deploy send-confirmation-email
# 3. Test
```

### Debug Email Issues
```powershell
# 1. Check logs
supabase functions logs send-confirmation-email

# 2. Check Resend
Start-Process "https://resend.com/emails"

# 3. Test manually
curl -X POST https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email ...
```

### Monitor Production
```powershell
# Watch logs
supabase functions logs send-confirmation-email --follow

# Check Resend dashboard periodically
Start-Process "https://resend.com/emails"
```

## Quick Links

- **Auth Hooks:** https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
- **Email Provider:** https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
- **Functions:** https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/functions
- **Resend Emails:** https://resend.com/emails
- **Resend API Keys:** https://resend.com/api-keys

## Help Commands

### Get Help
```powershell
supabase functions --help
supabase secrets --help
```

### Check Version
```powershell
supabase --version
```

### Update CLI
```powershell
# Using npm
npm update -g supabase

# Using Homebrew (if on Mac/Linux)
brew upgrade supabase
```

---

**Tip:** Bookmark this file for quick reference!
