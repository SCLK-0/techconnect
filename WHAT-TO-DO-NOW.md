# 🎯 What to Do Now - Simple Guide

## I Just Opened Your Browser

You should see the Supabase Auth Hooks page.

If not, click here: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

---

## Step 1: Add First Hook (2 minutes)

### Look for a button that says:
- "Add Hook" or
- "Enable Hooks" or
- "Create Hook"

### Click it!

### You'll see a form. Fill it in like this:

```
┌─────────────────────────────────────────┐
│ Hook Name:                              │
│ Send confirmation email                 │ ← Type this
├─────────────────────────────────────────┤
│ Hook Type:                              │
│ Send Email                    ▼         │ ← Select this
├─────────────────────────────────────────┤
│ Event:                                  │
│ Validate Email                ▼         │ ← Select this
├─────────────────────────────────────────┤
│ Function URL:                           │
│ https://frozkocrdudvtqhhgqzl.supabase. │
│ co/functions/v1/send-confirmation-email │ ← Copy/paste this
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

### Copy this URL for Function URL:
```
https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email
```

---

## Step 2: Add Second Hook (2 minutes)

### Click "Add Hook" again

### Fill in the form:

```
┌─────────────────────────────────────────┐
│ Hook Name:                              │
│ Send password reset                     │ ← Type this
├─────────────────────────────────────────┤
│ Hook Type:                              │
│ Send Email                    ▼         │ ← Select this
├─────────────────────────────────────────┤
│ Event:                                  │
│ Password Recovery             ▼         │ ← Select this
├─────────────────────────────────────────┤
│ Function URL:                           │
│ https://frozkocrdudvtqhhgqzl.supabase. │
│ co/functions/v1/send-password-reset     │ ← Copy/paste this
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

### Copy this URL for Function URL:
```
https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-password-reset
```

---

## Step 3: Configure Email Provider (1 minute)

### Open this page:
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers

### Find the "Email" section

### Make sure it looks like this:

```
┌─────────────────────────────────────────┐
│ Email                                   │
├─────────────────────────────────────────┤
│ ☑ Enable email provider     ← CHECKED  │
│                                         │
│ ☐ Confirm email             ← UNCHECKED│
│   (Important: uncheck this!)            │
│                                         │
│ ☑ Enable email signup       ← CHECKED  │
└─────────────────────────────────────────┘

[Save] ← Click Save
```

**Important:** Make sure "Confirm email" is UNCHECKED!

---

## Step 4: Test It! (1 minute)

### Go to your app:
http://localhost:8080

### Try registering:
1. Click "Register"
2. Choose "Learner" or "Tutor"
3. Fill in the form
4. Use your real email
5. Click "Create Account"

### Check your email:
- You should receive a professional email
- Subject: "Confirm Your Email - TechConnect"
- Click the confirmation link
- You'll be redirected back to the app

### Success! 🎉

---

## Troubleshooting

### "I don't see the Add Hook button"
- Make sure you're logged into Supabase
- Make sure you're on the correct project
- Try refreshing the page

### "I can't find the Event dropdown"
- Look for "Validate Email" or "Signup" - either works
- For password reset, look for "Password Recovery"

### "Emails not arriving"
- Check spam folder
- Wait 1-2 minutes
- Check function logs: `supabase functions logs send-confirmation-email`
- Check Resend dashboard: https://resend.com/emails

### "Hook requires authorization token" error
- Make sure HTTP Headers is EMPTY
- Don't add any authorization headers
- If you see this, delete the hook and recreate it

---

## Quick Commands

### Check if it's working:
```powershell
supabase functions logs send-confirmation-email
```

### Open Resend dashboard:
```powershell
Start-Process "https://resend.com/emails"
```

---

## That's It!

Just follow these 4 steps and you're done!

**Total time:** ~5 minutes
**Difficulty:** Super easy! 😊

---

## Need More Help?

- **Visual guide:** DASHBOARD-CONFIG-GUIDE.md
- **Complete guide:** SETUP-RESEND-EMAILS.md
- **Checklist:** FINAL-SETUP-CHECKLIST.md

---

**Ready? Let's do this! 🚀**

Start with Step 1 above!
