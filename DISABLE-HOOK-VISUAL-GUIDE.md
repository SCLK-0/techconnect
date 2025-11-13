# 🎯 Visual Guide: Disable Auth Hook

## Step-by-Step with Screenshots Guide

### Step 1: Open Auth Hooks Page
```
URL: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
```

**What you'll see:**
- A list of hooks (if any are configured)
- A hook named something like "Send confirmation email" or "send-confirmation-email"

### Step 2: Delete the Hook

**Look for:**
```
┌─────────────────────────────────────────┐
│ Send confirmation email                 │
│ Type: Send Email                        │
│ URL: .../send-confirmation-email        │
│                                  [...]  │ ← Click this
└─────────────────────────────────────────┘
```

**Click the three dots (...) and select:**
- "Delete" or "Remove" or "Disable"

**Confirm the deletion**

### Step 3: Verify No Hooks Remain

**You should see:**
```
┌─────────────────────────────────────────┐
│  No hooks configured                    │
│                                         │
│  Auth hooks allow you to customize     │
│  authentication flows...                │
└─────────────────────────────────────────┘
```

### Step 4: Enable Built-in Email Confirmation

```
URL: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
```

**Find the Email section:**
```
┌─────────────────────────────────────────┐
│ Email                                   │
│                                         │
│ ☑ Enable email provider                │
│ ☑ Confirm email          ← Make sure   │
│ ☐ Secure email change                  │
│                                         │
│ [Save]                                  │
└─────────────────────────────────────────┘
```

**Make sure these are checked:**
- ✅ Enable email provider
- ✅ Confirm email

**Click Save**

### Step 5: Test Registration

**Open your app:**
```
http://localhost:8080
```

**Try registering:**
1. Click "Register"
2. Choose "Learner" or "Tutor"
3. Fill in the form
4. Click "Create Account"

**Expected result:**
```
✅ Registration successful!
   Please check your email to confirm your account.
```

**Check your email:**
- You should receive an email from Supabase
- Subject: "Confirm your signup"
- Click the confirmation link
- You'll be redirected to your app

### Step 6: Verify It Works

**After clicking the email link:**
```
✅ Email confirmed!
✅ Profile created
✅ Can now login
```

## Troubleshooting

### If you don't see any hooks:
- Great! Nothing to delete
- Just make sure email confirmation is enabled (Step 4)

### If you can't find the hooks page:
- Make sure you're logged into Supabase dashboard
- Make sure you're on the correct project
- Try this direct link: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

### If email confirmation is already enabled:
- Perfect! You're all set
- Just test registration

### If you don't receive confirmation email:
- Check spam folder
- Wait a few minutes (can take 1-2 minutes)
- Check Supabase logs for errors
- Make sure email provider is enabled

## Quick Commands

**Open hooks page:**
```powershell
Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks"
```

**Open providers page:**
```powershell
Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers"
```

**Or run the helper script:**
```powershell
.\disable-auth-hook.ps1
```

## Done! 🎉

Once you've completed these steps, registration will work perfectly!
