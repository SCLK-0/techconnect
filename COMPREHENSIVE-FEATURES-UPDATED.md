# TechConnect - Complete Feature List (Updated)

**Last Updated:** November 24, 2025  
**Based on:** Actual codebase analysis

---

## 🎯 **CORE FEATURES**

### **1. User Management & Authentication**
- Email/password registration with email verification (Supabase Auth)
- Role-based access control (Admin, Tutor, Learner)
- Profile management with avatar upload (Supabase Storage)
- Year level tracking (1st-4th year)
- Subject expertise/interests selection (array fields)
- Password reset via email (Resend API)

### **2. Tutor Features**

#### Profile & Status
- Tutor approval workflow (pending/approved/rejected)
- Online/offline status toggle for instant sessions
- Bio and subject expertise management
- Donation QR code upload (GCash, PayMaya)
- Profile visibility controls

#### Availability Management
- Weekly recurring schedule (tutor_availability table)
- Date-specific availability overrides (tutor_day_availability)
- Time slot management with start/end times
- Automatic cleanup of past time slots

#### Session Management
- View pending session requests
- Accept/reject requests with reasons
- Session history tracking
- Cancel sessions with cancellation reasons
- Track session status (waiting, in_progress, completed, cancelled, missed)

#### Resources & Content
- Upload learning materials (with admin approval)
- Organize resources by subject
- Track download counts
- Share session notes and materials

#### Analytics & Feedback
- Dashboard with statistics:
  - Total/completed/pending sessions
  - Average rating & review count
  - Total donations received
- View detailed feedback with rating tags
- Track learner progress
- Session logs and documentation

### **3. Learner Features**

#### Tutor Discovery
- Browse all approved tutors
- **Fuzzy search** for approximate matching
- Filter by:
  - Subject expertise
  - Online status
  - Rating (minimum threshold)
  - Year level
  - Previously booked tutors
- **Favorite/bookmark tutors** for quick access
- View tutor profiles with ratings and tags

#### Session Booking
- **Two session types:**
  - **Scheduled sessions:** Book specific date/time
  - **Instant sessions:** On-demand (10-30 minutes)
- View tutor availability calendar
- Select time slots
- Add session details and requirements
- Reschedule existing sessions

#### Session Management
- View upcoming sessions
- View past session history
- Cancel sessions with reasons
- Track session status
- Receive real-time notifications

#### Feedback & Ratings
- Rate tutors (1-5 stars)
- Write detailed reviews
- **Add rating tags:**
  - clear_explanations
  - great_communication
  - always_on_time
  - patient_friendly
  - very_knowledgeable
  - helped_improve
  - well_prepared
  - engaging_session
  - good_examples
  - responsive

#### Resources
- Access learning materials uploaded by tutors
- Download session materials
- Bookmark resources
- View resource previews

### **4. Video Session Features (WebRTC + PeerJS)**

#### Core Video Technology
- **PeerJS library** for WebRTC peer-to-peer connections
- **Custom PeerJS server** configuration
- Peer ID management (stored in sessions table)
- Automatic peer connection retry logic
- Connection health monitoring (ping interval: 5000ms)

#### Session Flow
- **Waiting room system:**
  - Learner joins and waits
  - Tutor admits learner to session
  - Admin can monitor without admission
- **Device testing modal:**
  - Camera preview
  - Microphone test
  - Audio visualizer
  - Device selector (multiple cameras/mics)

#### Video Controls
- Camera on/off toggle
- Microphone mute/unmute
- Screen sharing (entire screen, window, or tab)
- Video quality adjustment
- Audio visualizer for active speaker
- Picture-in-picture mode support

#### Interactive Whiteboard
- **Fabric.js-based canvas**
- **Drawing tools:**
  - Pen (freehand drawing)
  - Eraser
  - Shapes (rectangle, circle, triangle, line, arrow)
  - Text tool
  - Color picker
  - Brush size adjustment
- **Whiteboard features:**
  - Undo/redo functionality
  - Clear canvas
  - Save whiteboard as image
  - **Persistent state** (survives reconnections)
  - Real-time synchronization via Supabase Realtime
  - Whiteboard refresh button
- **Database storage:**
  - Canvas state stored as JSONB
  - Automatic save on changes
  - Load previous state on reconnection

#### In-Session Communication
- **Real-time chat:**
  - Text messaging
  - Message history
  - Timestamp display
  - Stored in session_messages table
