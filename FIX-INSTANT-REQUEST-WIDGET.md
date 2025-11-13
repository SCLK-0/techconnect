# Fix Instant Request Widget

## Issues Fixed

### 1. Decline Button Not Working for Learners
**Problem**: When tutor clicked "Decline", the learner's waiting modal didn't close because of status mismatch.

**Root Cause**: 
- Tutor widget was setting status to "cancelled" on decline
- Learner modal was listening for "rejected" status

**Solution**: Changed decline button to set status to "rejected" instead of "cancelled"

**Files Changed**:
- `src/components/tutor/GlobalInstantRequestsWidget.tsx`

### 2. Widget Size and Placement
**Problem**: Large InstantRequestsWidget card was showing in the dashboard, making it too big and cluttered.

**Solution**: 
- Removed the large `InstantRequestsWidget` from TutorDashboard
- Kept only the small floating `GlobalInstantRequestsWidget` that appears at the bottom of the screen
- The small floating widget now appears across all tutor pages (via TutorSidebar)

**Files Changed**:
- `src/pages/tutor/TutorDashboard.tsx` - Removed InstantRequestsWidget import and usage
- Widget is already global via `TutorSidebar.tsx`

## How It Works Now

### For Tutors:
1. When online, a small floating widget appears at the bottom center of the screen
2. Shows the most recent instant request
3. Accept button → Redirects to video session
4. Decline button → Sets status to "rejected" and notifies learner

### For Learners:
1. Click "Start Instant Session" on an online tutor
2. Waiting modal appears
3. If tutor accepts → Modal closes, toast shows success
4. If tutor declines → Modal closes, toast shows "Tutor is currently busy"
5. Learner can cancel the request anytime

## Testing
1. Tutor goes online
2. Learner requests instant session
3. Tutor sees floating widget at bottom
4. Tutor clicks Decline
5. Learner should see "Tutor is currently busy" message and modal closes
