# Tutor Year Level Fix

## Problem
The tutor registration form was missing the "Year Level" field, so new tutors couldn't specify their year level during registration.

## Solution Applied

### 1. Frontend Changes (✅ Complete)
- **File**: `src/pages/TutorRegistration.tsx`
- Added `registeredYear` state variable
- Added year level dropdown (Select component) in the registration form
- Updated validation schema to require year level
- Included `registered_year` in the signup metadata

### 2. Database Migration (⚠️ Needs to be run)
- **File**: `supabase/migrations/20251117_add_registered_year_to_tutor_creation.sql`
- Updated the `create_tutor_profile_on_confirmation()` trigger function
- Now includes `registered_year` when creating tutor profiles after email confirmation

### 3. Fix Existing Tutors (Optional)
- **File**: `supabase/fix-missing-tutor-year-levels.sql`
- Run this to add year levels to existing tutors who don't have one

## Steps to Deploy

1. **Run the migration** in Supabase SQL Editor:
   ```
   supabase/migrations/20251117_add_registered_year_to_tutor_creation.sql
   ```

2. **(Optional)** Fix existing tutors without year levels:
   ```
   supabase/fix-missing-tutor-year-levels.sql
   ```

3. **Test** by registering a new tutor account and verifying:
   - Year level dropdown appears in registration form
   - Year level is saved after email confirmation
   - Year level displays in tutor profile detail dialog

## What's Already Working
- The tutor detail dialog already displays year level (if present)
- The database column `registered_year` already exists in `tutor_profiles` table
- The frontend query already fetches `registered_year`

## Notes
- New tutors registering after this fix will have their year level saved automatically
- Existing tutors can update their year level in the Edit Profile page (if that feature is added)
