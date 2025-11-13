# Auth Hooks Configuration Check

## What Are Auth Hooks?

Supabase Auth Hooks let you intercept authentication events and send them to your edge functions. You need to configure these in your Supabase Dashboard.

## Your Edge Functions

You have 3 separate edge functions:

1. **send-confirmation-email** ✅ Deployed
   - Handles: Email confirmation
   - Uses: Webhook verification
   - Hook type: `send_email` (signup)

2. **send-notification-email** ✅ Deployed
   - Handles: General notifications
   - Uses: Direct API calls (not a hook)
   - Called from: Your app code

3. **send-password-reset** ⚠️ Not deployed
   - Handles: Password reset emails
   - Uses: Webhook verification
   - Hook type: `send_email` (recovery)

## How to Check/Configure Auth Hooks

### Option 1: Check in Dashboard

1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
2. Look for "Email Hooks" or "Auth Hooks"
3. You should see configurations for:
   - **Send Email Hook** (for confirmations and password resets)

### Option 2: Check via SQL

Run this in SQL Editor:

```sql
-- Check auth hook configuration
SELECT * FROM auth.hooks;
```

## Typical Setup

For your use case, you likely need **ONE** auth hook that handles BOTH:
- Email confirmations (signup)
- Password resets (recovery)

### If Using One Hook for Both:

You can configure ONE edge function to handle both by checking the `email_action_type`:

```typescript
// In your edge function
if (email_action_type === 'signup') {
  // Send confirmation email
} else if (email_action_type === 'recovery') {
  // Send password reset email
}
```

### If Using Separate Hooks:

Configure two separate hooks in Dashboard:
- Hook 1: Points to `send-confirmation-email` for signup
- Hook 2: Points to `send-password-reset` for recovery

## Current Status

Based on your functions:
- ✅ `send-confirmation-email` is deployed and likely configured
- ✅ `send-notification-email` is deployed (doesn't need a hook)
- ❓ `send-password-reset` - Not deployed, but might not be needed if you're handling both in one function

## Recommendation

**Check your auth hooks configuration:**

1. Go to Dashboard → Authentication → Hooks
2. See what's configured
3. If you see ONE hook handling both signup and recovery, you DON'T need to deploy `send-password-reset`
4. If you see separate hooks, you SHOULD deploy `send-password-reset`

## Test Password Reset

To verify it's working:

1. Go to your app
2. Click "Forgot Password"
3. Enter your email
4. Check if you receive the reset email
5. If yes → Everything is working!
6. If no → Check Dashboard → Logs → Edge Functions

---

**Want me to help you check the auth hooks configuration?** Let me know what you see in the dashboard!
