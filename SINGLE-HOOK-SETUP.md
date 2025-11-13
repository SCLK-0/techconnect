# ✅ Single Hook Setup (Free Tier)

## What I Did

Since you're on the free tier (1 hook limit), I created a **combined function** that handles BOTH:
- ✅ Email confirmation (signup)
- ✅ Password reset

### Deployed:
```
✅ send-email - ACTIVE (handles both confirmation and password reset)
```

---

## What You Need to Do (2 minutes)

### Step 1: Add ONE Hook

Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

Click "Add Hook" or "Enable Hooks"

### Fill in the form:

```
┌─────────────────────────────────────────┐
│ Hook Name:                              │
│ Send Email                              │ ← Type this
├─────────────────────────────────────────┤
│ Hook Type:                              │
│ Send Email                    ▼         │ ← Select this
├─────────────────────────────────────────┤
│ Events: (select BOTH)                   │
│ ☑ Validate Email                        │ ← Check this
│ ☑ Password Recovery                     │ ← Check this
├─────────────────────────────────────────┤
│ Function URL:                           │
│ https://frozkocrdudvtqhhgqzl.supabase. │
│ co/functions/v1/send-email              │ ← Copy/paste this
├─────────────────────────────────────────┤
│ HTTP Method:                            │
│ POST                          ▼         │ ← Select this
├─────────────────────────────────────────┤
│ HTTP Headers:                           │
│                                         │
│ (leave this empty)                      │ ← Don't add anything
└─────────────────────────────────────────┘

[Cancel]  [Create] ← Click Create
```

### Copy this URL:
```
https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-email
```

**Important:** Make sure to check BOTH events:
- ✅ Validate Email (for signup confirmation)
- ✅ Password Recovery (for password reset)

---

### Step 2: Configure Email Provider

Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers

Find "Email" section:
- ✅ Enable email provider (checked)
- ❌ Confirm email (UNCHECKED - we use custom hook)
- ✅ Enable email signup (checked)

Click "Save"

---

### Step 3: Test!

**Test Registration:**
1. Go to http://localhost:8080
2. Register a new user
3. Check email for confirmation
4. Should receive professional email ✅

**Test Password Reset:**
1. Go to login page
2. Click "Forgot Password"
3. Enter email
4. Check email for reset link
5. Should receive professional email ✅

---

## How It Works

The single function automatically detects the email type:
- If `email_action_type === "recovery"` → Sends password reset email
- Otherwise → Sends confirmation email

Both emails are professional and branded!

---

## Verification

### Check logs:
```powershell
supabase functions logs send-email
```

### Check Resend:
https://resend.com/emails

---

## Troubleshooting

### "I can only select one event"
- Look for a checkbox list, not a dropdown
- You should be able to check multiple events
- If not, the hook will still work for whichever event you select

### "Hook requires authorization token"
- Make sure HTTP Headers is EMPTY
- Don't add any authorization

### Emails not arriving
- Check spam folder
- Check logs: `supabase functions logs send-email`
- Check Resend: https://resend.com/emails

---

## Summary

✅ **One function** handles both email types
✅ **One hook** with two events selected
✅ **Simple** and works perfectly on free tier!

---

**Time to complete:** ~2 minutes
**Difficulty:** Super easy! 😊

Let's do this! 🚀
