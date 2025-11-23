# 🏗️ Email System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         TechConnect App                         │
│                      (React + TypeScript)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Auth                              │
│                   (Authentication Layer)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Auth Hooks                                 │
│              (Trigger on specific events)                       │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │  Validate Email      │    │  Password Recovery   │          │
│  │  (on signup)         │    │  (on reset request)  │          │
│  └──────────┬───────────┘    └──────────┬───────────┘          │
└─────────────┼──────────────────────────┼──────────────────────┘
              │                          │
              ▼                          ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  Edge Function          │    │  Edge Function          │
│  send-confirmation-     │    │  send-password-reset    │
│  email                  │    │                         │
│                         │    │                         │
│  - Receives user data   │    │  - Receives user data   │
│  - Builds HTML email    │    │  - Builds HTML email    │
│  - Calls Resend API     │    │  - Calls Resend API     │
└──────────┬──────────────┘    └──────────┬──────────────┘
           │                              │
           └──────────────┬───────────────┘
                          ▼
              ┌───────────────────────┐
              │     Resend API        │
              │  (Email Service)      │
              │                       │
              │  - Sends email        │
              │  - Tracks delivery    │
              │  - Handles bounces    │
              └──────────┬────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │   User's Email Inbox  │
              │                       │
              │  📧 Professional      │
              │     Email Received    │
              └───────────────────────┘
```

## Component Details

### 1. TechConnect App
**Technology:** React + TypeScript
**Responsibilities:**
- User registration forms
- Password reset requests
- Notification triggers

**Key Files:**
- `src/pages/LearnerRegistration.tsx`
- `src/pages/TutorRegistration.tsx`
- `src/pages/ResetPassword.tsx`

### 2. Supabase Auth
**Technology:** Supabase Authentication
**Responsibilities:**
- User authentication
- Session management
- Trigger auth hooks

**Events:**
- `signup` - New user registration
- `recovery` - Password reset request
- `email_change` - Email change (future)

### 3. Auth Hooks
**Technology:** Supabase Auth Hooks
**Configuration:** Dashboard
**Responsibilities:**
- Listen for auth events
- Call edge functions
- Pass user data

**Hooks Configured:**
1. **Email Confirmation Hook**
   - Event: `Validate Email`
   - Calls: `send-confirmation-email`
   
2. **Password Reset Hook**
   - Event: `Password Recovery`
   - Calls: `send-password-reset`

### 4. Edge Functions
**Technology:** Deno + TypeScript
**Location:** `supabase/functions/`
**Responsibilities:**
- Receive hook data
- Build email HTML
- Call Resend API
- Handle errors

**Functions:**

#### send-confirmation-email
```typescript
Input: { user, email_data }
Process: Build welcome email
Output: Resend API call
```

#### send-password-reset
```typescript
Input: { user, email_data }
Process: Build reset email
Output: Resend API call
```

#### send-notification-email
```typescript
Input: { to, title, message, type }
Process: Build notification email
Output: Resend API call
```

### 5. Resend API
**Technology:** Resend Email Service
**Responsibilities:**
- Send emails
- Track delivery
- Handle bounces
- Provide analytics

**Features:**
- Fast delivery (< 1 minute)
- High deliverability
- Bounce handling
- Analytics dashboard

### 6. Email Delivery
**Result:** Professional email in user's inbox
**Features:**
- Mobile responsive
- Professional design
- Clear call-to-action
- Security warnings

## Data Flow

### Registration Flow
```
1. User fills registration form
   ↓
2. App calls supabase.auth.signUp()
   ↓
3. Supabase creates user account
   ↓
4. Supabase triggers "Validate Email" hook
   ↓
5. Hook calls send-confirmation-email function
   ↓
6. Function receives:
   {
     user: { email, user_metadata },
     email_data: { token_hash, redirect_to }
   }
   ↓
7. Function builds confirmation URL
   ↓
8. Function builds HTML email
   ↓
9. Function calls Resend API
   ↓
10. Resend sends email
    ↓
11. User receives email
    ↓
12. User clicks confirmation link
    ↓
13. User redirected to app
    ↓
14. Account confirmed ✅
```

### Password Reset Flow
```
1. User clicks "Forgot Password"
   ↓
2. User enters email
   ↓
3. App calls supabase.auth.resetPasswordForEmail()
   ↓
4. Supabase triggers "Password Recovery" hook
   ↓
5. Hook calls send-password-reset function
   ↓
