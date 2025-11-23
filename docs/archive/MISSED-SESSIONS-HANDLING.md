# Missed Sessions Handling

## Overview
The system automatically marks sessions as "missed" when participants don't show up or start the session on time.

## How It Works

### Automatic Detection
- A background process runs **every 2 minutes** to check for missed sessions
- Uses the database function `mark_missed_sessions()` to update session statuses

### Two Types of Missed Sessions

#### 1. **Missed Pending Sessions**
**Scenario:** Learner booked a session, but tutor never accepted it

**Rules:**
- Status: `pending`
- Marked as missed when: `scheduled_time + duration + 15 minutes` has passed
- **Why 15 minutes?** Gives tutor a grace period to accept late

**Example:**
- Session scheduled: Nov 22, 10:00 AM (30 min duration)
- Tutor never accepts
- At 10:45 AM → Automatically marked as "missed"

**Impact:**
- Learner sees it in "Missed" tab
- Tutor sees it in "Missed" tab (they failed to respond)
- Time slot is freed up for other bookings

---

#### 2. **Missed Accepted Sessions**
**Scenario:** Both agreed to the session, but neither showed up to start it

**Rules:**
- Status: `accepted`
- Marked as missed when: `scheduled_time + duration + 20 minutes` has passed
- **Why 20 minutes?** Gives both parties grace period to join late

**Example:**
- Session scheduled: Nov 22, 2:00 PM (60 min duration)
- Tutor accepted it
- Neither party joins by 3:20 PM → Automatically marked as "missed"

**Impact:**
- Both see it in "Missed" tab
- Could affect ratings/reputation (future feature)
- Time slot is freed up

---

## Features for Missed Sessions

### Current Features
✅ Automatic detection and marking
✅ Separate "Missed" tab in sessions view
✅ Grace periods to prevent false positives
✅ Frees up tutor's time slot for rebooking

### Recommended Future Features

#### For Missed Pending Sessions:
- **Notification to learner:** "Your session request was not accepted in time"
- **Auto-refund/credit:** If payment system exists
- **Suggest alternative tutors:** Show other available tutors

#### For Missed Accepted Sessions:
- **Reputation impact:** Track no-show rate for both tutors and learners
- **Warning system:** After 3 missed sessions, show warning
- **Rescheduling option:** Allow one-click reschedule
- **Notification:** Email/SMS reminder 1 hour before session
- **Penalty system:** Temporary booking restrictions for repeat offenders

#### Analytics Dashboard (Admin):
- Track missed session rates
- Identify problematic users
- See peak times for missed sessions
- Generate reports

---

## Technical Implementation

### Database Function
Location: `supabase/migrations/20251120_auto_mark_missed_sessions.sql`

```sql
CREATE OR REPLACE FUNCTION mark_missed_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark pending sessions as missed (15 min grace)
  UPDATE sessions SET status = 'missed' 
  WHERE status = 'pending' 
  AND scheduled_at + duration + interval '15 minutes' < NOW();

  -- Mark accepted sessions as missed (20 min grace)
  UPDATE sessions SET status = 'missed'
  WHERE status = 'accepted'
  AND scheduled_at + duration + interval '20 minutes' < NOW();
END;
$$;
```

### React Hook
Location: `src/hooks/useMissedSessionsChecker.ts`

Runs every 2 minutes in the background while app is open.

---

## User Experience

### Learner View
**Pending → Missed:**
- "Your session request expired. The tutor didn't respond in time."
- Action: Book with another tutor

**Accepted → Missed:**
- "This session was missed. Neither party joined."
- Action: Reschedule or book new session

### Tutor View
**Pending → Missed:**
- "You didn't respond to this session request in time."
- Impact: May affect response rate metric

**Accepted → Missed:**
- "This session was missed. Neither party joined."
- Impact: May affect reliability rating

---

## Configuration

### Grace Periods (Adjustable)
- **Pending sessions:** 15 minutes after scheduled end time
- **Accepted sessions:** 20 minutes after scheduled end time

To adjust, modify the intervals in the SQL function.

### Check Frequency
Currently: Every 2 minutes

To adjust, modify `src/hooks/useMissedSessionsChecker.ts`:
```typescript
const interval = setInterval(checkMissedSessions, 2 * 60 * 1000); // 2 minutes
```

---

## Testing

### Manual Test
1. Create a session scheduled for 5 minutes from now
2. Don't accept it (for pending test) or don't join it (for accepted test)
3. Wait for grace period to pass
4. Check "Missed" tab - session should appear there

### Database Test
```sql
-- Manually call the function
SELECT mark_missed_sessions();

-- Check results
SELECT id, status, scheduled_at, duration_minutes 
FROM sessions 
WHERE status = 'missed';
```
