# 🔍 Troubleshooting: No Email Received

## Possible Causes

### 1. Hook Not Configured Yet
**Most likely cause!**

Did you add the hook in the Supabase dashboard?

**Check:**
1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks
2. Do you see a hook listed called "Send Email"?
3. Does it show both events: "Validate Email" and "Password Recovery"?

**If NO hook is listed:**
- You need to add it! See VISUAL-SINGLE-HOOK-GUIDE.md
- The function is deployed but the hook isn't configured yet

### 2. Email Provider Not Configured
**Check:**
1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
2. Find "Email" section
3. Is "Confirm email" UNCHECKED?
4. Is "Enable email provider" CHECKED?

**If "Confirm email" is checked:**
- Supabase is using built-in emails (not our custom ones)
- Uncheck it and save

### 3. Check Resend Dashboard
**I just opened it for you:**
https://resend.com/emails

**Look for:**
- Any emails sent in the last few minutes?
- Any failed sends?
- Any errors?

### 4. Check Function Logs in Supabase Dashboard
**Go to:**
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/functions

**Click on "send-email" function**
**Check the logs tab**

Look for:
- Was the function called?
- Any errors?
- What does it say?

---

## Quick Checks

### ✅ Checklist

- [ ] Hook is configured in Auth Hooks dashboard
- [ ] Hook has BOTH events selected (Validate Email + Password Recovery)
- [ ] Hook URL is: `https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-email`
- [ ] Email provider has "Confirm email" UNCHECKED
- [ ] Email provider has "Enable email provider" CHECKED
- [ ] Resend API key is valid (check https://resend.com/api-keys)
- [ ] Function is deployed (check `supabase functions list`)

---

## Step-by-Step Debug

### Step 1: Verify Hook Exists
```
Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

Should see:
┌─────────────────────────────────────────┐
│ Send Email                              │
│ Type: Send Email                        │
│ Events: Validate Email, Password...     │
│ URL: .../send-email                     │
└─────────────────────────────────────────┘
```

**If you DON'T see this:**
→ The hook isn't configured yet!
→ Follow VISUAL-SINGLE-HOOK-GUIDE.md to add it

### Step 2: Verify Email Provider Settings
```
Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers

Should see:
☑ Enable email provider
☐ Confirm email          ← MUST BE UNCHECKED!
☑ Enable email signup
```

**If "Confirm email" is checked:**
→ Uncheck it and save
→ This tells Supabase to use our custom hook

### Step 3: Check Resend Dashboard
```
Go to: https://resend.com/emails

Look for:
- Recent emails sent
- Any with status "Delivered" or "Failed"
- Any error messages
```

**If no emails show up:**
→ The function wasn't called
→ Hook probably not configured

### Step 4: Check Function Logs
```
Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/functions
Click: send-email
Tab: Logs

Look for:
- "Received email request"
- "Confirmation email sent successfully"
- Any errors
```

**If no logs:**
→ Function wasn't called
→ Hook not configured or not working

### Step 5: Verify Function is Deployed
```powershell
supabase functions list
```

Should show:
```
send-email | ACTIVE
```

**If not listed or not ACTIVE:**
→ Redeploy: `supabase functions deploy send-email --no-verify-jwt`

---

## Common Issues

### Issue: "Hook requires authorization token"
**Solution:**
- Make sure HTTP Headers is EMPTY in hook config
- Don't add any authorization headers

### Issue: Emails going to spam
**Solution:**
- Check spam/junk folder
- Emails from "onboarding@resend.dev" might be filtered

### Issue: Hook not triggering
**Solution:**
- Make sure "Confirm email" is UNCHECKED in email provider
- Make sure hook has correct events selected
- Try deleting and recreating the hook

### Issue: Resend API key invalid
**Solution:**
- Check: https://resend.com/api-keys
- Make sure key is active
- Redeploy function if you changed the key

---

## Test Again

After fixing issues:

1. Go to http://localhost:8080
2. Register with a NEW email (not one you already tried)
3. Check email inbox (and spam folder)
4. Check Resend dashboard
5. Check function logs

---

## Still Not Working?

### Check These URLs:

**Auth Hooks:**
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

**Email Provider:**
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers

**Functions:**
https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/functions

**Resend Emails:**
https://resend.com/emails

**Resend API Keys:**
https://resend.com/api-keys

---

## Most Likely Issue

**90% of the time it's because:**
→ The hook isn't configured in the dashboard yet

**Solution:**
→ Follow VISUAL-SINGLE-HOOK-GUIDE.md to add the hook

---

## Need Help?

Tell me:
1. Did you add the hook in the dashboard? (yes/no)
2. What do you see in the Auth Hooks page?
3. What do you see in Resend dashboard?
4. Any errors in browser console?

I'll help you fix it! 🔧
