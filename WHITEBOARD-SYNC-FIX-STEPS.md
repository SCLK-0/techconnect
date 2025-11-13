# Whiteboard Sync Fix - Step by Step

## The Problem
Whiteboard is not syncing between users in real-time. One user draws something, the other user doesn't see it.

## Root Cause
The whiteboard is loading OLD saved states from the database instead of showing real-time changes.

## Solution Steps

### Step 1: Clear Old Whiteboard Data
In Supabase SQL Editor, run:
```sql
TRUNCATE TABLE whiteboard_states;
```

This will delete all saved whiteboard states and force a fresh start.

### Step 2: Check Realtime is Enabled
1. Go to Supabase Dashboard
2. Click on "Project Settings" (gear icon in bottom left)
3. Click on "API" in the left sidebar
4. Scroll down to "Realtime" section
5. Make sure "Enable Realtime" is turned ON

**Note:** The whiteboard uses Broadcast channels, which work even without database replication. You don't need to enable replication on any tables.

### Step 3: Test the Fix
1. **Close all browser windows** completely
2. Open two new browser windows (or use incognito + normal)
3. Log in as tutor in one window
4. Log in as learner in another window
5. Start an instant session
6. Wait for "Whiteboard ready" toast on BOTH sides
7. Draw on one side - should appear on the other within 1 second

### Step 4: If Still Not Working

Check browser console (F12) on both sides and look for:
- `✅ whiteboard channel SUBSCRIBED` - Should see this on both sides
- `📤 BROADCASTING:` - Should see this when drawing
- `📥 RECEIVED:` - Should see this on the other side

If you see errors like:
- `❌ subscription TIMEOUT` - Realtime is not enabled or network issue
- `❌ BROADCAST FAILED` - Channel not ready or subscription failed

### Step 5: Emergency Fix - Disable Saved States

If the issue persists, we can disable loading saved states and rely only on real-time sync:

In `WhiteboardCanvas.tsx`, comment out the state loading section (around line 150-200):
```typescript
// TEMPORARILY DISABLE STATE LOADING
/*
const { data: existingState } = await supabase
  .from('whiteboard_states')
  .select('canvas_state')
  .eq('session_id', sessionId)
  .maybeSingle();

if (existingState?.canvas_state) {
  // ... state loading code ...
}
*/
```

This will make the whiteboard start fresh every time, but real-time sync will work.

## Why This Happens

The whiteboard saves its state to the database every time something changes. When you join a session, it loads this saved state. If:
1. The saved state is from a previous session
2. The saved state is corrupted
3. The saved state loads AFTER real-time events start coming in

Then you'll see old content instead of the current whiteboard.

## Prevention

After fixing, the whiteboard should:
1. Load saved state when joining (if any)
2. Immediately start syncing real-time changes
3. Save state periodically so if someone disconnects and rejoins, they see the current state

The key is that real-time sync should ALWAYS take priority over saved state.
