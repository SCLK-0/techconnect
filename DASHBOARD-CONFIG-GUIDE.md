# 📊 Dashboard Configuration Visual Guide

## Auth Hooks Configuration

### URL to Open
```
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
```

---

## Hook 1: Email Confirmation

### Click "Add Hook" or "Enable Hooks"

### Fill in the form:

```
┌─────────────────────────────────────────────────────────┐
│ Add Auth Hook                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Hook Name *                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Send confirmation email                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Hook Type *                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Send Email                          ▼               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Event *                                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Validate Email (or Signup)          ▼               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Function URL *                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ https://frozkocrdudvtqhhgqzl.supabase.co/          │ │
│ │ functions/v1/send-confirmation-email                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ HTTP Method *                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ POST                                ▼               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ HTTP Headers (optional)                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │ (leave empty - no headers needed)                   │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                                         │
│                    [Cancel]  [Create]                   │
└─────────────────────────────────────────────────────────┘
```

### Click "Create"

---

## Hook 2: Password Reset

### Click "Add Hook" again

### Fill in the form:

```
┌─────────────────────────────────────────────────────────┐
│ Add Auth Hook                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Hook Name *                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Send password reset                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Hook Type *                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Send Email                          ▼               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Event *                                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Password Recovery                   ▼               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Function URL *                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ https://frozkocrdudvtqhhgqzl.supabase.co/          │ │
│ │ functions/v1/send-password-reset                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ HTTP Method *                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ POST                                ▼               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ HTTP Headers (optional)                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │ (leave empty - no headers needed)                   │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                                         │
│                    [Cancel]  [Create]                   │
└─────────────────────────────────────────────────────────┘
```

### Click "Create"

---

## Verify Hooks Are Created

### You should see:

```
┌─────────────────────────────────────────────────────────┐
│ Auth Hooks                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Send confirmation email                             │ │
│ │ Type: Send Email                                    │ │
│ │ Event: Validate Email                               │ │
│ │ URL: .../send-confirmation-email                    │ │
│ │                                          [Edit] [...] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Send password reset                                 │ │
│ │ Type: Send Email                                    │ │
│ │ Event: Password Recovery                            │ │
│ │ URL: .../send-password-reset                        │ │
│ │                                          [Edit] [...] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Email Provider Configuration

### URL to Open
```
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
```

### Find "Email" Section

```
┌─────────────────────────────────────────────────────────┐
│ Email                                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ☑ Enable email provider                                │
│                                                         │
│ ☐ Confirm email                                         │
│   (Uncheck this - we use custom hook)                   │
│                                                         │
│ ☑ Enable email signup                                   │
│                                                         │
│ ☐ Secure email change                                   │
│                                                         │
│                                                         │
│                                        [Save]           │
└─────────────────────────────────────────────────────────┘
```

### Important Settings:
- ✅ **Enable email provider** - CHECKED
- ❌ **Confirm email** - UNCHECKED (we use custom hook)
- ✅ **Enable email signup** - CHECKED

### Click "Save"

---

## Copy-Paste Values

### For Hook 1 (Email Confirmation):

**Hook Name:**
```
Send confirmation email
```

**Function URL:**
```
https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email
```

### For Hook 2 (Password Reset):

**Hook Name:**
```
Send password reset
```

**Function URL:**
```
https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-password-reset
```

---

## Common Mistakes to Avoid

### ❌ DON'T:
- Add authorization headers
- Add API keys in headers
- Use webhook secrets
- Enable "Confirm email" in providers (conflicts with hook)
- Use wrong event types

### ✅ DO:
- Leave HTTP Headers empty
- Use exact URLs provided
- Select correct event types
- Disable built-in confirm email
- Test after setup

---

## Verification Steps

After configuration:

1. **Check hooks are listed**
   - Go to auth hooks page
   - See both hooks listed
   - Both should be enabled

2. **Check email provider settings**
   - Go to providers page
   - "Confirm email" should be unchecked
   - "Enable email provider" should be checked

3. **Test registration**
   - Register new user
   - Should receive email
   - No errors

4. **Test password reset**
   - Request password reset
   - Should receive email
   - No errors

---

## Quick Links

- **Auth Hooks:** https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
- **Email Provider:** https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
- **Function Logs:** https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/functions

---

## Need Help?

If the dashboard looks different:
1. Make sure you're on the correct project
2. Check you have admin access
3. Try refreshing the page
4. Check Supabase status page

If hooks don't work:
1. Check function logs
2. Verify URLs are correct
3. Make sure functions are deployed
4. Check Resend dashboard for errors