- **File sharing:**
  - Upload files during session
  - Download shared files
  - File metadata tracking
  - Stored in session_assets table
  - Supported formats: PDF, DOC, images, etc.

#### Session Management
- **Session timer** with elapsed time display
- **Session logs:**
  - Topics covered
  - Accomplishments
  - Homework assigned
  - Next steps
  - Stored in session_logs table
- **Disconnect tracking:**
  - Reason for disconnection
  - Auto-reconnection attempts
  - Disconnect warnings
- **Session end flow:**
  - Proper cleanup of media tracks
  - Peer connection closure
  - Automatic page reload to stop camera
  - Feedback modal for learners

#### Admin Monitoring
- **Live session monitoring:**
  - View active sessions in real-time
  - Monitor peer ID for admin
  - Receive streams from both tutor and learner
  - No admission required
  - View whiteboard state
  - Read chat messages
  - Access session logs

### **5. Admin Features**

#### Dashboard & Analytics
- Platform statistics:
  - Total users (learners, tutors, admins)
  - Pending tutor approvals
  - Active sessions count
  - Total sessions
- User growth metrics
- Session statistics
- Popular subjects tracking
- Revenue/donation tracking

#### User Management
- View all users with role filtering
- Edit user information
- Suspend/activate accounts
- Delete users (with confirmation)
- View user activity history
- Search and filter users

#### Tutor Approval Workflow
- Review tutor applications
- View qualifications and bio
- Approve with notification
- Reject with reason
- Re-approve rejected tutors
- Track approval history

#### Session Monitoring
- View all sessions (past, active, upcoming)
- **Live session monitoring** (real-time)
- Filter by:
  - Status (pending, accepted, completed, etc.)
  - Date range
  - Tutor or learner
  - Session type
- View session logs and documentation
- Access session chat history
- Monitor session quality

#### Resource Management
- Review uploaded materials
- Approve/reject resources
- Organize by category/subject
- Delete inappropriate content
- Track download statistics
- Preview resources

#### Announcement System
- Create announcements
- Set expiration dates
- Target specific audiences:
  - All users
  - Learners only
  - Tutors only
- Edit/delete announcements
- Track announcement views

#### Donation Tracking
- View all donation transactions
- Track platform fees
- Generate financial reports
- Monitor tutor earnings
- Export donation data

### **6. Notification System**

#### Real-time Notifications (Supabase Realtime)
- **Notification types:**
  - New session requests
  - Session accepted/rejected
  - Session reminders
  - Tutor approval status
  - New announcements
  - Instant session requests
  - Admin monitoring alerts
- **Notification features:**
  - In-app notification bell
  - Unread count badge
  - Mark as read functionality
  - Notification history
  - Real-time updates without refresh

#### Email Notifications (Resend API)
- Email confirmation on registration
- Password reset emails
- Session confirmation emails
- Session reminder emails
- Tutor approval/rejection emails
- Custom email templates with branding

### **7. Automated Systems**

#### Session Management
- **Auto-mark missed sessions:**
  - Pending sessions: 15 min grace period
  - Accepted sessions: 20 min grace period
  - Updates status to 'missed'
- **Auto-cleanup past time slots:**
  - Removes expired availability slots
  - Keeps calendar clean
  - Runs periodically

#### Database Functions
- `get_tutor_rating()` - Calculate average ratings
- `get_tutor_stats()` - Aggregate tutor statistics
- `reject_session_with_reason()` - Handle rejections
- `cancel_session_with_reason()` - Handle cancellations
- `mark_missed_sessions()` - Auto-mark no-shows
- `increment_resource_downloads()` - Track downloads
- `get_tutor_rating_tags()` - Aggregate rating tags
- `is_tutor_favorited()` - Check favorite status
- `get_favorite_tutors()` - Retrieve favorites with details

#### Triggers
- `create_tutor_profile_on_confirmation` - Auto-create profiles
- `create_learner_profile_on_confirmation` - Auto-create profiles
- `notify_new_session` - Send notifications
- `notify_session_status_change` - Status updates
- `notify_tutor_approval` - Approval notifications
- `notify_new_announcement` - Announcement broadcasts
- `update_updated_at_column` - Timestamp updates

### **8. Additional Features**

#### User Interface
- **Responsive design** (mobile-friendly)
- **Dark mode support** (system preference detection)
- Loading states and skeletons
- Error handling with toast notifications
- Pagination for large lists
- Search and filtering across pages
- Breadcrumb navigation
- Sidebar navigation with role-based menus

