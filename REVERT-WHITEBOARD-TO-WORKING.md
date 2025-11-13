# Revert Whiteboard to Working State

## The Problem
After adding monitor mode features, the whiteboard sync broke. Broadcasts are sent but not received.

## Quick Fix - Simplify Channel Config

The issue is likely in the channel configuration. The monitor mode changes might have affected how channels are created.

## What Changed
Before: Simple channel config
After: Different configs for monitor vs regular users

## The Fix

In `WhiteboardCanvas.tsx` around line 240-250, find this code:

```typescript
const channelConfig = isMonitorMode ? {
  config: { 
    broadcast: { self: false },
    presence: { key: '' } // Monitor doesn't participate in presence
  }
} : {
  config: { 
    broadcast: { self: false, ack: false }, // Disable ack for faster broadcasts
    presence: { key: user.id }
  }
};
```

**Replace it with this simpler version:**

```typescript
const channelConfig = {
  config: { 
    broadcast: { self: false },
    presence: { key: isMonitorMode ? '' : user.id }
  }
};
```

This removes the `ack: false` which might be causing issues and simplifies the config.

## Alternative: Remove Monitor Mode Completely

If you don't need monitor mode right now (for your deadline), we can remove all monitor mode code and revert to the working version.

The monitor mode added complexity that broke the basic sync functionality.

## Test After Fix

1. Save the file
2. Refresh both browsers
3. Clear whiteboard states: `TRUNCATE TABLE whiteboard_states;`
4. Test drawing - should sync immediately

## If Still Not Working

The nuclear option is to revert the entire WhiteboardCanvas.tsx to before the monitor mode changes were made. Do you have a git history or backup?
