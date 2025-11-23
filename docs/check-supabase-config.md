# Check Supabase Configuration for Email Confirmation

## URGENT: Check Redirect URLs

The most common reason users can't open confirmation links is that the redirect URL is not whitelisted in Supabase.

### Steps to Fix:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in left sidebar
   - Click "URL Configuration"

3. **Check "Redirect URLs" Section**
   
   You should see these URLs listed:
   ```
   https://your-production-domain.com/*
   http://localhost:5173/*
   ```

4. **If Missing, Add Them:**
   - Click "Add URL" or edit the list
   - Add your production domain: `https://your-domain.com/*`
   - Add localhost for dev: `http://localhost:5173/*`
   - Click "Save"

5. **Also Check "Site URL"**
   - Should be set to your production domain
   - Example: `https://your-domain.com`

## What Happens If Not Configured?

❌ **Without proper redirect URLs:**
- User clicks email link
- Supabase shows "Invalid redirect URL" error
- User cannot complete confirmation
- User cannot access the site

✅ **With proper redirect URLs:**
- User clicks email link
- Supabase verifies token
- Redirects to /confirm-email page
- User sees confirmation success
- User gets redirected to dashboard

## Quick Test

To test if this is the issue:

1. Register a new test user
2. Check the confirmation email
3. Look at the link URL - it should contain:
   ```
   redirect_to=https://your-domain.com/confirm-email
   ```
4. Click the link
5. If you see "Invalid redirect URL" → URLs not whitelisted
6. If you see blank page → Check browser console
7. If it works → Configuration is correct!

## Current Configuration in Code

```typescript
// src/pages/TutorRegistration.tsx
// src/pages/LearnerRegistration.tsx

emailRedirectTo: `${window.location.origin}/confirm-email`
```

This means:
- In development: `http://localhost:5173/confirm-email`
- In production: `https://your-domain.com/confirm-email`

**Both must be whitelisted in Supabase!**

## Other Possible Issues

If redirect URLs are correct but still not working:

1. **Email in Spam Folder**
   - Links in spam are often disabled by email providers
   - Ask user to move email to inbox

2. **Link Expired**
   - Confirmation links expire after 24 hours
   - User needs to request new email

3. **Browser/Security Blocking**
   - Try different browser
   - Try incognito mode
   - Disable extensions

4. **Email Client Issue**
   - Try copying link and pasting in browser
   - Try viewing email in web browser

## Need More Help?

See: `docs/email-confirmation-troubleshooting.md` for detailed troubleshooting guide.
