# Fix Registration "Hook requires authorization token" Error

## Problem
Registration fails with error: "Hook requires authorization token"

This happens because:
1. An auth hook is configured in Supabase dashboard
2. The hook is not properly set up with authorization
3. The edge function requires configuration that's missing

## Solution: Disable Auth Hook and Use Built-in Email Confirmation

### Step 1: Disable the Auth Hook in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
2. Find the "Send confirmation email" hook
3. Click on it and **DELETE** or **DISABLE** it
4. Save changes

### Step 2: Enable Built-in Email Confirmation

1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
2. Scroll to "Email" provider settings
3. Make sure these are enabled:
   - ✅ Enable email provider
   - ✅ Confirm email
4. Set the email template if needed (optional - Supabase has a default)

### Step 3: Configure Email Templates (Optional)

If you want custom emails:

1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/templates
2. Edit the "Confirm signup" template
3. Use this template:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

### Step 4: Test Registration

1. Go to http://localhost:8080
2. Try registering a new user
3. Check your email for the confirmation link
4. Click the link to confirm

## Why This Works

- Supabase has built-in email confirmation that works out of the box
- No need for custom edge functions or auth hooks
- More reliable and easier to maintain
- The registration code already uses `emailRedirectTo` which works with built-in confirmation

## What We Removed

- Custom send-confirmation-email edge function (no longer needed)
- Auth hook configuration (causing the error)
- Hook secret environment variable (no longer needed)

## Current Registration Flow

1. User fills registration form
2. `supabase.auth.signUp()` is called with user data
3. Supabase sends built-in confirmation email
4. User clicks link in email
5. User is redirected to `/confirm-email` page
6. Profile and role-specific data are created via database triggers

## If You Still Want Custom Emails

If you need custom branded emails, use a different approach:

1. Use Supabase's email templates (simpler)
2. Or use a third-party email service like SendGrid/Mailgun with database triggers
3. Or properly configure the auth hook with JWT secrets (more complex)

## Quick Test

After disabling the hook, try this:

```bash
# In browser console on registration page
supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123!@#',
  options: {
    data: { full_name: 'Test User' }
  }
})
```

Should work without errors!
