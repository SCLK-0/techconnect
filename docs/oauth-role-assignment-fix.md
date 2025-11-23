# OAuth Role Assignment Issue & Fix

## Problem Description

Some users were getting "none" role and could access the confirm-email page without proper context.

### Root Causes

1. **OAuth Users Without Metadata**
   - Users signing in via OAuth (Google, etc.) bypass the registration forms
   - They don't have the required metadata (`is_tutor`, `subject_expertise`, `subjects_of_interest`)
   - Database triggers check for this metadata before assigning roles
   - Result: OAuth users end up with NO role assigned

2. **Weak Confirm-Email Access Control**
   - The confirm-email page allowed access if user had ANY session
   - This meant OAuth users without roles could access it
   - No proper redirect for users without roles

### How It Happened

**Normal Registration Flow:**
```
User → Registration Form → Metadata Stored → Email Confirmation → Trigger Assigns Role ✅
```

**OAuth Flow (Broken):**
```
User → OAuth Sign-In → No Metadata → Email Auto-Confirmed → No Role Assigned ❌
```

## Solution Implemented

### 1. Enhanced Role Check in ConfirmEmail.tsx

**Before:**
- Redirected users without roles to `/login`
- No clear messaging about missing profile

**After:**
- Detects OAuth users without roles
- Shows toast: "Complete Your Profile"
- Redirects to `/role-selection` to complete registration
- Provides clear path for OAuth users to get assigned a role

### 2. Stricter Access Control

**Before:**
```typescript
if (!hasTokenParams && !cameFromRegistration && !currentSession) {
  // Block access
}
```

**After:**
```typescript
const hasConfirmedEmail = currentUser?.email_confirmed_at || currentUser?.confirmed_at;

if (!hasTokenParams && !cameFromRegistration && !(currentSession && hasConfirmedEmail)) {
  // Block access - requires confirmed email
}
```

Now blocks users who:
- Don't have token params (email link)
- Didn't come from registration
- Don't have a confirmed email session

## Testing Scenarios

### Scenario 1: OAuth User (No Role)
1. User signs in with Google
2. Email auto-confirmed
3. No role assigned (no metadata)
4. Redirected to `/role-selection`
5. User completes registration
6. Role assigned ✅

### Scenario 2: Email Registration (Normal)
1. User fills registration form
2. Metadata stored
3. Email confirmation link clicked
4. Trigger assigns role
5. Redirected to dashboard ✅

### Scenario 3: Direct Access Attempt
1. User tries to access `/confirm-email` directly
2. No token params, no registration state, no confirmed session
3. Blocked and redirected to home ✅

## Database Triggers

The role assignment happens in these triggers:

### Tutor Role Assignment
```sql
-- File: 20251117_add_registered_year_to_tutor_creation.sql
-- Checks for: is_tutor, subject_expertise, bio metadata
-- Assigns: 'tutor' role
```

### Learner Role Assignment
```sql
-- File: 20251112074156_f3991b07-537c-4e23-b0ac-b42d18be7129.sql
-- Checks for: registered_year, subjects_of_interest metadata
-- Assigns: 'learner' role
```

### Admin Role Assignment
```sql
-- File: 20251106233850_25db72df-ae78-4209-b24a-50814ca4fc75.sql
-- Checks for: specific admin email
-- Assigns: 'admin' role
```

## Recommendations

### Short Term (Implemented)
- ✅ Redirect OAuth users without roles to role-selection
- ✅ Strengthen confirm-email access control
- ✅ Add clear messaging for incomplete profiles

### Long Term (Future Improvements)

1. **Disable OAuth for Regular Users**
   - Only allow email/password registration for tutors/learners
   - Keep OAuth only for admin login
   - Ensures all users go through proper registration flow

2. **Create OAuth Profile Completion Flow**
   - Detect OAuth users on first sign-in
   - Show modal/page to complete profile
   - Collect required metadata
   - Assign role after completion

3. **Add Role Assignment API**
   - Create edge function to assign roles
   - Call from frontend after OAuth sign-in
   - Bypass trigger limitations

4. **Improve Error Handling**
   - Show specific error messages for missing roles
   - Guide users to correct page
   - Log OAuth sign-ins without roles for monitoring

## Files Modified

- `src/pages/ConfirmEmail.tsx` - Enhanced role checking and access control

## Related Files

- `src/pages/TutorRegistration.tsx` - Sets tutor metadata
- `src/pages/LearnerRegistration.tsx` - Sets learner metadata
- `src/pages/admin/AdminLogin.tsx` - Admin OAuth handling
- `supabase/migrations/20251117_add_registered_year_to_tutor_creation.sql` - Tutor role trigger
- `supabase/migrations/20251112074156_f3991b07-537c-4e23-b0ac-b42d18be7129.sql` - Learner role trigger
