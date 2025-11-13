# 🧪 Complete Testing Guide

Your app is now running on: **http://localhost:8080/**

---

## 🎯 Quick Test Checklist

### Phase 1: Basic Connectivity (5 minutes)
- [ ] App loads without errors
- [ ] No console errors (F12 → Console)
- [ ] Supabase connection working

### Phase 2: Authentication (10 minutes)
- [ ] User registration (Learner)
- [ ] Email confirmation
- [ ] Login/Logout
- [ ] Password reset
- [ ] User registration (Tutor)

### Phase 3: Core Features (15 minutes)
- [ ] Profile updates
- [ ] Avatar upload
- [ ] Session creation
- [ ] Notifications
- [ ] File uploads

### Phase 4: Admin Features (5 minutes)
- [ ] Admin dashboard access
- [ ] Tutor approval
- [ ] Resource approval

---

## 📝 Detailed Testing Steps

### 1. Basic Connectivity Test

**Open the app:**
```
http://localhost:8080/
```

**Check browser console (F12):**
- ✅ Should see no red errors
- ✅ Should connect to: `https://frozkocrdudvtqhhgqzl.supabase.co`

**What to look for:**
- App loads and displays homepage
- No "Failed to fetch" errors
- No authentication errors

---

### 2. Test Learner Registration

**Steps:**
1. Click "Sign Up" or "Get Started"
2. Choose "Learner" role
3. Fill in the form:
   - Full Name: `Test Learner`
   - Email: `testlearner@example.com` (use a real email you can access)
   - Password: `TestPass123!`
   - Registered Year: `2024`
   - Subjects of Interest: Select a few subjects
4. Click "Register" or "Sign Up"

**Expected Results:**
- ✅ Registration succeeds
- ✅ You receive a confirmation email
- ✅ Redirected to email confirmation page

**Check Email:**
- Open your email inbox
- Look for email from "TechConnect <onboarding@resend.dev>"
- Subject: "Confirm Your Email - TechConnect"
- Click the confirmation link

**After Confirmation:**
- ✅ Redirected back to app
- ✅ Automatically logged in
- ✅ See learner dashboard

---

### 3. Test Login/Logout

**Logout:**
1. Find logout button (usually in profile menu)
2. Click logout
3. ✅ Should be redirected to login page

**Login:**
1. Enter email: `testlearner@example.com`
2. Enter password: `TestPass123!`
3. Click "Login"
4. ✅ Should be logged in and see dashboard

---

### 4. Test Password Reset

**Steps:**
1. Logout if logged in
2. Go to login page
3. Click "Forgot Password?"
4. Enter email: `testlearner@example.com`
5. Click "Send Reset Link"

**Expected Results:**
- ✅ Success message appears
- ✅ Check your email for reset link
- ✅ Email subject: "Reset Your Password - TechConnect"
- ✅ Click the reset link
- ✅ Enter new password
- ✅ Can login with new password

**If email doesn't arrive:**
- Check Supabase Dashboard → Logs → Edge Functions
- Look for errors in `send-confirmation-email` function
- Verify RESEND_API_KEY is set correctly

---

### 5. Test Tutor Registration

**Steps:**
1. Logout (if logged in)
2. Click "Sign Up"
3. Choose "Tutor" role
4. Fill in the form:
   - Full Name: `Test Tutor`
   - Email: `testtutor@example.com` (different email)
   - Password: `TestPass123!`
   - Subject Expertise: Select subjects you can teach
   - Bio: Write a short bio
5. Click "Register"

**Expected Results:**
- ✅ Registration succeeds
- ✅ Receive confirmation email
- ✅ Confirm email
- ✅ See tutor dashboard
- ⚠️ Status: "Pending Approval" (needs admin approval)

---

### 6. Test Profile Updates

**As Learner or Tutor:**
1. Go to Profile or Settings
2. Update your bio
3. Change your name
4. Click "Save"

**Expected Results:**
- ✅ Changes saved successfully
- ✅ Success notification appears
- ✅ Refresh page - changes persist

---

### 7. Test Avatar Upload

**Steps:**
1. Go to Profile
2. Click on avatar or "Upload Avatar"
3. Select an image file (JPG, PNG)
4. Upload

**Expected Results:**
- ✅ Upload succeeds
- ✅ Avatar appears immediately
- ✅ Refresh page - avatar persists

**If upload fails:**
- Check browser console for errors
- Verify storage bucket "avatars" exists
- Check bucket is set to "public"
- Verify storage policies are set

---

### 8. Test Session Creation (As Learner)

**Steps:**
1. Login as learner
2. Go to "Find Tutors" or "Browse Tutors"
3. Select a tutor (you might need to approve your test tutor first as admin)
4. Click "Request Session"
5. Fill in:
   - Subject
   - Date/Time
   - Duration
   - Message
6. Submit request

**Expected Results:**
- ✅ Session request created
- ✅ Success notification
- ✅ Tutor receives notification
- ✅ Session appears in "My Sessions"

---

### 9. Test Notifications

**Check Notifications:**
1. Look for notification bell icon
2. Click it
3. Should see notifications for:
   - Session requests
   - Session status changes
   - Approvals (for tutors)

**Expected Results:**
- ✅ Notifications appear
- ✅ Can mark as read
- ✅ Real-time updates (if Realtime is enabled)

