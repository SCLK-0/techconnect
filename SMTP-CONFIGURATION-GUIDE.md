# 🔧 SMTP Configuration for Resend

## Exact Settings to Use

Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/settings/auth

Scroll to **"SMTP Settings"** and configure:

### Option 1: Try Port 465 (SSL)
```
Enable Custom SMTP: ON
Host: smtp.resend.com
Port: 465
Username: resend
Password: re_VY5kWjQC_DGo1PLpgSeWKmxhGcBjGnCw1
Sender email: onboarding@resend.dev
Sender name: TechConnect
Admin email: your-email@example.com
```

### Option 2: Try Port 587 (TLS)
```
Enable Custom SMTP: ON
Host: smtp.resend.com
Port: 587
Username: resend
Password: re_VY5kWjQC_DGo1PLpgSeWKmxhGcBjGnCw1
Sender email: onboarding@resend.dev
Sender name: TechConnect
Admin email: your-email@example.com
```

## Important Notes:

1. **Sender Email:** Must use `onboarding@resend.dev` (Resend's default) OR a verified domain
2. **Password:** Use your full Resend API key (starts with `re_`)
3. **Username:** Always `resend`

## Test After Saving

1. Click "Save"
2. Wait 30 seconds for changes to apply
3. Try registering again
4. Check browser console for errors

## If Still Not Working

### Check Resend API Key Status
1. Go to: https://resend.com/api-keys
2. Make sure your API key is active
3. Check if it has SMTP permissions

### Alternative: Use Resend's SMTP Password
Resend might require a separate SMTP password instead of the API key.

1. Go to: https://resend.com/settings/smtp
2. Generate an SMTP password
3. Use that password instead of the API key

## Troubleshooting

### Error: "Authentication failed"
- Wrong username or password
- Try generating SMTP password from Resend dashboard

### Error: "Connection refused"
- Wrong port
- Try switching between 465 and 587

### Error: "Sender not verified"
- Use `onboarding@resend.dev`
- Or verify your own domain in Resend

## Quick Test

After configuration, you can test SMTP from Supabase:
1. Go to Auth settings
2. Look for "Send test email" button
3. Click it to test the SMTP connection

---

**Most likely issue:** Resend might need you to generate a separate SMTP password instead of using the API key directly.

Check: https://resend.com/settings/smtp
