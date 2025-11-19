# What Happens When a Tutor Application is Rejected?

## Current Behavior (Before Migration)

### 1. Admin Rejects Application
- Admin goes to "Approvals" page
- Reviews tutor application
- Clicks "Reject" button
- Tutor's status in database changes from "pending" to "rejected"

### 2. Tutor Experience
**When they log in:**
- ✅ They see a red banner on their dashboard
- ✅ Banner says: "Application Rejected - Unfortunately, your tutor application was not approved. Please contact support for more information."
- ❌ They do NOT receive a notification (this is a gap)

**What they CAN'T do:**
- Cannot set availability
- Cannot accept sessions
- Cannot upload resources
- Cannot access tutor features

**What they CAN do:**
- View their profile
- Contact support
- Log out

### 3. Database State
```sql
tutor_profiles table:
- status = 'rejected'
- All other data remains (for record keeping)

user_roles table:
- Still has 'tutor' role (but status prevents access)
```

---

## Improved Behavior (After Migration)

Run the migration: `supabase/migrations/20251117_add_tutor_rejection_notification.sql`

### What Changes:
1. ✅ Tutor receives a notification when rejected
2. ✅ Notification appears in their notification bell
3. ✅ Notification says: "Unfortunately, your tutor application was not approved at this time. Please contact support for more information or to reapply."

### Complete Flow:
```
Admin clicks "Reject"
    ↓
Database: status = 'rejected'
    ↓
Trigger fires: notify_tutor_approval()
    ↓
Notification created in notifications table
    ↓
Supabase Realtime broadcasts notification
    ↓
Tutor's browser receives notification instantly
    ↓
Red banner appears on dashboard
    ↓
Notification bell shows new notification
```

---

## Technical Implementation

### Database Trigger (Updated)
```sql
CREATE OR REPLACE FUNCTION public.notify_tutor_approval()
RETURNS trigger AS $$
BEGIN
  -- Notify on approval
  IF NEW.status != OLD.status AND NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      'Tutor Profile Approved',
      'Your tutor profile has been approved! You can now start accepting sessions.',
      'approval',
      NEW.id
    );
  END IF;
  
  -- Notify on rejection (NEW)
  IF NEW.status != OLD.status AND NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      'Tutor Application Update',
      'Unfortunately, your tutor application was not approved at this time. Please contact support for more information or to reapply.',
      'approval',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Frontend Display (Already Implemented)
```typescript
// TutorDashboard.tsx - Shows red banner
{tutorStatus === "rejected" && (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="pt-6">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-red-600" />
        <div>
          <p className="font-semibold text-red-900">Application Rejected</p>
          <p className="text-sm text-red-700">
            Unfortunately, your tutor application was not approved. 
            Please contact support for more information.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## User Journey After Rejection

### Option 1: Contact Support
1. Tutor sees rejection message
2. Clicks on support email or contact form
3. Asks for feedback on why they were rejected
4. Admin provides guidance
5. Tutor can improve and reapply

### Option 2: Reapply (Future Feature)
Currently, rejected tutors cannot reapply through the UI. They would need:
1. Admin to manually change status back to "pending"
2. Or create a new account (not ideal)

**Recommendation**: Add a "Reapply" feature that:
- Allows rejected tutors to update their profile
- Resubmit for approval
- Changes status from "rejected" back to "pending"

---

## Admin Considerations

### Why Reject a Tutor?
Common reasons:
- Insufficient qualifications
- Inappropriate bio content
- Duplicate account
- Suspicious activity
- Subject expertise doesn't match platform needs

### Best Practices
1. **Review carefully** - Rejection is permanent (without manual intervention)
2. **Provide feedback** - Consider adding a rejection reason field
3. **Be consistent** - Apply same standards to all applicants
4. **Document decisions** - Keep notes on why someone was rejected

### Future Enhancement: Rejection Reasons
Add a dropdown when rejecting:
```typescript
rejection_reason: 
  - "Insufficient qualifications"
  - "Inappropriate content"
  - "Duplicate account"
  - "Other"
rejection_notes: "Free text field for admin notes"
```

This would help:
- Provide specific feedback to tutors
- Track rejection patterns
- Improve approval process

---

## Security Implications

### Access Control
Rejected tutors:
- ✅ Cannot access tutor-only pages (enforced by RLS)
- ✅ Cannot create sessions
- ✅ Cannot upload resources
- ✅ Can still view their own profile
- ✅ Can still log in (to see rejection message)

### Database Policies
```sql
-- Tutors can only access features if status = 'approved'
CREATE POLICY "Approved tutors only"
ON public.tutor_availability
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tutor_profiles 
    WHERE user_id = auth.uid() 
    AND status = 'approved'
  )
);
```

---

## Testing Checklist

After running the migration, test:
- [ ] Admin rejects a tutor application
- [ ] Tutor receives notification immediately
- [ ] Notification appears in notification bell
- [ ] Red banner shows on tutor dashboard
- [ ] Tutor cannot access tutor features
- [ ] Tutor can still view profile
- [ ] Notification message is clear and helpful

---

## Summary

**Current State:**
- Rejected tutors see a banner but don't get notified

**After Migration:**
- Rejected tutors receive instant notification
- Clear message with next steps
- Better user experience

**Future Improvements:**
- Add rejection reasons
- Allow reapplication
- Admin notes for rejection decisions
- Email notification (in addition to in-app)