---

### 10. Test Admin Functions

**Login as Admin:**
- Email: `techconnect.mod@gmail.com`
- Password: (your admin password)

**If admin doesn't exist:**
1. Register with email: `techconnect.mod@gmail.com`
2. The system auto-assigns admin role

**Admin Tests:**

**A. Approve Tutor:**
1. Go to Admin Dashboard
2. Find "Pending Tutors"
3. Click on test tutor
4. Click "Approve"
5. ✅ Tutor status changes to "Approved"
6. ✅ Tutor receives notification

**B. Approve Resource:**
1. Have tutor upload a resource
2. As admin, go to "Pending Resources"
3. Review and approve
4. ✅ Resource becomes visible to all users

**C. Manage Donations:**
1. Go to "Donations" section
2. Review pending donations
3. Approve/Reject
4. ✅ Status updates

---

### 11. Test File Uploads (Resources)

**As Approved Tutor:**
1. Go to "My Resources"
2. Click "Upload Resource"
3. Fill in:
   - Title
   - Description
   - Select file (PDF, image, etc.)
4. Upload

**Expected Results:**
- ✅ Upload succeeds
- ✅ Resource status: "Pending"
- ✅ Admin receives notification
- ✅ After admin approval, visible to learners

---

### 12. Test Donations

**As Learner:**
1. Go to a tutor's profile
2. Click "Donate" or "Support"
3. Fill in:
   - Amount
   - GCash details
   - Upload proof of payment
4. Submit

**Expected Results:**
- ✅ Donation submitted
- ✅ Status: "Pending"
- ✅ Admin receives notification
- ✅ Proof of payment uploaded to storage

---

## 🔍 Troubleshooting

### App Won't Load
```bash
# Check if dev server is running
# Should see: http://localhost:8080/

# Check console for errors
# Press F12 → Console tab
```

### "Failed to fetch" Errors
- Check `.env` file has correct credentials
- Verify Supabase project is active
- Check browser console for specific error

### Authentication Errors
- Check Supabase Dashboard → Authentication → Settings
- Verify redirect URLs include `http://localhost:8080/**`
- Check email confirmation is disabled for testing

### Email Not Received
- Check spam folder
- Verify RESEND_API_KEY is set
- Check Supabase Dashboard → Logs → Edge Functions
- Look for errors in `send-confirmation-email`

### Upload Errors
- Verify storage buckets exist (avatars, resources, donation-proofs)
- Check buckets are set to "public"
- Verify storage policies are configured
- Check browser console for specific error

### Database Errors
- Check Supabase Dashboard → Logs → Database
- Verify RLS policies are enabled
- Check user has correct role assigned

---

## 📊 Verification Checklist

After testing, verify in Supabase Dashboard:

### Database Tables
```
Dashboard → Database → Table Editor
```
- [ ] profiles - Has test users
- [ ] user_roles - Roles assigned correctly
- [ ] tutor_profiles - Test tutor exists
- [ ] learner_profiles - Test learner exists
- [ ] sessions - Test session created
- [ ] notifications - Notifications generated

### Storage Buckets
```
Dashboard → Storage
```
- [ ] avatars - Has uploaded avatars
- [ ] resources - Has uploaded resources
- [ ] donation-proofs - Has uploaded proofs

### Edge Functions
```
Dashboard → Edge Functions → Logs
```
- [ ] send-confirmation-email - No errors
- [ ] send-notification-email - No errors
- [ ] Check for successful email sends

---

## 🎯 Success Criteria

Your migration is successful if:
- ✅ All authentication flows work
- ✅ Users can register and login
- ✅ Emails are received
- ✅ File uploads work
- ✅ Sessions can be created
- ✅ Notifications appear
- ✅ Admin functions work
- ✅ No console errors

---

## 📝 Test Results Template

Copy this and fill it out:

```
## Test Results - [Date]

### Basic Connectivity
- App loads: ✅ / ❌
- Console errors: ✅ / ❌
- Supabase connected: ✅ / ❌

### Authentication
- Learner registration: ✅ / ❌
- Email confirmation: ✅ / ❌
- Login/Logout: ✅ / ❌
- Password reset: ✅ / ❌
- Tutor registration: ✅ / ❌

### Core Features
- Profile updates: ✅ / ❌
- Avatar upload: ✅ / ❌
- Session creation: ✅ / ❌
- Notifications: ✅ / ❌
- Resource upload: ✅ / ❌
- Donations: ✅ / ❌

### Admin Features
- Admin access: ✅ / ❌
- Tutor approval: ✅ / ❌
- Resource approval: ✅ / ❌

### Issues Found
1. [Describe any issues]
2. [Describe any issues]

### Notes
[Any additional observations]
```

---

## 🆘 Need Help?

If you encounter issues:

1. **Check browser console** (F12 → Console)
2. **Check Supabase logs** (Dashboard → Logs)
3. **Check edge function logs** (Dashboard → Edge Functions → Logs)
4. **Check database logs** (Dashboard → Logs → Database)

Common log locations:
- Authentication errors: Dashboard → Logs → Auth
- Database errors: Dashboard → Logs → Database
- Function errors: Dashboard → Edge Functions → [function name] → Logs

---

**Ready to test?** Open http://localhost:8080/ and start with Phase 1! 🚀
