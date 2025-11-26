# TechConnect Bug Report & Feature Issues
**Generated:** November 27, 2025

## 🐛 Confirmed Issues

### 1. **Bio Field Inconsistency** ⚠️ HIGH PRIORITY
**Location:** `src/pages/EditProfile.tsx` vs `src/pages/TutorRegistration.tsx`

**Issue:** 
- Registration pages now use **word count** (500 words max)
- Edit Profile page still uses **character count** (500 characters max)
- This creates confusion and data validation mismatch

**Impact:**
- Users can write 500 words during registration (~3000+ characters)
- But can only edit to 500 characters later
- Data loss when editing profile

**Fix Required:**
- Update EditProfile.tsx to use word count like registration
- Update validation schema to match
- Add word counter helper function

---

### 2. **Potential Null/Undefined Access in FindTutors**
**Location:** `src/pages/learner/FindTutors.tsx`

**Issue:**
Multiple `.map()`, `.filter()`, `.find()` operations without null checks:
- Line 145: `tutor.subject_expertise.map()` - no check if array exists
- Line 197: `time24.split(':').map(Number)` - no validation of time format
- Line 362: `profileData?.find()` - uses optional chaining but result not checked

**Potential Impact:**
- Runtime errors if data structure is unexpected
- App crashes for users with incomplete tutor profiles

**Recommendation:**
- Add defensive checks: `tutor.subject_expertise?.map() || []`
- Validate time format before splitting
- Add fallback values for missing data

---

### 3. **LearnerRegistration Missing Bio Field**
**Location:** `src/pages/LearnerRegistration.tsx`

**Issue:**
- Tutor registration has bio field with word counter
- Learner registration has NO bio field
- But learners might want to introduce themselves too

**Impact:**
- Inconsistent user experience
- Learners can't add bio during registration (only later in Edit Profile)

**Recommendation:**
- Consider adding optional bio field to learner registration
- Or document why learners don't need bios

---

## 🔍 Potential Issues to Investigate

### 4. **Video Session Media Cleanup**
**Location:** `src/pages/VideoSession.tsx`

**Observation:**
- Complex media track management
- Multiple state variables for camera/screen sharing
- Patch notes mention "improved session cleanup"

**Needs Testing:**
- Does camera properly release when leaving session?
- Are all media tracks stopped on disconnect?
- Memory leaks from unreleased streams?

**Test Scenarios:**
- Join session → Leave → Rejoin (camera should work)
- Switch between camera and screen share multiple times
- Unexpected disconnect (browser crash, network loss)

---

### 5. **Time Slot Validation**
**Location:** `src/pages/learner/FindTutors.tsx` (Lines 197-256)

**Observation:**
- Complex time parsing with `.split(':').map(Number)`
- No validation that time format is correct
- Assumes format is always "HH:MM"

**Potential Issues:**
- Invalid time formats could cause NaN errors
- Edge cases: midnight (00:00), noon (12:00)
- Timezone handling not visible

**Recommendation:**
- Add time format validation
- Use try-catch around time parsing
- Consider using date library (date-fns) for reliability

---

### 6. **Booked Tutors Filter Edge Case**
**Location:** `src/pages/learner/FindTutors.tsx`

**Recent Fix:** Filter now disabled when no sessions exist

**Potential Issue:**
- What if user had sessions but they're all deleted/cancelled?
- Filter would be enabled but show no results
- Message says "You haven't had any sessions" but that's not true

**Recommendation:**
- Distinguish between "never had sessions" vs "no matching tutors"
- Update message based on actual scenario

---

## ✅ Recently Fixed (From Context)

1. ✅ Emoji picker positioning in fullscreen/mobile
2. ✅ Asset card layout for long filenames
3. ✅ Session timeout handling loops
4. ✅ Favorite button 406 errors
5. ✅ "Show only tutors I've booked before" filter UX
6. ✅ Bio character counter in registration (now word counter)

---

## 🧪 Recommended Testing Areas

### High Priority
1. **Profile Editing** - Test bio field limits (words vs characters)
2. **Registration Flow** - Both tutor and learner paths
3. **Video Sessions** - Camera/mic permissions and cleanup
4. **Time Slot Display** - Various timezone and time formats

### Medium Priority
5. **Search & Filters** - Edge cases with empty results
6. **Real-time Updates** - Tutor online status, session updates
7. **File Uploads** - Avatar, assets, donation QR codes

### Low Priority
8. **Mobile Responsiveness** - All pages on small screens
9. **Error Messages** - User-friendly and helpful
10. **Loading States** - No infinite spinners

---

## 📝 Notes

- Most critical issue is **bio field inconsistency** (#1)
- Code quality is generally good (no TODO/FIXME comments found)
- Error handling exists but could be more defensive
- Consider adding TypeScript strict mode for better type safety

---

## 🔧 Quick Wins

These can be fixed quickly:

1. **Add word counter to EditProfile** (15 min)
2. **Add null checks in FindTutors** (30 min)
3. **Validate time format parsing** (20 min)
4. **Improve booked filter messaging** (10 min)

Total: ~75 minutes to fix all quick wins
