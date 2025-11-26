# TechConnect Administrator Manual

**Version 2.0** | **Last Updated:** November 2025

This manual is exclusively for **Platform Administrators**. For learner and tutor documentation, see [USER-MANUAL-UPDATED.md](USER-MANUAL-UPDATED.md).

---

## Table of Contents

1. [Introduction](#introduction)
2. [Admin Dashboard](#admin-dashboard)
3. [User Management](#user-management)
4. [Tutor Verification](#tutor-verification)
5. [Session Management](#session-management)
6. [Live Monitoring](#live-monitoring)
7. [Learning Resources](#learning-resources)
8. [Announcements](#announcements)
9. [Analytics](#analytics)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

### Administrator Role

As a TechConnect administrator, you are responsible for:
- ✅ Verifying and approving tutor applications
- ✅ Managing user accounts (activate/deactivate)
- ✅ Monitoring platform activity and live sessions
- ✅ Approving learning materials
- ✅ Posting announcements
- ✅ Viewing platform analytics
- ✅ Maintaining platform quality

### Admin Access

**Login URL:** `https://cit-techconnect.org/admin/login`

**Note:** Admin accounts are created by system administrators only.

### Security

- Never share admin credentials
- Log out when finished
- Report suspicious activity
- Use strong passwords

---

## Admin Dashboard

### Dashboard Overview

After logging in, your dashboard displays:

**Key Metrics:**
- **Total Users** - All registered users
- **Pending Approvals** - Tutor applications awaiting review
- **Active Sessions** - Live sessions happening now
- **Total Sessions** - All sessions count

**Sidebar Menu:**
- 🏠 Dashboard
- 👥 Users
- ✅ Approvals
- 📅 Sessions
- 📊 Session Logs
- 👁️ Live Monitoring
- 📚 Resources
- 📢 Announcements
- 📈 Analytics


---

## User Management

### View All Users

1. Click **"Users"** in sidebar
2. See list of all users with:
   - Name
   - User ID (first 8 characters)
   - Role (Admin, Tutor, Learner)
   - Status (Active/Inactive)
   - Join date

### Search and Filter

**Search:** Type name or user ID in search bar

**Filter by Role:**
- All Roles
- Admin
- Tutor
- Learner

**Filter by Year Level:**
- All Years
- 1st Year, 2nd Year, 3rd Year, 4th Year

### User Actions

**Deactivate User (Suspend):**

1. Find user in list
2. Click **"Deactivate"** button
3. Confirm action

**Effects of Deactivation:**
- User cannot log in (account suspended)
- Active sessions cancelled
- Pending sessions cancelled
- User receives email notification
- Account status shows as "Inactive"

**Reactivate User:**

1. Find deactivated user
2. Click **"Activate"** button
3. Confirm action

**Effects of Activation:**
- User can log in again
- Account status shows as "Active"
- User receives email notification

**Note:** 
- "Deactivate" is the same as "suspend" - it temporarily prevents user access
- Cannot deactivate admin users
- Only non-admin users can be deactivated
- Deactivation is reversible (can reactivate anytime)

### Pagination

- View 7 users per page
- Navigate using pagination controls at bottom
- Shows page numbers and total pages

---

## Tutor Verification

### View Applications

1. Click **"Approvals"** in sidebar
2. See two tabs:
   - **Pending** - Applications awaiting review
   - **Rejected** - Previously rejected applications

### Review Application

Each application shows:
- Tutor name and year level
- User ID
- Subject expertise (tags)
- Bio/introduction
- Application date

### Approve Tutor

1. Review application details
2. Click **"Approve"** button
3. Confirm approval

**What Happens:**
- Tutor status changes to "Approved"
- Tutor can now accept sessions
- Tutor receives approval email
- Tutor appears in tutor listings

### Reject Tutor

1. Review application
2. Click **"Reject"** button
3. Confirm rejection

**What Happens:**
- Tutor status changes to "Rejected"
- Tutor receives rejection email
- Application moves to "Rejected" tab
- Tutor can update profile and reapply

### Re-approve Rejected Tutor

From "Rejected" tab:
1. Find rejected tutor
2. Click **"Re-approve Tutor"** button
3. Confirm action
4. Tutor status changes to "Approved"

### Pagination

- View 5 applications per page
- Navigate using pagination controls


---

## Session Management

### View All Sessions

1. Click **"Sessions"** in sidebar
2. See all sessions with:
   - Subject
   - Tutor name
   - Learner name
   - Duration (minutes)
   - Status
   - Date
   - Actions

### Search Sessions

Use search bar to find sessions by:
- Subject
- Tutor name
- Learner name

### Filter Sessions

**Filter by Status:**
- All Statuses
- Pending
- Accepted
- Completed
- Cancelled

### Session Status Badges

- **Pending** - Awaiting tutor response
- **Accepted** - Confirmed by tutor
- **Completed** - Session finished
- **Cancelled** - Cancelled by either party
- **Disconnected** - Session ended due to disconnect

### View Session Logs

For completed sessions:
1. Find completed session
2. Click **"View Logs"** button
3. Redirects to Session Logs page

**Note:** Only completed sessions have logs available.

### Pagination

- View 7 sessions per page
- Navigate using pagination controls

---

## Live Monitoring

### Access Live Monitoring

1. Click **"Live Monitoring"** in sidebar
2. See all active sessions in real-time

### Active Sessions Display

For each active session:
- Tutor and learner names
- Subject
- Duration (time elapsed)
- Status (in progress/waiting)
- **"Monitor"** button

### Monitor Session

1. Click **"Monitor"** on active session
2. Opens video session in monitor mode
3. **You can:**
   - View video feeds (tutor and learner)
   - See whiteboard activity
   - Read chat messages
   - Observe session progress

**Important:**
- Monitoring is invisible to participants
- Use only for quality assurance or investigations
- Respect privacy

### When to Monitor

**Appropriate:**
- Investigating reported issues
- Quality assurance checks
- Responding to complaints
- Technical support

**Not Appropriate:**
- Casual observation
- Without valid reason

---

## Learning Resources

### View Pending Resources

1. Click **"Resources"** in sidebar
2. See all pending resources with:
   - Title
   - Description
   - Uploader (tutor name and year)
   - Upload date
   - File type
   - Download count (if any)

### Review Resource

Click on resource to view:
- Full title and description
- Uploader information
- File details
- Upload date

**Review Criteria:**
- ✅ Relevant to CIT subjects
- ✅ Appropriate content
- ✅ Good quality
- ✅ Educational value

### Preview Resource

1. Click **"Preview"** button
2. Opens resource preview dialog
3. View file content (if supported)

### Approve Resource

1. Review resource
2. Click **"Approve"** button
3. Confirm approval

**What Happens:**
- Resource status changes to "Approved"
- Available to all users
- Uploader receives notification
- Appears in resource library

### Reject Resource

1. Review resource
2. Click **"Reject"** button
3. Confirm rejection

**What Happens:**
- Resource status changes to "Rejected"
- Not available to users
- Uploader receives notification
- Tutor can upload revised version

### Pagination

- View 7 resources per page
- Navigate using pagination controls


---

## Announcements

### View Announcements

1. Click **"Announcements"** in sidebar
2. See all announcements with:
   - Title
   - Content preview (first 3 lines)
   - Posted date
   - Delete button

### Create Announcement

1. Fill in form:
   - **Title** (required, max 200 characters)
   - **Content** (required, max 2000 characters)
2. Click **"Create Announcement"**

**Formatting:**
- Use `**text**` for bold text
- Content supports line breaks
- Character count shown below fields

**What Happens:**
- Announcement posted to platform
- All users see notification
- Appears on dashboards

### View Full Announcement

1. Click on announcement card
2. Opens dialog with full content
3. Shows complete title, date, and content

### Delete Announcement

1. Find announcement
2. Click trash icon (🗑️)
3. Confirm deletion
4. Announcement removed immediately

**Note:** Deletion is permanent and cannot be undone.

### Pagination

- View 3 announcements per page
- Navigate using pagination controls

---

## Analytics

### Platform Analytics

1. Click **"Analytics"** in sidebar
2. View comprehensive statistics

**Available Metrics:**
- Total users
- New users (this week/month)
- Active users
- User growth trends
- Total sessions
- Completed sessions
- Session success rate
- Popular subjects
- Tutor performance
- Learner engagement

**Note:** Specific analytics features depend on platform configuration. Contact system administrator for custom reports.

---

## Troubleshooting

### Common Issues

#### Cannot Access Admin Panel

**Problem:** Redirected or access denied

**Solutions:**
1. ✅ Verify admin role
2. ✅ Check login credentials
3. ✅ Clear browser cache
4. ✅ Try different browser
5. ✅ Contact system administrator

#### Pending Approvals Not Showing

**Problem:** No applications visible

**Solutions:**
1. ✅ Refresh page
2. ✅ Check tab (Pending vs Rejected)
3. ✅ Verify there are pending applications
4. ✅ Clear browser cache

#### Cannot Approve/Reject

**Problem:** Buttons not working

**Solutions:**
1. ✅ Check internet connection
2. ✅ Refresh page
3. ✅ Try different browser
4. ✅ Check browser console for errors
5. ✅ Contact technical support

#### Live Monitoring Not Working

**Problem:** Cannot view sessions

**Solutions:**
1. ✅ Check if sessions are actually active
2. ✅ Refresh page
3. ✅ Allow browser permissions
4. ✅ Check internet connection
5. ✅ Try different browser

### User-Reported Issues

#### User Cannot Log In

**Check:**
1. Verify account exists
2. Check account status (not deactivated)
3. Verify email is confirmed
4. Check role assignment

#### Session Issues

**Check:**
1. View session logs
2. Check participant accounts
3. Verify session status
4. Check for technical issues

#### Resource Upload Issues

**Check:**
1. Verify file size (under 10MB)
2. Check file format
3. Verify tutor is approved
4. Review error logs


---

## Best Practices

### Tutor Verification

**Do:**
- ✅ Review applications thoroughly
- ✅ Verify CIT student status
- ✅ Check subject expertise relevance
- ✅ Process applications promptly (1-3 days)
- ✅ Be consistent in standards

**Don't:**
- ❌ Approve without review
- ❌ Reject without consideration
- ❌ Show bias
- ❌ Delay unnecessarily

### User Management

**Do:**
- ✅ Investigate before deactivating
- ✅ Document all actions
- ✅ Communicate with users
- ✅ Follow university policies
- ✅ Be fair and consistent

**Don't:**
- ❌ Deactivate without reason
- ❌ Share user information
- ❌ Make arbitrary decisions
- ❌ Ignore complaints

### Resource Approval

**Do:**
- ✅ Review content quality
- ✅ Check relevance
- ✅ Verify appropriateness
- ✅ Approve promptly
- ✅ Maintain standards

**Don't:**
- ❌ Approve without review
- ❌ Reject without reason
- ❌ Allow inappropriate content
- ❌ Be inconsistent

### Live Monitoring

**Do:**
- ✅ Monitor only when necessary
- ✅ Document monitoring reason
- ✅ Respect privacy
- ✅ Use for quality assurance
- ✅ Maintain confidentiality

**Don't:**
- ❌ Monitor without reason
- ❌ Share monitoring observations
- ❌ Invade privacy
- ❌ Abuse monitoring access

### Communication

**Do:**
- ✅ Be professional
- ✅ Be clear and concise
- ✅ Respond promptly
- ✅ Be helpful
- ✅ Document communications

**Don't:**
- ❌ Be rude or dismissive
- ❌ Ignore messages
- ❌ Share confidential info
- ❌ Be biased

---

## FAQ

### General

**Q: How do I become an admin?**  
A: Admin accounts are created by system administrators. Contact IT support.

**Q: Can I change my admin password?**  
A: Yes, go to Settings → Security → Change Password.

**Q: Can I access admin panel on mobile?**  
A: Yes, but desktop is recommended.

### Tutor Verification

**Q: How long should verification take?**  
A: Aim for 1-3 business days.

**Q: What if applicant reapplies after rejection?**  
A: Review new application. If improvements made, can approve.

**Q: What if tutor's performance declines?**  
A: Monitor feedback. Can deactivate if serious issues. Communicate with tutor first.

### User Management

**Q: Can I delete user accounts?**  
A: No, only activate/deactivate. Contact system administrator for deletions.

**Q: What happens to user's sessions when deactivated?**  
A: Active and pending sessions are cancelled. Completed sessions remain in history.

**Q: Can I change user roles?**  
A: Not through admin panel. Use SQL script `change-user-role.sql` or contact system administrator.

### Resources

**Q: How long should resource approval take?**  
A: Aim for 1-2 business days.

**Q: Can I edit approved resources?**  
A: No, only approve/reject. Tutor must upload new version.

**Q: What file types are allowed?**  
A: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, XLS, XLSX, CSV, code files.

**Q: What's the file size limit?**  
A: 10MB per file.

### Live Monitoring

**Q: Can participants see I'm monitoring?**  
A: No, monitoring is invisible.

**Q: Can I join session as participant?**  
A: No, monitoring is view-only.

**Q: Can I record monitored sessions?**  
A: No, recording is not available.

### Announcements

**Q: Can I edit announcements?**  
A: No, only create and delete. Create new announcement if changes needed.

**Q: Do announcements expire?**  
A: Currently no automatic expiration. Delete manually when no longer relevant.

**Q: Who sees announcements?**  
A: All users (learners, tutors, admins).

---

## b Process of reviewing tutor applications

**Live Monitoring** - Real-time observation of active sessions

**Session Log** - Detailed record of session activity

**Deactivate/Suspend** - Temporarily preventing user from accessing the system (same thing, different terms)

**Activate/Reactivate** - Restoring user access after deactivation

**Resource Approval** - Review and approval of learning materials

**Announcement** - Platform-wide message to users

---

## Document Information

**Version:** 2.0  
**Last Updated:** November 2025  
**Platform:** TechConnect - CIT Peer Tutoring  
**Institution:** Southern Luzon State University  
**College:** College of Industrial Technology

**Support:**
- System Issues: Contact IT Administrator
- Policy Questions: Contact CIT Administration
- Technical Support: cit-techconnect-support@slsu.edu.ph

---

## Changelog

**Version 2.0 (November 2025):**
- ✅ Verified all features against actual admin pages
- ✅ Removed non-existent features (role change, suspend, bulk actions, edit announcements, export reports, keyboard shortcuts)
- ✅ Added accurate descriptions of actual features
- ✅ Corrected user management (only activate/deactivate)
- ✅ Corrected announcements (only create/delete)
- ✅ Added pagination details
- ✅ Separated from user manual
- ✅ Improved accuracy

**Version 1.0 (November 2024):**
- Initial release

---

**End of Administrator Manual**

*For learner and tutor documentation, see [USER-MANUAL-UPDATED.md](USER-MANUAL-UPDATED.md)*

