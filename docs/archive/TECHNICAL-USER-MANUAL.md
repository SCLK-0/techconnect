# TechConnect - Technical User Manual
## For IT Experts and System Administrators

**Version**: 1.0  
**Last Updated**: November 2025  
**Platform**: Web Application  
**URL**: [Your Vercel URL]

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Admin Functions](#admin-functions)
5. [Tutor Functions](#tutor-functions)
6. [Learner Functions](#learner-functions)
7. [Video Session Features](#video-session-features)
8. [Security & Privacy](#security--privacy)
9. [Troubleshooting](#troubleshooting)
10. [Technical Specifications](#technical-specifications)

---

## System Overview

TechConnect is a peer-to-peer tutoring platform that connects students who need academic help with qualified peer tutors. The system features real-time video sessions, scheduling, resource sharing, and administrative oversight.

### Key Features
- ✅ Real-time video conferencing with screen sharing
- ✅ Interactive whiteboard for collaborative learning
- ✅ Flexible scheduling with availability management
- ✅ Resource library for study materials
- ✅ Admin approval workflow for tutors
- ✅ Real-time notifications
- ✅ Session feedback and ratings
- ✅ Analytics dashboard

### System Requirements
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Internet**: Minimum 5 Mbps for video sessions
- **Camera/Microphone**: Required for video sessions
- **Screen Resolution**: Minimum 1280x720 (responsive design)

**[PHOTO: Dashboard overview showing the main interface]**

---

## Getting Started

### Account Registration

#### For Learners
1. Navigate to the TechConnect homepage
2. Click "Get Started" or "Sign Up"
3. Select "I'm a Learner"
4. Fill in the registration form:
   - Full Name
   - Email Address (institutional email recommended)
   - Password (min 8 chars, uppercase, lowercase, number, special char)
   - Year Level (1st-4th Year)
   - Subjects of Interest
5. Click "Create Account"
6. Check your email for verification link
7. Click the verification link
8. Log in with your credentials

**[PHOTO: Learner registration form]**

#### For Tutors
1. Navigate to the TechConnect homepage
2. Click "Get Started" or "Sign Up"
3. Select "I'm a Tutor"
4. Fill in the registration form:
   - Full Name
   - Email Address
   - Password
   - Year Level (1st-4th Year)
   - Subject Expertise (select multiple)
   - Bio/Introduction (min 10 characters)
5. Click "Create Account"
6. Check your email for verification link
7. Click the verification link
8. Wait for admin approval (you'll receive a notification)
9. Once approved, log in and start tutoring

**[PHOTO: Tutor registration form with subject selection]**

### First Login
1. Enter your email and password
2. Click "Sign In"
3. You'll be redirected to your role-specific dashboard

**[PHOTO: Login page]**

---

## User Roles & Permissions

### Admin
**Access Level**: Full system access

**Permissions**:
- Approve/reject tutor applications
- View all users, sessions, and resources
- Manage announcements
- Access analytics and reports
- Monitor live sessions
- Manage donations
- Override user settings if needed

### Tutor (Approved)
**Access Level**: Own profile + assigned sessions

**Permissions**:
- Set availability schedule
- Accept/reject session requests
- Start instant sessions when online
- Upload resources to library
- View own tutees and feedback
- Update profile and expertise

### Learner
**Access Level**: Own profile + booked sessions

**Permissions**:
- Browse approved tutors
- Book scheduled sessions
- Request instant sessions
- View resources
- Provide feedback after sessions
- Manage own profile

**[PHOTO: Role comparison chart or dashboard views]**

---

## Admin Functions

### Accessing Admin Dashboard
1. Log in with admin credentials
2. You'll see the Admin Dashboard with key metrics

**[PHOTO: Admin dashboard with statistics]**

### Approving Tutor Applications
1. Click "Approvals" in the sidebar
2. View pending tutor applications
3. Review tutor details:
   - Name and year level
   - Subject expertise
   - Bio/qualifications
4. Click "Approve" to activate the tutor
5. Click "Reject" to deny the application
6. Tutor receives automatic notification

**[PHOTO: Tutor approval interface]**

### Managing Users
1. Click "Users" in the sidebar
2. View all registered users
3. Filter by role (Admin/Tutor/Learner)
4. Filter by year level
5. Search by name or email
6. View user details and activity

**[PHOTO: User management table]**

### Monitoring Live Sessions
1. Click "Live Monitoring" in the sidebar
2. View all active sessions in real-time
3. See session details:
   - Tutor and learner names
   - Subject
   - Duration
   - Status
4. Click on a session to view more details

**[PHOTO: Live monitoring dashboard]**

### Managing Resources
1. Click "Resources" in the sidebar
2. View all uploaded resources
3. Filter by status (Pending/Approved/Rejected)
4. Review resource details
5. Approve or reject resources
6. Delete inappropriate content

**[PHOTO: Resource management interface]**

### Creating Announcements
1. Click "Announcements" in the sidebar
2. Click "Create Announcement"
3. Enter title and content
4. Set expiration date (optional)
5. Click "Post Announcement"
6. All users receive notification

**[PHOTO: Announcement creation form]**

### Viewing Analytics
1. Click "Analytics" in the sidebar
2. View platform statistics:
   - Total users by role
   - Session statistics
   - Popular subjects
   - Tutor performance
   - Resource downloads
3. Export reports if needed

**[PHOTO: Analytics dashboard with charts]**

---

## Tutor Functions

### Setting Up Your Profile
1. Log in to your tutor account
2. Click "Profile" in the sidebar
3. Update your information:
   - Profile picture
   - Bio
   - Subject expertise
4. Click "Save Changes"

**[PHOTO: Tutor profile edit page]**


### Managing Availability

#### Setting Weekly Schedule
1. Click "Availability" in the sidebar
2. Under "Weekly Recurring Schedule":
   - Select day of week
   - Set start time
   - Set end time
   - Click "Add Time Slot"
3. Repeat for all your available time slots
4. Toggle slots on/off as needed
5. Delete slots you no longer need

**[PHOTO: Weekly schedule interface]**

#### Setting Day-Specific Availability
1. In the "Day-Specific Availability" section
2. Choose mode:
   - **Set Time Slots**: Click a date to set specific hours
   - **Bulk Actions**: Select multiple dates to mark available/unavailable
3. For time slots:
   - Click a date on the calendar
   - Enter start and end time
   - Click "Save Time Slot"
4. For bulk actions:
   - Click multiple dates
   - Click "Mark Available" or "Mark Unavailable"

**[PHOTO: Calendar with availability settings]**

### Managing Sessions

#### Viewing Session Requests
1. Click "Sessions" in the sidebar
2. View pending session requests
3. Click on a session to see details
4. Click "Accept" or "Reject"

**[PHOTO: Session requests list]**

#### Starting an Instant Session
1. Set your status to "Online" in the dashboard
2. Wait for instant session requests
3. Accept incoming requests
4. Session starts immediately

### Viewing Your Tutees
1. Click "My Learners" in the sidebar
2. View all students you've tutored
3. Filter by year level or search by name
4. See session history with each learner
5. View feedback they've provided

**[PHOTO: Tutees list with filters]**

### Uploading Resources
1. Click "Resources" in the sidebar
2. Click "Upload Resource"
3. Fill in details:
   - Title
   - Description
   - Select file (PDF, DOC, PPT, etc.)
4. Click "Upload"
5. Wait for admin approval

**[PHOTO: Resource upload form]**

### Viewing Feedback
1. Click "Learner Feedback" in the sidebar
2. View all feedback from your sessions
3. Filter by rating or year level
4. Use feedback to improve your tutoring

**[PHOTO: Feedback display with ratings]**

---

## Learner Functions

### Finding Tutors

#### Browsing Available Tutors
1. Click "Find Tutors" in the sidebar
2. View all approved tutors
3. See tutor information:
   - Name and year level
   - Subject expertise
   - Bio
   - Rating and reviews
   - Online status
   - Next available time
4. Use filters:
   - Search by name or subject
   - Filter by online status
   - Filter by rating
   - Filter by subject expertise

**[PHOTO: Tutor browsing interface with filters]**

#### Viewing Tutor Details
1. Click on a tutor card
2. View detailed profile:
   - Full bio
   - All subject expertise
   - Ratings and review count
   - Availability
3. Choose to book or start instant session

**[PHOTO: Tutor detail modal]**

### Booking Sessions

#### Scheduled Session
1. Find a tutor and click "Book Session"
2. Fill in session details:
   - Subject
   - Preferred date and time
   - Duration (30, 60, 90, or 120 minutes)
   - Additional notes
3. Click "Send Request"
4. Wait for tutor to accept
5. Receive notification when accepted

**[PHOTO: Session booking form]**

#### Instant Session
1. Find an online tutor (green "Online" badge)
2. Click "Start Instant Session"
3. Select subject
4. Click "Request Session"
5. Wait for tutor to accept (usually within 1 minute)
6. Session starts immediately when accepted

**[PHOTO: Instant session request dialog]**

### Managing Your Sessions
1. Click "Sessions" in the sidebar
2. View all your sessions:
   - Upcoming sessions
   - Pending requests
   - Completed sessions
   - Cancelled sessions
3. Click on a session to:
   - View details
   - Join video session (when time comes)
   - Cancel (if needed)

**[PHOTO: Session management interface]**

### Providing Feedback
1. After a completed session, you'll see a feedback prompt
2. Rate the session (1-5 stars)
3. Write a comment (optional)
4. Click "Submit Feedback"
5. Feedback helps improve tutor quality

**[PHOTO: Feedback form]**

### Browsing Resources
1. Click "Resources" in the sidebar
2. Browse approved study materials
3. Filter by subject or search
4. Click "Download" to get the file
5. Resources are uploaded by tutors

**[PHOTO: Resource library]**

---

## Video Session Features

### Joining a Session
1. When it's time for your session, go to "Sessions"
2. Click "Join Session" on the active session
3. Allow camera and microphone permissions
4. Wait for the other participant to join

**[PHOTO: Session waiting room]**

### Video Controls
- **Camera**: Toggle video on/off
- **Microphone**: Toggle audio on/off
- **Screen Share**: Share your screen
- **Whiteboard**: Open collaborative whiteboard
- **Chat**: Send text messages
- **Files**: Share files
- **End Session**: Leave the session

**[PHOTO: Video session interface with controls]**

### Using the Whiteboard
1. Click the "Whiteboard" button
2. Tools available:
   - Pen (draw freehand)
   - Eraser
   - Text
   - Shapes (rectangle, circle, line)
   - Color picker
   - Clear all
3. Both participants can draw simultaneously
4. Changes sync in real-time

**[PHOTO: Whiteboard in use]**

### Screen Sharing
1. Click "Share Screen"
2. Select which screen/window to share
3. Click "Share"
4. Click "Stop Sharing" when done
5. Only one person can share at a time

**[PHOTO: Screen sharing selection]**

### Chat and File Sharing
1. Click the chat icon
2. Type messages and press Enter
3. To share files:
   - Click the file icon
   - Select file from your computer
   - File appears in chat for download

**[PHOTO: Chat panel with file sharing]**

### Session Documentation
1. During or after session, click "Session Log"
2. Document:
   - Topics covered
   - Accomplishments
   - Homework assigned
   - Next steps
3. Both tutor and learner can add logs
4. Logs are saved for future reference

**[PHOTO: Session log form]**

---

## Security & Privacy

### Account Security
- **Strong Passwords**: System enforces password complexity
- **Email Verification**: Required before account activation
- **Session Tokens**: Automatically expire after inactivity
- **Secure Storage**: Passwords are hashed, never stored in plain text

### Data Privacy
- **Personal Information**: Only visible to relevant parties
- **Session Data**: Only participants can access session details
- **File Storage**: Uploaded files are access-controlled
- **No Third-Party Tracking**: We don't share data with advertisers

### Best Practices
1. **Never share your password** with anyone
2. **Log out** when using shared computers
3. **Verify tutor profiles** before booking sessions
4. **Report suspicious activity** to administrators
5. **Keep your profile updated** with accurate information

### Reporting Issues
If you encounter security concerns:
1. Click your profile menu
2. Select "Report Issue"
3. Describe the problem
4. Admin will investigate immediately

---

## Troubleshooting

### Cannot Log In
**Problem**: "Invalid credentials" error

**Solutions**:
1. Verify email and password are correct
2. Check if email is verified (check spam folder)
3. Try "Forgot Password" to reset
4. Contact admin if account is locked

### Video Not Working
**Problem**: Camera/microphone not detected

**Solutions**:
1. Check browser permissions (click lock icon in address bar)
2. Ensure no other app is using camera/microphone
3. Try refreshing the page
4. Try a different browser (Chrome recommended)
5. Check if camera/microphone works in other apps

### Cannot Join Session
**Problem**: "Failed to connect" error

**Solutions**:
1. Check your internet connection
2. Refresh the page
3. Ensure you're joining at the correct time
4. Check if the other participant has joined
5. Try using a different network (disable VPN if active)

### Whiteboard Not Syncing
**Problem**: Changes not appearing for other participant

**Solutions**:
1. Check internet connection
2. Refresh the page
3. Both participants should refresh
4. Try closing and reopening whiteboard

### Notifications Not Appearing
**Problem**: Not receiving notifications

**Solutions**:
1. Check browser notification permissions
2. Ensure you're logged in
3. Check notification settings in your profile
4. Try logging out and back in

### Slow Performance
**Problem**: App is laggy or slow

**Solutions**:
1. Close unnecessary browser tabs
2. Check internet speed (minimum 5 Mbps)
3. Clear browser cache
4. Try a different browser
5. Restart your computer

### File Upload Failed
**Problem**: Cannot upload resources

**Solutions**:
1. Check file size (max 50MB)
2. Verify file type is supported
3. Check internet connection
4. Try a different file format
5. Contact admin if problem persists

---

## Technical Specifications

### System Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel (Frontend) + Supabase Cloud (Backend)
- **Real-time**: WebRTC (PeerJS) + Supabase Realtime
- **Domain**: Vercel subdomain (future: Squarespace custom domain)

### Browser Compatibility
| Browser | Minimum Version | Recommended |
|---------|----------------|-------------|
| Chrome  | 90+            | Latest      |
| Firefox | 88+            | Latest      |
| Safari  | 14+            | Latest      |
| Edge    | 90+            | Latest      |

### Network Requirements
- **Minimum**: 5 Mbps download, 2 Mbps upload
- **Recommended**: 10 Mbps download, 5 Mbps upload
- **Latency**: < 100ms for optimal video quality

### Database
- **Type**: PostgreSQL 15
- **Security**: Row Level Security (RLS) enabled
- **Backups**: Daily automated backups
- **Capacity**: 500MB (expandable to 8GB)

### File Storage
- **Supported Formats**: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG
- **Max File Size**: 50MB per file
- **Storage Limit**: 1GB total (expandable)

### API Rate Limits
- **Authentication**: 30 requests per hour per IP
- **Database Queries**: 10,000 requests per hour
- **File Uploads**: 100 uploads per hour per user
- **Real-time Connections**: 500 concurrent connections

### Security Features
- **Encryption**: TLS 1.3 for all traffic
- **Authentication**: JWT tokens with 7-day expiry
- **Password Hashing**: bcrypt with salt
- **SQL Injection**: Prevented via parameterized queries
- **XSS Protection**: React's built-in sanitization
- **CORS**: Restricted to application domain

---

## Support & Contact

### For Technical Issues
- **Email**: [your-support-email]
- **Response Time**: Within 24 hours

### For Feature Requests
- Submit via the feedback form in your profile menu

### For Security Concerns
- **Email**: [your-security-email]
- **Response Time**: Within 4 hours

---

## Appendix

### Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Toggle Camera | Ctrl/Cmd + E |
| Toggle Microphone | Ctrl/Cmd + D |
| Open Chat | Ctrl/Cmd + M |
| Open Whiteboard | Ctrl/Cmd + W |
| End Session | Ctrl/Cmd + L |

### Glossary
- **Instant Session**: Immediate tutoring session with online tutor
- **Scheduled Session**: Pre-booked session at specific time
- **RLS**: Row Level Security - database access control
- **WebRTC**: Web Real-Time Communication - peer-to-peer video
- **Peer-to-Peer**: Direct connection between users (no server middleman)

### Version History
- **v1.0** (November 2025): Initial release

---

**End of Manual**

For the latest updates and documentation, visit: [Your Documentation URL]
