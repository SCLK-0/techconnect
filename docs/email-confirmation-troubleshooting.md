# Email Confirmation Link Troubleshooting

## Problem
Users report they cannot open/click the confirmation email link sent to them.

## Possible Causes & Solutions

### 1. Email Provider Security Blocking

**Symptoms:**
- Link appears but doesn't work when clicked
- Link is disabled/grayed out
- Warning message about suspicious link

**Solutions:**
- Ask user to check their email provider's security settings
- Try copying the link and pasting it directly in browser
- Check if email is in spam/junk folder (links in spam are often disabled)
- Try a different email provider (Gmail, Outlook, etc.)

### 2. Supabase Redirect URL Not Whitelisted

**Symptoms:**
- Link redirects to error page
- "Invalid redirect URL" error
- Redirect fails silently

**Solution - Check Supabase Settings:**
1. Go to Supabase Dashboard
2. Navigate to Authentication → URL Configuration
3. Check "Redirect URLs" section
4. Ensure these URLs are whitelisted:
   ```
   https://your-domain.com/confirm-email
   http://localhost:5173/confirm-email (for development)
   ```

**How to Add:**
```
1. Supabase Dashboard → Project Settings → Authentication
2. Scroll to "Redirect URLs"
3. Add: https://your-production-domain.com/*
4. Add: http://localhost:5173/* (for dev)
5. Click "Save"
```

### 3. Email Link Format Issues

**Current Configuration:**
```typescript
// In TutorRegistration.tsx and LearnerRegistration.tsx
emailRedirectTo: `${window.location.origin}/confirm-email`
```

**Expected Link Format:**
```
https://[supabase-project].supabase.co/auth/v1/verify?token=[token]&type=signup&redirect_to=https://your-domain.com/confirm-email
```

**Check:**
- View email source/raw HTML
- Verify link structure is correct
- Ensure no line breaks in URL

### 4. Browser/Security Software Blocking

**Symptoms:**
- Link works on one device but not another
- Works in incognito mode but not regular mode
- Antivirus/firewall warnings

**Solutions:**
- Try different browser (Chrome, Firefox, Edge)
- Try incognito/private mode
- Temporarily disable browser extensions
- Check antivirus/firewall settings
- Whitelist your domain in security software

### 5. Email Client Rendering Issues

**Symptoms:**
- Link appears as plain text
- Button doesn't work but text link does (or vice versa)
- Link is cut off or wrapped incorrectly

**Solutions:**
- Try the plain text link below the button
- Copy the full URL manually
- View email in web browser instead of email client
- Try "View Original" or "Show Original" in email client

### 6. Token Expiration

**Symptoms:**
- Link worked before but doesn't work now
- "Token expired" error
- Redirect to error page

**Solution:**
- Confirmation links expire after 24 hours (Supabase default)
- User needs to request a new confirmation email
- Implement "Resend Confirmation Email" feature

### 7. CORS or Domain Issues

**Symptoms:**
- Link opens but shows blank page
- Console errors about CORS
- Redirect fails

**Check:**
- Ensure domain is properly configured in Supabase
- Check browser console for errors (F12)
- Verify SSL certificate is valid

## Testing Checklist

### For Developers:
1. ✅ Check Supabase redirect URLs are whitelisted
2. ✅ Test email confirmation in multiple browsers
3. ✅ Test in incognito mode
4. ✅ Check browser console for errors
5. ✅ Verify email HTML source
6. ✅ Test with different email providers
7. ✅ Check Supabase Auth logs

### For Users:
1. ✅ Check spam/junk folder
2. ✅ Try copying link and pasting in browser
3. ✅ Try different browser
4. ✅ Try incognito/private mode
5. ✅ Disable browser extensions temporarily
6. ✅ Check if link is expired (>24 hours old)
7. ✅ Request new confirmation email

## Quick Fixes

### Fix 1: Resend Confirmation Email
```typescript
// Add this function to allow users to resend confirmation
const resendConfirmation = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  });
  
  if (error) {
    toast.error("Failed to resend confirmation email");
  } else {
    toast.success("Confirmation email sent! Check your inbox.");
  }
};
```

### Fix 2: Manual Email Verification (Admin Only)
```sql
-- Run in Supabase SQL Editor to manually confirm a user
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

### Fix 3: Check Redirect URL Configuration
```bash
# In Supabase Dashboard, ensure these are added:
Production: https://your-domain.com/*
Development: http://localhost:5173/*
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid redirect URL" | URL not whitelisted | Add to Supabase redirect URLs |
| "Token expired" | Link older than 24h | Resend confirmation email |
| "Email already confirmed" | Already verified | User can log in directly |
| Blank page | CORS/domain issue | Check browser console |
| Link disabled | Email in spam | Move to inbox, try again |

## Monitoring & Logs

### Check Supabase Auth Logs:
1. Supabase Dashboard → Authentication → Logs
2. Look for confirmation attempts
3. Check for error messages

### Check Browser Console:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors when clicking link
4. Check Network tab for failed requests

## Prevention

### Best Practices:
1. ✅ Always whitelist redirect URLs in Supabase
2. ✅ Use HTTPS in production
3. ✅ Test email confirmation flow regularly
4. ✅ Provide clear instructions in confirmation email
5. ✅ Add "Resend Email" option on confirmation page
6. ✅ Show helpful error messages
7. ✅ Monitor Supabase Auth logs

### Email Template Improvements:
- Include both button and plain text link
- Add troubleshooting instructions
- Mention spam folder
- Include support contact
- Add link expiration notice

## Current Implementation

### Registration Flow:
```
1. User fills registration form
2. Supabase sends confirmation email
3. Email contains link: [supabase-url]/auth/v1/verify?token=...&redirect_to=[your-domain]/confirm-email
4. User clicks link
5. Supabase verifies token
6. Redirects to /confirm-email
7. Triggers fire to assign role
8. User redirected to dashboard
```

### Files Involved:
- `src/pages/TutorRegistration.tsx` - Sets emailRedirectTo
- `src/pages/LearnerRegistration.tsx` - Sets emailRedirectTo
- `src/pages/ConfirmEmail.tsx` - Handles confirmation
- `supabase/functions/send-confirmation-email/index.ts` - Custom email (if used)

## Need Help?

If issue persists:
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Review Supabase Auth logs
3. Test with a different email address
4. Contact Supabase support if needed
5. Consider implementing manual verification option for admins
