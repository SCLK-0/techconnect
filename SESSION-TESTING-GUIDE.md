# Session Testing Guide

This guide will help you test the missed, cancelled, and timed-out video session scenarios.

## Setup

### Step 1: Create Test Sessions

Run the automated script in Supabase SQL Editor:

```sql
-- File: supabase/test-upcoming-sessions-auto.sql
```

This will create 5 test sessions:
1. **10 minutes from now** - Test missed session (after 15 min grace period)
2. **2 minutes from now** - Test timeout scenario
3. **5 minutes from now** - Test cancellation
4. **1 minute from now** - Test immediate join
5. **15 minutes from now** - Test normal flow

### Step 2: Verify Sessions Created

Check your sessions page to see the newly created test sessions.

## Testing Scenarios

### Scenario 1: Test Missed Session (10-minute session)

**What to test:**
- Session should show "Join Session" button 15 minutes before scheduled time
- If no one joins within 15 minutes after scheduled time, session should be marked as "missed"

**Steps:**
1. Wait for the 10-minute session to become available
2. Do NOT join the session
3. Wait 15 minutes after the scheduled time
4. Session should automatically be marked as "missed"

**Expected behavior:**
- Session status changes to "missed"
- Both learner and tutor receive notification
- Session appears in "Past Sessions" with "Missed" status

### Scenario 2: Test Timeout (2-minute session)

**What to test:**
- Session timeout after 60 minutes of inactivity
- Automatic session end

**Steps:**
1. Join the 2-minute session when it becomes available
2. Leave the session idle (no activity)
3. Wait for timeout (or manually test timeout logic)

**Expected behavior:**
- Session ends automatically after timeout period
- Session status changes to "completed" or "timed_out"
- Session data is saved

### Scenario 3: Test Cancellation (5-minute session)

**What to test:**
- Ability to cancel session before it starts
- Cancellation notifications

**Steps:**
1. Navigate to the 5-minute session
2. Click "Cancel Session" button
3. Confirm cancellation

**Expected behavior:**
- Session status changes to "cancelled"
- Other participant receives cancellation notification
- Session appears in "Past Sessions" with "Cancelled" status

### Scenario 4: Test Immediate Join (1-minute session)

**What to test:**
- Quick join functionality
- Session start process

**Steps:**
1. Wait for the 1-minute session to become available
2. Click "Join Session" immediately
3. Verify video session starts correctly

**Expected behavior:**
- Video session loads successfully
- Both participants can see each other
- Session status changes to "in_progress"

### Scenario 5: Test Normal Flow (15-minute session)

**What to test:**
- Normal session flow from start to finish
- All features working correctly

**Steps:**
1. Wait for the 15-minute session
2. Join when available
3. Use all features (video, audio, chat, whiteboard)
4. End session normally

**Expected behavior:**
- All features work as expected
- Session ends cleanly
- Session marked as "completed"

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

- All test sessions have "Test" in the subject name for easy identification
- Sessions are created with "accepted" status
- Times are relative to NOW(), so they adjust automatically
- Grace period for joining is 15 minutes before scheduled time
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
