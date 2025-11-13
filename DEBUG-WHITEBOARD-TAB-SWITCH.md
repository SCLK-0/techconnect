# 🔍 Debug Whiteboard Tab Switch Issue

## Problem

When switching from Whiteboard → Assets → Whiteboard, the realtime sync stops working (usually for learner).

## Possible Causes

### 1. Component Unmounting
**Check:** Are the components unmounting when hidden?
- Current implementation uses `className="hidden"` which keeps components mounted
- Both WhiteboardCanvas and AssetsPanel should stay in the DOM

### 2. Canvas Size Issue
When hidden with `display: none`, the canvas container has width/height of 0.
- This might cause the canvas to not render properly when shown again

### 3. Channel Disconnection
The realtime channel might be disconnecting when the component is hidden.

### 4. Event Listeners Lost
Canvas event listeners might be removed or not working when hidden.

## Debug Steps

### Step 1: Check Console Logs

When you switch tabs, check for these logs:

**When switching TO Assets:**
- Should NOT see: "Unsubscribing from..." or "Channel closed"
- Should still see: Cursor move events (if other user is drawing)

**When switching BACK to Whiteboard:**
- Should see: Canvas rendering
- Should see: "📥 RECEIVED:" logs if other user draws
- Should see: "📤 BROADCASTING:" logs when you draw

### Step 2: Test Realtime Connection

1. Open session in two browsers (Tutor & Learner)
2. Both on Whiteboard tab
3. Tutor draws → Learner sees it ✅
4. Learner switches to Assets tab
5. Tutor draws → Check if learner's console shows "📥 RECEIVED:"
6. Learner switches back to Whiteboard
7. Learner draws → Check if Tutor sees it

### Step 3: Check Channel Status

Add this to browser console while on Whiteboard:
```javascript
// Check if channel is still subscribed
console.log("Channel ref:", channelRef.current);
console.log("Is channel ready:", isChannelReady.current);
```

## Potential Fixes

### Fix 1: Force Canvas Refresh on Tab Switch

Add a useEffect to refresh canvas when tab becomes visible:

```typescript
useEffect(() => {
  if (activePanel === "whiteboard" && canvas) {
    canvas.renderAll();
  }
}, [activePanel, canvas]);
```

### Fix 2: Prevent Canvas from Being Hidden

Instead of hiding with CSS, use conditional rendering but keep channel alive:

```typescript
// Keep channel in a separate component that never unmounts
// Only hide/show the canvas rendering
```

### Fix 3: Reconnect Channel on Tab Switch

Add logic to check channel status when tab becomes visible:

```typescript
useEffect(() => {
  if (activePanel === "whiteboard") {
    // Check if channel is still connected
    if (!isChannelReady.current) {
      // Reconnect
    }
  }
}, [activePanel]);
```

## What to Check

1. **Console Logs:**
   - Are there any errors when switching tabs?
   - Do you see "Channel closed" or "Unsubscribing"?
   - Are broadcast/receive logs still appearing?

2. **Network Tab:**
   - Is the WebSocket connection still active?
   - Are there any connection errors?

3. **Specific User:**
   - Does it happen for both Tutor and Learner?
   - Or only for one role?

## Temporary Workaround

If the issue persists, you can:
1. Avoid switching tabs during active drawing
2. Refresh the page if sync stops working
3. Both users stay on Whiteboard tab

## Next Steps

Please check:
1. Browser console when switching tabs
2. Which user (tutor/learner) loses sync
3. Any error messages
4. Whether the channel is still connected

Share the console logs and I can provide a more specific fix!