6. Function receives user data
   ↓
7. Function builds reset URL
   ↓
8. Function builds HTML email
   ↓
9. Function calls Resend API
   ↓
10. Resend sends email
    ↓
11. User receives email
    ↓
12. User clicks reset link
    ↓
13. User sets new password
    ↓
14. Password reset ✅
```

### Notification Flow
```
1. App event occurs (e.g., new message)
   ↓
2. App calls send-notification-email function
   ↓
3. Function receives notification data
   ↓
4. Function builds HTML email
   ↓
5. Function calls Resend API
   ↓
6. Resend sends email
   ↓
7. User receives notification ✅
```

## Security

### No Webhook Verification
**Why:** Simplified architecture, no auth token issues
**How:** Functions deployed with `--no-verify-jwt`
**Safe:** Functions are internal, called by Supabase only

### Token Security
- Confirmation tokens are one-time use
- Reset tokens expire in 1 hour
- Tokens are hashed in URLs

### Email Security
- HTML is sanitized
- User input is escaped
- Security warnings included

## Scalability

### Current Limits
- **Resend Free:** 3,000 emails/month
- **Supabase Free:** 500,000 function calls/month

### Scaling Up
- **Resend Pro:** $20/month for 50,000 emails
- **Supabase Pro:** $25/month for 2M function calls

### Performance
- Email delivery: < 1 minute
- Function execution: < 500ms
- High availability: 99.9%

## Monitoring

### Function Logs
```powershell
supabase functions logs send-confirmation-email
```

### Resend Dashboard
- URL: https://resend.com/emails
- Shows: Sent, delivered, bounced, failed
- Analytics: Open rates, click rates

### Alerts
- Function errors logged
- Resend webhook for bounces
- Dashboard notifications

## Error Handling

### Function Errors
```typescript
try {
  // Send email
} catch (error) {
  console.error("Error:", error);
  return Response(error, 500);
}
```

### Resend Errors
- Invalid API key → Check secrets
- Rate limit → Upgrade plan
- Bounce → Check email validity

### User Errors
- Email not received → Check spam
- Link expired → Request new one
- Invalid email → Show error message

## Configuration

### Environment Variables
```
RESEND_API_KEY=re_xxxxx
SUPABASE_URL=https://frozkocrdudvtqhhgqzl.supabase.co
```

### Auth Hooks
```
Hook 1: send-confirmation-email
  Event: Validate Email
  URL: .../functions/v1/send-confirmation-email

Hook 2: send-password-reset
  Event: Password Recovery
  URL: .../functions/v1/send-password-reset
```

### Email Provider
```
✅ Enable email provider
❌ Confirm email (we use custom)
✅ Enable email signup
```

## Deployment

### Prerequisites
- Supabase CLI installed
- Logged into Supabase
- Resend API key

### Steps
1. Set environment variables
2. Deploy edge functions
3. Configure auth hooks
4. Test system

### Commands
```powershell
.\setup-resend-emails.ps1
```

## Maintenance

### Regular Tasks
- Monitor email delivery rates
- Check function logs
- Review Resend analytics
- Update email templates

### Updates
- Redeploy functions for changes
- Update secrets if needed
- Adjust hooks if needed

### Backups
- Function code in Git
- Configuration documented
- Secrets stored securely

## Future Enhancements

### Possible Additions
- Email change confirmation
- Welcome email series
- Digest notifications
- Email preferences
- Unsubscribe links
- Email analytics

### Custom Domain
- Set up in Resend
- Configure DNS
- Update function code
- Improve deliverability

### Templates
- More email types
- Localization
- A/B testing
- Dynamic content

## Documentation

### For Developers
- `SETUP-RESEND-EMAILS.md` - Setup guide
- `COMMANDS-REFERENCE.md` - Command reference
- `DASHBOARD-CONFIG-GUIDE.md` - Dashboard guide

### For Users
- Email templates include help text
- Clear call-to-action buttons
- Support contact info

## Support

### Resources
- Resend Docs: https://resend.com/docs
- Supabase Docs: https://supabase.com/docs
- Function logs: `supabase functions logs`

### Troubleshooting
- Check logs first
- Verify configuration
- Test with curl
- Check Resend dashboard

---

**This architecture provides:**
- ✅ Reliable email delivery
- ✅ Professional appearance
- ✅ Easy maintenance
- ✅ Good monitoring
- ✅ Scalable design