#### Security
- Row Level Security (RLS) policies on all tables
- Secure authentication with Supabase
- Input validation and sanitization
- XSS prevention
- SQL injection prevention (parameterized queries)
- Secure file uploads with type validation
- HTTPS enforcement

#### Performance
- Optimized database queries with indexes
- Lazy loading of components
- Image optimization
- Caching strategies
- Real-time subscriptions cleanup
- Efficient state management

#### Accessibility
- Keyboard navigation support
- ARIA labels
- Screen reader friendly
- Focus management
- Color contrast compliance

---

## 🔧 **TECHNICAL STACK**

### **Frontend**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Hooks + Context API
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Date Handling:** date-fns
- **Icons:** Lucide React

### **Backend**
- **BaaS:** Supabase
  - PostgreSQL database
  - Authentication
  - Realtime subscriptions
  - Storage (file uploads)
  - Edge Functions
  - Row Level Security (RLS)

### **Video & Real-time**
- **WebRTC:** Peer-to-peer video/audio
- **PeerJS:** WebRTC wrapper library
  - Custom PeerJS server configuration
  - Peer ID management
  - Connection retry logic
  - Ping interval: 5000ms
- **Whiteboard:** Fabric.js canvas library
- **Real-time Sync:** Supabase Realtime channels

### **Email**
- **Service:** Resend API
- **Domain:** cit-techconnect.org
- **Templates:** Custom HTML email templates

### **Deployment**
- **Hosting:** Vercel
- **Domain:** cit-techconnect.org
- **Environment:** Production
- **CI/CD:** Automatic deployment on push

### **Development Tools**
- **Version Control:** Git + GitHub
- **Package Manager:** npm
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **Code Formatting:** Prettier (via IDE)

---

## 📊 **DATABASE SCHEMA**

### **Core Tables**
- `profiles` - User profiles (all users)
- `user_roles` - Role assignments (admin, tutor, learner)
- `learner_profiles` - Learner-specific data
- `tutor_profiles` - Tutor-specific data (with donation_qr_code)

### **Session Tables**
- `sessions` - Main sessions table
  - Includes: tutor_peer_id, learner_peer_id
  - Status tracking: pending, accepted, completed, cancelled, missed
  - Session type: scheduled, instant
  - Rejection/cancellation reasons
  - Disconnect tracking
- `session_messages` - In-session chat
- `session_assets` - Shared files
- `session_logs` - Session documentation
- `whiteboard_states` - Persistent whiteboard data (JSONB)

### **Availability Tables**
- `tutor_availability` - Weekly recurring schedule
- `tutor_day_availability` - Date-specific overrides (with time slots)

### **Feedback & Ratings**
- `feedback` - Session ratings and reviews
- `feedback_tags` - Rating tags (enum type)
- `favorite_tutors` - Bookmarked tutors

### **Content Tables**
- `resources` - Learning materials
- `announcements` - Platform announcements
- `notifications` - User notifications

### **Financial**
- `donations` - Donation tracking

---

## 🎨 **KEY FEATURES SUMMARY**

### **What Makes TechConnect Unique**

1. **Dual Session Types:** Scheduled + Instant on-demand
2. **Interactive Whiteboard:** Real-time collaboration with persistence
3. **Rating Tags:** Descriptive feedback beyond stars
4. **Favorite Tutors:** Quick access to preferred tutors
5. **Waiting Room:** Controlled session admission
6. **Admin Monitoring:** Live session oversight
7. **Fuzzy Search:** Approximate matching for better discovery
8. **Donation System:** QR code-based voluntary contributions
9. **Comprehensive Feedback:** Multi-dimensional tutor evaluation
10. **Automated Session Management:** Auto-mark missed, cleanup slots

---

## 📝 **FEATURES NOT IMPLEMENTED**

For transparency, here's what was mentioned in planning but not implemented:

❌ Google Calendar integration (uses built-in scheduling)  
❌ Google Meet integration (uses WebRTC + PeerJS)  
❌ Study Buddy vs Learning Buddy roles (only Tutor/Learner)  
❌ Tutor certificates (not implemented)  
❌ Resume-building features (not implemented)  
❌ Session recording (not implemented)  
❌ Native mobile apps (web-responsive only)  
❌ Offline access (requires internet)  
❌ Push notifications (in-app only)  
❌ Payment gateway integration (QR code donations only)  
❌ Automated content moderation (manual admin approval)  

---

**Document Version:** 2.0  
**Last Updated:** November 24, 2025  
**Based On:** Complete codebase analysis including PeerJS implementation
