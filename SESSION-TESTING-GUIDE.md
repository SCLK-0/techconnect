# Session Testing Guide

This guide will help you test the missed, cancelled, and timed-out video session scenarios.

## Setup

### Step 1: Create Test Sessions

Run the automated script in Supabase SQL Editor:

```sql
-- File: supabase/test-upcoming-sessions-auto.sql
```

This will create 5 test sessions with different durations:
1. **Starting now** - 3 minute duration (immediate test)
2. **Starting in 1 minute** - 10 minute duration (test timeout/completion)
3. **Starting in 2 minutes** - 2 minute duration (quick test)
4. **Starting in 3 minutes** - 5 minute duration (test cancellation/mid-length)
5. **Starting in 5 minutes** - 15 minute duration (normal flow test)

### Step 2: Verify Sessions Created

Check your sessions page to see the newly created test sessions.

## Testing Scenarios

### Scenario 1: Test Immediate Join (3-minute duration)

**What to test:**
- Immediate session join
- Session auto-end after 3 minutes
- Quick session completion

**Steps:**
1. Join the session immediately (it starts now)
2. Stay in the session for the full 3 minutes
3. Observe what happens when time runs out

**Expected behavior:**
- Session starts immediately
- Timer counts down from 3 minutes
- Session automatically ends when time expires
- Session marked as "completed"

### Scenario 2: Test Session Timeout (10-minute duration)

**What to test:**
- Session behavior during full 10-minute duration
- Timeout if left idle
- Normal completion

**Steps:**
1. Join the session when it starts (in 1 minute)
2. Option A: Stay active for full 10 minutes
3. Option B: Leave session idle to test timeout

**Expected behavior:**
- Session runs for full 10 minutes
- Timer shows remaining time
- Session ends automatically after 10 minutes
- If idle, may trigger timeout warning

### Scenario 3: Test Quick Session (2-minute duration)

**What to test:**
- Very short session handling
- Quick completion
- Data saving for short sessions

**Steps:**
1. Join the session when it starts (in 2 minutes)
2. Use basic features (video, audio)
3. Let it run for the full 2 minutes

**Expected behavior:**
- Session completes quickly
- All data is saved despite short duration
- Session marked as "completed"

### Scenario 4: Test Mid-Length Session & Cancellation (5-minute duration)

**What to test:**
- Cancellation before session starts
- OR join and test 5-minute duration

**Steps:**
Option A - Test Cancellation:
1. Before the session starts (within 3 minutes), cancel it
2. Verify cancellation notification

Option B - Test Duration:
1. Join when session starts
2. Stay for full 5 minutes
3. Observe completion

**Expected behavior:**
- If cancelled: Status changes to "cancelled", notification sent
- If completed: Session runs for 5 minutes and ends properly

### Scenario 5: Test Missed Session (15-minute duration)

**What to test:**
- What happens if no one joins
- Missed session marking
- Grace period handling

**Steps:**
1. Do NOT join this session
2. Wait 15 minutes after scheduled time
3. Check if session is marked as "missed"

**Expected behavior:**
- Session shows as available for 15 minutes
- After grace period, marked as "missed"
- Both participants notified
- Session appears in "Past Sessions" with "Missed" status

## Monitoring

### Check Session Status

Run this query to monitor session statuses:

```sql
SELECT 
  id,
  subject,
  scheduled_at,
  status,
  session_status,
  ROUND(EXTRACT(EPOCH FROM (scheduled_at - NOW())) / 60, 1) as minutes_until_session
FROM sessions
WHERE subject LIKE '%Test%'
ORDER BY scheduled_at;
```

### Check Session Logs

```sql
SELECT 
  sl.*,
  s.subject
FROM session_logs sl
JOIN sessions s ON sl.session_id = s.id
WHERE s.subject LIKE '%Test%'
ORDER BY sl.timestamp DESC;
```

## Cleanup

After testing, run the cleanup script:

```sql
-- File: supabase/cleanup-test-sessions.sql
```

## Troubleshooting

### Sessions not appearing?
- Check if you're logged in as the correct user (learner or tutor)
- Verify sessions were created: `SELECT * FROM sessions WHERE subject LIKE '%Test%'`

### Can't join session?
- Check if session time is within the 15-minute window
- Verify session status is "accepted"
- Check browser console for errors

### Session not marking as missed?
- Verify the missed session logic is running
- Check if there's a background job or cron that handles this
- May need to manually trigger the check

## Notes

- All test sessions have duration in the subject name for easy identification
- Sessions are created with "accepted" status and start immediately or within 5 minutes
- **Session Durations:**
  - 2 minutes - Quick test
  - 3 minutes - Immediate test
  - 5 minutes - Mid-length test
  - 10 minutes - Standard test
  - 15 minutes - Long test (for missed session testing)
- Grace period for joining is 15 minutes before scheduled time
- Sessions auto-end when duration expires
- Missed session check happens 15 minutes after scheduled time

## Additional Test Cases

### Edge Cases to Test:
1. Join exactly at scheduled time
2. Join 14 minutes before (should not allow)
3. Join 16 minutes after (should mark as missed)
4. Cancel session while someone is in it
5. Network disconnection during session
6. Browser refresh during session
7. Multiple participants joining simultaneously
