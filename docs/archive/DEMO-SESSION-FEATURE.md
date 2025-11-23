# Demo Session Feature

## Overview
A feature that allows users to test the video session functionality without needing another real user. Perfect for demonstrations, testing, and user onboarding.

## What Was Implemented

### 1. Demo Bot Accounts
- **Demo Tutor Bot** (`00000000-0000-0000-0000-000000000001`)
  - Always shows as "online"
  - Auto-accepts session requests
  - Has approved tutor status
  
- **Demo Learner Bot** (`00000000-0000-0000-0000-000000000002`)
  - Available for tutors to practice with
  - Has learner profile set up

### 2. "Try Demo Session" Button
- Added to both Learner and Tutor dashboards
- Located in "Quick Actions" section
- Prominent placement for easy discovery
- Shows informative dialog before starting

### 3. Automated Bot Behavior
- **Auto-Accept**: Demo sessions start immediately (no waiting)
- **Auto-Chat**: Bot sends helpful messages every 15-30 seconds
- **Visual Bot Avatar**: Animated bot icon instead of real video
- **Guided Experience**: Messages guide users through features

### 4. Bot Chat Messages

**For Learners** (Demo Tutor says):
- "👋 Hi! I'm your demo tutor. Welcome to the session!"
- "Feel free to test all the features here."
- "Try drawing on the whiteboard - it's really fun! ✏️"
- "You can also share your screen if you'd like."
- And more...

**For Tutors** (Demo Learner says):
- "👋 Hello! I'm your demo learner. Thanks for practicing with me!"
- "Feel free to explain anything - I'm here to learn!"
- "The whiteboard is really helpful for visual explanations."
- And more...

### 5. Features Users Can Test
- ✅ Video interface (sees their own video)
- ✅ Interactive whiteboard
- ✅ Chat messaging (with bot responses)
- ✅ Screen sharing
- ✅ File sharing
- ✅ All session controls

## How It Works

1. User clicks "Try Demo Session" button
2. System creates a session with the appropriate demo bot
3. Session starts immediately (status: "in_progress")
4. User sees:
   - Their own video feed
   - Animated bot avatar on the other side
   - Automated chat messages from the bot
   - All functional features (whiteboard, chat, etc.)
5. User can test everything without needing another person

## Files Created/Modified

### New Files:
- `supabase/migrations/20251123_create_demo_bots.sql` - Creates bot accounts
- `src/utils/demoSession.ts` - Demo session utilities
- `src/components/DemoSessionButton.tsx` - Button component
- `src/hooks/useDemoBotChat.tsx` - Automated chat hook
- `src/components/video-session/DemoBotVideo.tsx` - Bot avatar component

### Modified Files:
- `src/pages/learner/LearnerDashboard.tsx` - Added demo button
- `src/pages/tutor/TutorDashboard.tsx` - Added demo button
- `src/pages/VideoSession.tsx` - Integrated demo bot detection and display

## Database Migration

Run this to create the demo bots:
```bash
# Apply the migration
supabase db push
```

Or manually run:
```sql
-- See supabase/migrations/20251123_create_demo_bots.sql
```

## Benefits for Your Defense

1. **No Dependency on Other Users**: Evaluators can test immediately
2. **Consistent Experience**: Bot behaves predictably
3. **Guided Tour**: Automated messages explain features
4. **Professional Look**: Shows polish and attention to UX
5. **Risk Mitigation**: Works even if no tutors are registered

## Testing

To test the demo feature:
1. Login as a learner
2. Go to dashboard
3. Click "Try Demo Session"
4. Explore all features with the demo tutor bot

Or:
1. Login as a tutor
2. Go to dashboard
3. Click "Try Demo Session"
4. Practice tutoring with the demo learner bot

## Notes

- Demo sessions are marked with `session_type: "instant"`
- Bot messages are sent automatically every 15-30 seconds
- Bot avatar is animated and visually distinct
- All features work normally in demo sessions
- Users can end demo sessions anytime

## Future Enhancements (Optional)

- Add more bot message variations
- Allow users to customize demo duration
- Add demo session analytics
- Create video tutorial overlay
- Add achievement/badge for completing demo
