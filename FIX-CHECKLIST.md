# ✅ Registration Fix Checklist

Print this or keep it open while you work!

---

## 🎯 Goal
Fix the "Hook requires authorization token" error

## 📋 Checklist

### Part 1: Disable Auth Hook
- [ ] Open https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
- [ ] Find "Send confirmation email" hook (if it exists)
- [ ] Click the three dots (...) menu
- [ ] Click "Delete" or "Disable"
- [ ] Confirm the deletion
- [ ] Verify no hooks are listed

### Part 2: Enable Built-in Emails
- [ ] Open https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
- [ ] Find "Email" section
- [ ] Check ✅ "Enable email provider"
- [ ] Check ✅ "Confirm email"
- [ ] Click "Save"

### Part 3: Test
- [ ] Open http://localhost:8080
- [ ] Click "Register"
- [ ] Choose "Learner" or "Tutor"
- [ ] Fill in the form with test data
- [ ] Click "Create Account"
- [ ] See success message (not error!)
- [ ] Check email inbox
- [ ] Find confirmation email from Supabase
- [ ] Click confirmation link in email
- [ ] Redirected to app successfully
- [ ] Try logging in with new account

## ✨ Success Criteria

You know it's working when:
1. ✅ No "Hook requires authorization token" error
2. ✅ See "Registration successful! Please check your email"
3. ✅ Receive confirmation email
4. ✅ Can confirm email and login

## 🚨 If Something Goes Wrong

### Still getting hook error?
- Make sure you deleted ALL hooks
- Refresh the page and try again
- Clear browser cache

### Not receiving emails?
- Check spam folder
- Wait 2-3 minutes
- Verify email provider is enabled
- Check Supabase logs

### Can't find the hooks page?
- Make sure you're logged into Supabase
- Make sure you're on the right project
- Use the direct links above

## 🎉 When Complete

Mark the date and time you fixed it:

**Fixed on:** _________________ at _________________

**Tested by:** _________________

**Status:** ⭐ WORKING!

---

## Quick Links

- Auth Hooks: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
- Email Provider: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
- Your App: http://localhost:8080

## Helper Script

If you prefer automation:
```powershell
.\disable-auth-hook.ps1
```

---

**Time to complete:** ~2 minutes
**Difficulty:** Easy ⭐
**Impact:** High 🚀
