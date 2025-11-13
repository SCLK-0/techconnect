# 🚨 QUICK FIX: Registration Error

## The Error
```
Registration failed
Hook requires authorization token
```

## The Fix (2 minutes)

### Option 1: Run the Script
```powershell
.\disable-auth-hook.ps1
```
Then follow the instructions.

### Option 2: Manual Fix

1. **Open this URL:**
   https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

2. **Delete the hook:**
   - Find "Send confirmation email" hook
   - Click delete/disable
   - Confirm

3. **Enable built-in emails:**
   https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers
   - Make sure "Confirm email" is checked ✅

4. **Test:**
   - Go to http://localhost:8080
   - Try registering
   - Should work! ✅

## Why This Works

The custom auth hook wasn't properly configured. Supabase's built-in email confirmation works perfectly without any setup.

## What Changed

- ❌ Custom edge function (removed)
- ❌ Auth hook (disabled)
- ✅ Built-in Supabase emails (enabled)

## Result

Registration now works reliably with zero configuration!
