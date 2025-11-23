# Demo Session Setup Guide

## Quick Setup (5 minutes)

### Step 1: Run the Database Migration

```bash
# Make sure you're in the project directory
cd TECHCONNECT

# Apply the migration to create demo bots
supabase db push
```

This will create:
- Demo Tutor Bot account
- Demo Learner Bot account
- All necessary profiles and roles

### Step 2: Verify Demo Bots Were Created

```bash
# Check if demo bots exist
supabase db query "SELECT email, id FROM auth.users WHERE email LIKE '%demo%@techconnect.bot'"
```

You should see:
- `demo-tutor@techconnect.bot`
- `demo-learner@techconnect.bot`

### Step 3: Test the Feature

**As a Learner:**
1. Login to your app
2. Go to Learner Dashboard
3. Look for "Try Demo Session" button (should be first in Quick Actions)
4. Click it and follow the prompts
5. You'll enter a session with Demo Tutor Bot

**As a Tutor:**
1. Login as a tutor
2. Go to Tutor Dashboard
3. Look for "Try Demo Session" button (should be first in Quick Actions)
4. Click it and follow the prompts
5. You'll enter a session with Demo Learner Bot

### Step 4: What to Expect

When you start a demo session:
1. ✅ Session starts immediately (no waiting)
2. ✅ You see your own video
3. ✅ Bot shows animated avatar (not real video)
4. ✅ Bot sends helpful chat messages every 15-30 seconds
5. ✅ All features work: whiteboard, screen share, chat, files
6. ✅ You can end session anytime

## Troubleshooting

### Demo Button Not Showing?
- Clear browser cache and refresh
- Check if migration ran successfully
- Verify you're logged in

### Demo Session Not Starting?
- Check browser console for errors
- Verify demo bot accounts exist in database
- Check if sessions table has proper permissions

### Bot Not Sending Messages?
- Check browser console for errors
- Verify session was created with correct bot ID
- Check session_messages table permissions

## For Your Defense Presentation

### Demo Flow:
1. Show the "Try Demo Session" button
2. Click it and explain the dialog
3. Start the demo session
4. Point out the bot avatar
5. Show the automated chat messages
6. Demonstrate whiteboard drawing
7. Test screen sharing
8. Show how smooth everything works
9. End the session

### Key Points to Mention:
- "Users can test features without needing another person"
- "Bot provides guided experience with helpful messages"
- "Perfect for onboarding new users"
- "Reduces friction in user adoption"
- "Shows we thought about user experience"

## Emergency Access

If you need to login as the demo bots (for debugging):

**Demo Tutor:**
- Email: `demo-tutor@techconnect.bot`
- Password: `demo-bot-password-2024`

**Demo Learner:**
- Email: `demo-learner@techconnect.bot`
- Password: `demo-bot-password-2024`

⚠️ **Don't modify these accounts!** They're needed for the demo feature to work.

## Cleanup (if needed)

To remove demo bots (not recommended):
```sql
DELETE FROM auth.users WHERE email LIKE '%demo%@techconnect.bot';
```

## Success Checklist

- [ ] Migration ran successfully
- [ ] Demo bots visible in database
- [ ] "Try Demo Session" button appears on dashboards
- [ ] Can start demo session as learner
- [ ] Can start demo session as tutor
- [ ] Bot avatar displays correctly
- [ ] Bot sends chat messages
- [ ] All features work in demo session
- [ ] Can end demo session normally

## Next Steps

You're all set! The demo session feature is ready for your defense presentation. Practice the demo flow a few times so you can show it smoothly during your presentation.

Good luck! 🎓🚀
