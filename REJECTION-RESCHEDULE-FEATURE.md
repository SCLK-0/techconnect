# Session Rejection & Reschedule Feature

## Overview
Tutors can now decline session requests with a reason, and learners receive notifications with the option to reschedule.

## Features

### 1. Rejection with Reason (Tutor Side)

**When tutor clicks "Decline":**
1. Dialog opens with predefined reasons:
   - "Schedule conflict - I'm not available at this time"
   - "Outside my expertise area"
   - "Too short notice"
   - "Personal emergency"
   - "Other (please specify)" - with text area

2. Tutor selects reason and clicks "Decline Session"

3. System:
   - Updates session status to "rejected"
   - Saves rejection reason and timestamp
   - Sends notification to learner
   - Shows success message to tutor

### 2. Learner Notification

**Learner receives notification:**
```
Title: "Session Request Declined"
Message: "[Tutor Name] declined your session request for [Subject] on [Date]. 
Reason: [Rejection Reason]. You can reschedule or find another tutor."
```

### 3. Reschedule Dialog (Learner Side)

**When learner views rejected/cancelled session:**
1. Dialog shows:
   - Rejection/cancellation reason
   - Two options:
     - "Reschedule with [Tutor Name]" - Opens booking dialog
     - "Find Another Tutor" - Redirects to Find Tutors page

2. Learner can:
   - Book new session with same tutor (different time)
   - Find alternative tutor
   - Close and decide later

## Database Changes

### New Columns in `sessions` table:
```sql
- rejection_reason TEXT
- rejected_at TIMESTAMP
- cancelled_reason TEXT
- cancelled_at TIMESTAMP
- cancelled_by UUID (references auth.users)
```

### New Functions:

**reject_session_with_reason(session_id, tutor_id, reason)**
- Rejects session with reason
- Creates notification for learner
- Returns success/error

**cancel_session_with_reason(session_id, user_id, reason)**
- Cancels session with reason
- Works for both tutor and learner
- Notifies the other party
- Tracks who cancelled

## UI Components

### RejectSessionDialog
**Location:** `src/components/tutor/RejectSessionDialog.tsx`

**Props:**
- `sessionId` - Session to reject
- `tutorId` - Current tutor ID
- `learnerName` - For display
- `subject` - For display
- `onSuccess` - Callback after rejection

**Features:**
- Radio button selection for reasons
- Custom reason text area
- Validation
- Loading state

### RescheduleSessionDialog
**Location:** `src/components/learner/RescheduleSessionDialog.tsx`

**Props:**
- `tutorId` - To reschedule with
- `tutorName` - For display
- `tutorSubjects` - For booking
- `rejectionReason` - To display
- `cancelledReason` - To display

**Features:**
- Shows reason for rejection/cancellation
- Reschedule button (opens BookSessionDialog)
- Find another tutor button
- Clean, user-friendly UI

## Integration Points

### Tutor Requests Page ✅
**File:** `src/pages/tutor/TutorRequests.tsx`
- "Decline" button opens RejectSessionDialog
- Reason is required before declining
- Learner is notified automatically

### Learner Sessions Page (TODO)
**File:** `src/pages/learner/MySessions.tsx`
- Show rejection reason on rejected sessions
- Add "Reschedule" button
- Opens RescheduleSessionDialog

**Implementation needed:**
```tsx
// In MySessions.tsx, for rejected/cancelled sessions
{session.status === 'rejected' && (
  <div className="mt-2">
    <p className="text-sm text-muted-foreground">
      Reason: {session.rejection_reason}
    </p>
    <Button 
      size="sm" 
      onClick={() => {
        setRescheduleSession(session);
        setRescheduleDialogOpen(true);
      }}
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Reschedule
    </Button>
  </div>
)}
```

## User Experience Flow

### Scenario 1: Tutor Declines
1. Learner books session for Monday 2pm
2. Tutor sees request, clicks "Decline"
3. Tutor selects "Schedule conflict - I'm not available at this time"
4. Tutor clicks "Decline Session"
5. Learner gets notification with reason
6. Learner opens notification, sees reschedule dialog
7. Learner clicks "Reschedule with [Tutor]"
8. Booking dialog opens with different time slots
9. Learner books for Tuesday 3pm instead

### Scenario 2: Session Cancelled
1. Tutor/Learner cancels accepted session
2. System asks for cancellation reason
3. Other party receives notification
4. They can reschedule or find another tutor

## Benefits

### For Tutors
- Professional way to decline
- Maintains good relationship with learners
- Clear communication
- No awkward situations

### For Learners
- Understand why session was declined
- Easy to reschedule
- Don't feel rejected without explanation
- Quick alternative options

### For Platform
- Better user experience
- Reduced frustration
- Higher rebooking rate
- Transparency

## Migration

**File:** `supabase/migrations/20251120_add_rejection_reason_and_reschedule.sql`

Run:
```bash
supabase db push
```

Or apply manually in Supabase dashboard.

## Testing

### Test Rejection Flow
1. Login as learner, book session
2. Login as tutor, go to Requests
3. Click "Decline" on the request
4. Select reason, submit
5. Login as learner, check notifications
6. Verify reason is shown
7. Test reschedule button

### Test Cancellation Flow
1. Have an accepted session
2. Cancel it with reason
3. Check other party receives notification
4. Verify reason is displayed

### Database Check
```sql
-- Check rejected sessions
SELECT id, subject, rejection_reason, rejected_at 
FROM sessions 
WHERE status = 'rejected';

-- Check cancelled sessions
SELECT id, subject, cancelled_reason, cancelled_by, cancelled_at
FROM sessions 
WHERE status = 'cancelled';
```

## Future Enhancements

1. **Analytics**
   - Track most common rejection reasons
   - Identify problematic tutors/learners
   - Improve matching algorithm

2. **Auto-suggest Alternative Times**
   - When declining, suggest available times
   - "I'm not available then, but I'm free at..."

3. **Cancellation Policies**
   - Penalties for late cancellations
   - Grace period for free cancellations
   - Refund/credit system

4. **Templates**
   - Save custom rejection reasons
   - Quick responses for common situations

5. **Dispute Resolution**
   - If learner disagrees with reason
   - Admin review system
