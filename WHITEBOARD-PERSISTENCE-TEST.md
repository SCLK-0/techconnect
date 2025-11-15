# Whiteboard Persistence Testing Guide

## Setup

1. **Apply the migration** to create the `whiteboard_states` table:
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/20251115_create_whiteboard_states.sql`
   - Click "Run"

2. **Verify the table was created**:
   - Run the test script: `supabase/test-whiteboard-persistence.sql`
   - You should see `table_exists = true`

## Testing Whiteboard Persistence

### Test 1: Basic Persistence
1. Start a video session between tutor and learner
2. Draw something on the whiteboard (lines, shapes, text)
3. Wait 2-3 seconds (auto-save happens every 2 seconds)
4. Refresh the page or close and rejoin the session
5. ✅ **Expected**: Your drawings should still be there

### Test 2: Multi-User Persistence
1. Tutor draws something on the whiteboard
2. Learner draws something else
3. Both users refresh their browsers
4. ✅ **Expected**: Both users see all the drawings from before the refresh

### Test 3: Admin Monitoring
1. Create a session with drawings on the whiteboard
2. Admin opens the session in monitor mode
3. ✅ **Expected**: Admin sees all the current drawings

### Test 4: Session Rejoin
1. Tutor and learner are in a session with drawings
2. Learner disconnects (closes browser)
3. Learner rejoins the same session
4. ✅ **Expected**: Learner sees all the drawings that were there before

## Troubleshooting

### If drawings don't persist:

1. **Check browser console** for errors:
   - Look for "Failed to load whiteboard state" or "Failed to save whiteboard state"
   - Check for 406 errors

2. **Verify database permissions**:
   - Run the test script to check RLS policies
   - Make sure the policies allow SELECT and INSERT/UPDATE for session participants

3. **Check auto-save is working**:
   - Draw something
   - Wait 2 seconds
   - Check browser console for "💾 Whiteboard state saved"
   - Check database: `SELECT * FROM whiteboard_states ORDER BY updated_at DESC LIMIT 1;`

4. **Common issues**:
   - **406 Error**: Table doesn't exist or RLS policies are blocking access
   - **No save logs**: Auto-save might not be triggering (check if canvas has changes)
   - **Empty canvas on reload**: State might not be loading (check console for load errors)

## Database Queries

### View all whiteboard states:
```sql
SELECT 
  ws.id,
  ws.session_id,
  s.session_status,
  jsonb_array_length(ws.canvas_state->'objects') as object_count,
  ws.updated_at
FROM whiteboard_states ws
JOIN sessions s ON s.id = ws.session_id
ORDER BY ws.updated_at DESC;
```

### Clear whiteboard state for a specific session:
```sql
DELETE FROM whiteboard_states WHERE session_id = 'YOUR-SESSION-ID-HERE';
```

### View whiteboard content:
```sql
SELECT 
  session_id,
  canvas_state->'objects' as objects,
  updated_at
FROM whiteboard_states
WHERE session_id = 'YOUR-SESSION-ID-HERE';
```
