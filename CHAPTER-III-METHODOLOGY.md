# CHAPTER III: METHODOLOGY

## 3.1 System Development Methodology

### 3.1.1 Agile-Kanban Approach

The TechConnect system was developed using an Agile-Kanban methodology, which combines the iterative nature of Agile development with the visual workflow management of Kanban. This approach was selected for its flexibility in handling changing requirements and its emphasis on continuous delivery.

**Key Characteristics:**
- **Iterative Development:** Features were developed in 7 sprints over 7 weeks
- **Visual Workflow:** Kanban board tracked tasks through stages (Backlog → In Progress → Review → Done)
- **Continuous Integration:** Features were integrated and tested continuously
- **Client Feedback Loops:** Regular feedback from IT experts and clients shaped development
- **Adaptive Planning:** Requirements evolved based on testing and stakeholder input

**Sprint Structure:**
- **Sprints 1-4 (Oct 7 - Nov 4):** Core feature development
- **Sprints 5-6 (Nov 5-18):** IT expert-driven revisions
- **Sprint 7 (Nov 19-23):** Client-driven enhancements

### 3.1.2 Technology Stack

**Frontend Framework:**
- **React 18.3.1** with TypeScript for type-safe component development
- **Vite 5.4.19** as the build tool for fast development and optimized production builds
- **React Router DOM 6.30.1** for client-side routing

**Backend Services:**
- **Supabase** as Backend-as-a-Service (BaaS) providing:
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication and user management
  - Real-time subscriptions
  - Edge Functions for serverless operations
  - File storage for avatars and resources

**Real-time Communication:**
- **PeerJS 1.5.5** wrapping WebRTC for peer-to-peer video connections
- **Fabric.js 6.7.1** for interactive whiteboard functionality
- **Supabase Realtime** for chat, notifications, and state synchronization

**UI Component Library:**
- **Radix UI** primitives (30+ components) for accessible, unstyled components
- **Tailwind CSS 3.4.17** for utility-first styling
- **shadcn/ui** component patterns for consistent design system
- **Lucide React** for iconography

**Form Management & Validation:**
- **React Hook Form 7.61.1** for performant form handling
- **Zod 3.25.76** for schema validation and type inference

**Deployment:**
- **Vercel** for hosting with automatic CI/CD
- **Custom Domain:** cit-techconnect.org (via Squarespace)
- **SSL/HTTPS** automatically managed

### 3.1.3 Development Environment

**Version Control:**
- Git for source control
- GitHub for repository hosting
- Feature branch workflow

**Code Quality:**
- TypeScript strict mode for type safety
- ESLint for code linting
- Consistent code formatting standards

**Testing Approach:**
- Manual testing during development
- User acceptance testing with stakeholders
- Cross-browser compatibility testing
- Responsive design testing across devices

---

## 3.2 System Architecture

### 3.2.1 Architectural Pattern

TechConnect follows a **Client-Server Architecture** with **Real-time Communication** capabilities:

**Client Layer (React SPA):**
- Single Page Application (SPA) running in the browser
- Handles UI rendering, user interactions, and client-side routing
- Manages local state and real-time subscriptions
- Establishes peer-to-peer connections for video sessions

**Server Layer (Supabase):**
- PostgreSQL database with Row Level Security
- RESTful API (PostgREST) for database operations
- Real-time WebSocket server for subscriptions
- Edge Functions for serverless operations (email notifications)
- Object storage for files

**Peer-to-Peer Layer (WebRTC):**
- Direct browser-to-browser connections for video/audio
- Signaling through Supabase database
- STUN/TURN servers for NAT traversal

### 3.2.2 Database Design

The database schema consists of 15 main tables organized into logical domains:

**Authentication & Users:**
- `auth.users` - Supabase authentication
- `profiles` - User profile information
- `user_roles` - Role assignments (admin, tutor, learner)

**User Profiles:**
- `learner_profiles` - Learner-specific data
- `tutor_profiles` - Tutor-specific data including expertise and status

**Session Management:**
- `sessions` - Core session records
- `session_messages` - In-session chat
- `session_assets` - Shared files
- `session_logs` - Session documentation
- `whiteboard_states` - Persistent whiteboard data

**Scheduling:**
- `tutor_availability` - Weekly recurring schedules
- `tutor_day_availability` - Date-specific overrides

**Feedback & Engagement:**
- `feedback` - Session ratings and reviews
- `feedback_tags` - Descriptive rating tags
- `favorite_tutors` - Bookmarked tutors

**Content & Communication:**
- `resources` - Learning materials
- `announcements` - Platform announcements
- `notifications` - User notifications

**Financial:**
- `donations` - Donation tracking

### 3.2.3 Security Architecture

**Row Level Security (RLS):**
- All tables protected with RLS policies
- Users can only access their own data
- Role-based access control for admin functions

**Authentication Security:**
- Email verification required
- Secure password hashing (bcrypt)
- JWT tokens for session management
- Protected routes on client side

**Data Validation:**
- Zod schemas validate all user inputs
- Type checking with TypeScript
- SQL injection prevention through parameterized queries
- XSS prevention through React's built-in escaping

---

## 3.3 System Features and Processes

### 3.3.1 User Authentication and Authorization

**Registration Process:**
1. User provides email, password, full name, and role
2. System validates input using Zod schema
3. Supabase creates auth user and sends verification email
4. User profile and role-specific profile created in database
5. User redirected to email verification page

**Login Process:**
1. User provides email and password
2. Supabase validates credentials
3. System retrieves user role from database
4. User redirected to role-appropriate dashboard
5. Session token stored for subsequent requests

**Role-Based Access:**
- **Admin:** Full system access, user management, monitoring
- **Tutor:** Session management, availability, resources
- **Learner:** Browse tutors, book sessions, provide feedback

*See diagrams/01-authentication-diagrams.md for detailed UML diagrams*

### 3.3.2 Session Management

**Session Types:**

**1. Scheduled Sessions:**
- Learner browses available tutors
- Selects tutor, subject, date, and time
- System creates session request with "pending" status
- Tutor receives notification and can accept/reject
- If accepted, both parties receive confirmation
- Session appears in both calendars

**2. Instant Sessions:**
- Learner requests immediate session
- System notifies all online tutors in subject area
- First tutor to accept gets the session
- Session starts immediately upon acceptance

**Session Lifecycle States:**
- `pending` - Awaiting tutor response
- `accepted` - Tutor confirmed, scheduled
- `rejected` - Tutor declined with reason
- `in_progress` - Currently active
- `completed` - Successfully finished
- `cancelled` - Cancelled by either party
- `missed` - No-show detected

**Session Operations:**
- **Accept:** Tutor confirms session request
- **Reject:** Tutor declines with mandatory reason
- **Reschedule:** Learner requests new date/time
- **Cancel:** Either party cancels with reason
- **Auto-mark Missed:** System automatically marks no-shows

*See diagrams/02-session-management-diagrams.md for detailed UML diagrams*

### 3.3.3 Video Session Infrastructure

**Session Initialization:**
1. Learner joins session and enters waiting room
2. System generates unique peer ID for learner
3. Tutor receives notification of waiting learner
4. Tutor admits learner to session
5. WebRTC peer connection established
6. Video/audio streams exchanged

**Real-time Features:**

**Video/Audio Communication:**
- Peer-to-peer WebRTC connections
- Camera and microphone controls
- Device selection (multiple cameras/mics)
- Audio level visualization
- Screen sharing capability

**Interactive Whiteboard:**
- Fabric.js canvas for drawing
- Tools: pen, eraser, shapes, text
- Color and size selection
- Undo/redo functionality
- Clear canvas option
- Persistent state saved to database
- Automatic restoration on reconnection

**In-Session Chat:**
- Real-time text messaging
- Message history
- Emoji support
- Timestamp display

**File Sharing:**
- Upload documents during session
- Shared file list
- Download capability
- File type validation

**Session Controls:**
- End session button
- Disconnect handling
- Reconnection support
- Session timer display

**Post-Session:**
- Session log creation (tutor)
- Feedback submission (learner)
- Rating with tags
- Written review

*See diagrams/03-video-session-diagrams.md for detailed UML diagrams*

### 3.3.4 Tutor Discovery and Matching

**Search and Filter:**
- **Fuzzy Search:** Custom algorithm for approximate name matching
- **Subject Filter:** Filter by expertise area
- **Year Level Filter:** Match tutor's registered year
- **Availability Filter:** Show only available tutors
- **Rating Sort:** Order by average rating
- **Session Count Sort:** Order by experience

**Tutor Profiles Display:**
- Avatar and basic information
- Subject expertise tags
- Average rating and review count
- Total sessions completed
- Bio and description
- Online/offline status indicator
- Favorite button for bookmarking

**Favorite Tutors:**
- Learners can bookmark preferred tutors
- Quick access from dashboard
- Persistent across sessions

### 3.3.5 Availability Management

**Tutor Availability System:**

**Weekly Recurring Schedule:**
- Set availability for each day of week
- Multiple time slots per day
- Enable/disable specific days
- Applies to all future weeks

**Date-Specific Overrides:**
- Override recurring schedule for specific dates
- Set custom time ranges
- Mark dates as unavailable
- Useful for holidays, special events

**Automatic Cleanup:**
- Past time slots automatically removed
- Keeps calendar clean and relevant
- Runs via database trigger

**Availability Display:**
- Visual calendar interface
- Color-coded availability
- Click to toggle availability
- Real-time updates

### 3.3.6 Feedback and Rating System

**Rating Components:**
- **Star Rating:** 1-5 stars
- **Written Review:** Text feedback
- **Rating Tags:** 10 descriptive tags
  - Clear explanations
  - Great communication
  - Always on time
  - Patient & friendly
  - Very knowledgeable
  - Helped me improve
  - Well prepared
  - Engaging session
  - Good examples
  - Responsive

**Rating Display:**
- Average rating calculation
- Total review count
- Tag statistics with percentages
- Recent reviews list
- Most common tags highlighted

**Rating Constraints:**
- One rating per session
- Only learner can rate
- Only after session completion
- Cannot edit after submission

### 3.3.7 Resource Management

**Resource Upload (Tutor):**
1. Tutor uploads file (PDF, images, documents)
2. File validated for type and size
3. Uploaded to Supabase storage
4. Resource record created with "pending" status
5. Admin receives notification for approval

**Resource Approval (Admin):**
1. Admin reviews uploaded resource
2. Can approve or reject
3. If approved, visible to all learners
4. If rejected, tutor notified

**Resource Access (Learner):**
1. Browse approved resources
2. Filter by subject or tutor
3. Preview documents
4. Download files
5. Download count tracked

### 3.3.8 Notification System

**Notification Types:**

**In-App Notifications:**
- Session requests
- Session status changes
- Instant session requests
- Admin announcements
- Tutor approval status
- Missed session alerts

**Email Notifications:**
- Email verification
- Password reset
- Session confirmations
- Session reminders
- Session cancellations
- Tutor approval/rejection

**Notification Delivery:**
- Real-time via Supabase subscriptions
- Toast notifications for instant requests
- Notification bell with unread count
- Email via Supabase Edge Functions (Resend API)

**Notification Management:**
- Mark as read/unread
- Notification history
- Auto-dismiss for toasts
- Email preferences

### 3.3.9 Admin Features

**User Management:**
- View all users
- Filter by role
- Search users
- View user details
- Manage user status

**Tutor Approval Workflow:**
1. Tutor registers and completes profile
2. Admin receives notification
3. Admin reviews tutor credentials
4. Admin approves or rejects
5. Tutor notified of decision
6. If approved, tutor can accept sessions

**Session Monitoring:**
- View all sessions
- Filter by status, date, tutor, learner
- View session details
- Access session logs
- Monitor session statistics

**Live Session Monitoring:**
- View active sessions in real-time
- See whiteboard state
- Read chat messages
- Monitor peer connections
- No admission required
- Non-intrusive observation

**Resource Management:**
- Review pending resources
- Approve or reject uploads
- View download statistics
- Remove inappropriate content

**Announcements:**
- Create platform-wide announcements
- Set expiration dates
- Target specific roles
- Edit or delete announcements

**Analytics Dashboard:**
- Total users by role
- Session statistics
- Popular subjects
- Tutor performance metrics
- System usage trends

### 3.3.10 Donation System

**Donation QR Code (Tutor):**
1. Tutor uploads QR code image (GCash, PayMaya, etc.)
2. Image converted to Base64
3. Stored in tutor profile
4. Displayed on tutor profile page

**Donation Process (Learner):**
1. Learner views tutor profile
2. Clicks "Support this tutor" button
3. QR code displayed in dialog
4. Learner scans with payment app
5. Voluntary contribution made
6. System tracks donation (optional)

**Donation Features:**
- Completely voluntary
- No platform fees
- Direct tutor-to-learner
- QR code validation
- Image size limits (< 2MB)
- Remove QR code option

---

## 3.4 Data Flow Diagrams

### 3.4.1 Authentication Flow

```
User → Registration Form → Input Validation → Supabase Auth
                                                    ↓
                                            Create User Account
                                                    ↓
                                            Send Verification Email
                                                    ↓
                                            Create Profile Record
                                                    ↓
                                            Create Role-Specific Profile
                                                    ↓
                                            Redirect to Verification Page
```

### 3.4.2 Session Booking Flow

```
Learner → Browse Tutors → Select Tutor → Choose Date/Time → Create Session Request
                                                                        ↓
                                                                Store in Database
                                                                        ↓
                                                                Notify Tutor
                                                                        ↓
                                                        Tutor Accepts/Rejects
                                                                        ↓
                                                        Update Session Status
                                                                        ↓
                                                        Notify Learner
                                                                        ↓
                                                        Send Email Confirmation
```

### 3.4.3 Video Session Flow

```
Learner Joins → Generate Peer ID → Enter Waiting Room → Notify Tutor
                                                              ↓
                                                        Tutor Admits
                                                              ↓
                                                    Establish WebRTC Connection
                                                              ↓
                                                    Exchange Media Streams
                                                              ↓
                                            Initialize Whiteboard & Chat
                                                              ↓
                                                    Session In Progress
                                                              ↓
                                                    Either Party Ends
                                                              ↓
                                                    Close Connections
                                                              ↓
                                                    Update Session Status
                                                              ↓
                                            Tutor Creates Session Log
                                                              ↓
                                            Learner Submits Feedback
```

---

## 3.5 System Implementation Details

### 3.5.1 Frontend Implementation

**Component Architecture:**
- **Pages:** Top-level route components
- **Components:** Reusable UI components
- **Hooks:** Custom React hooks for logic reuse
- **Utils:** Helper functions and utilities
- **Types:** TypeScript type definitions
- **Contexts:** Global state management

**State Management:**
- React hooks (useState, useEffect, useContext)
- TanStack Query for server state
- Local storage for persistence
- Supabase real-time subscriptions

**Routing Structure:**
```
/ - Landing page
/login - Authentication
/register - User registration
/dashboard - Role-based dashboard
/tutors - Browse tutors (learner)
/sessions - Session management
/video-session/:id - Active video session
/profile - User profile
/edit-profile - Profile editing
/admin/* - Admin routes
```

**Responsive Design:**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible layouts with Tailwind CSS
- Touch-friendly controls
- Adaptive navigation

### 3.5.2 Backend Implementation

**Database Functions:**
- `get_tutor_rating(tutor_user_id)` - Calculate average ratings
- `get_tutor_stats(tutor_user_id)` - Aggregate statistics
- `get_tutor_rating_tags(tutor_user_id)` - Tag statistics
- `reject_session_with_reason()` - Handle rejections
- `cancel_session_with_reason()` - Handle cancellations
- `mark_missed_sessions()` - Auto-mark no-shows
- `is_tutor_favorited()` - Check favorite status
- `get_favorite_tutors()` - Retrieve favorites
- `increment_resource_downloads()` - Track downloads

**Database Triggers:**
- Auto-cleanup past time slots
- Update tutor statistics on feedback
- Notification creation on session changes

**Edge Functions:**
- `send-confirmation-email` - Email verification
- `send-password-reset` - Password reset emails
- `send-notification-email` - Session notifications
- `send-email` - General email sending

**Real-time Subscriptions:**
- Session status changes
- New messages in active sessions
- Notification updates
- Instant session requests
- Tutor online status

### 3.5.3 WebRTC Implementation

**PeerJS Configuration:**
```typescript
const peer = new Peer(peerId, {
  host: 'peerjs-server.com',
  port: 443,
  path: '/myapp',
  secure: true
});
```

**Connection Establishment:**
1. Both users create Peer instances
2. Peer IDs stored in database
3. Caller initiates connection with callee's peer ID
4. Media streams attached to connection
5. Connection events handled (open, stream, close, error)

**Media Stream Handling:**
```typescript
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  // Attach to local video element
  // Send to peer connection
});
```

**Whiteboard Synchronization:**
- Canvas state serialized to JSON
- Saved to database on changes (debounced)
- Loaded on session join
- Real-time updates via Supabase subscriptions

### 3.5.4 Security Implementation

**Row Level Security Policies:**

```sql
-- Example: Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Example: Only tutors can update tutor profiles
CREATE POLICY "Tutors can update own profile"
ON tutor_profiles FOR UPDATE
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'tutor'
  )
);
```

**Input Validation:**

```typescript
// Example: Session booking validation
const sessionSchema = z.object({
  tutor_id: z.string().uuid(),
  subject: z.string().min(1).max(100),
  scheduled_at: z.string().datetime(),
  duration_minutes: z.number().min(30).max(180),
  session_type: z.enum(['scheduled', 'instant'])
});
```

**Protected Routes:**

```typescript
// Example: Admin-only route protection
function AdminRoute({ children }) {
  const { role, loading } = useUserRole();
  
  if (loading) return <LoadingOverlay />;
  if (role !== 'admin') return <Navigate to="/dashboard" />;
  
  return children;
}
```

---

## 3.6 Testing and Quality Assurance

### 3.6.1 Testing Approach

**Manual Testing:**
- Feature testing during development
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Responsive design testing (mobile, tablet, desktop)
- User flow testing for all roles

**User Acceptance Testing:**
- IT expert review and feedback (Sprints 5-6)
- Client review and feedback (Sprint 7)
- Iterative improvements based on feedback

**Security Testing:**
- RLS policy verification
- Authentication flow testing
- Authorization testing for all roles
- Input validation testing

### 3.6.2 Quality Metrics

**Code Quality:**
- TypeScript strict mode enabled
- ESLint rules enforced
- Consistent code formatting
- Component modularity
- DRY principles followed

**Performance:**
- Fast initial load time
- Code splitting for route-based loading
- Optimized images and assets
- Efficient database queries
- Real-time subscription cleanup

**Accessibility:**
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

**User Experience:**
- Intuitive navigation
- Clear error messages
- Loading states for async operations
- Responsive feedback for user actions
- Consistent design language

---

## 3.7 Deployment and Maintenance

### 3.7.1 Deployment Process

**Continuous Integration/Deployment:**
1. Code pushed to GitHub repository
2. Vercel automatically detects changes
3. Build process initiated
4. TypeScript compilation
5. Vite production build
6. Deployment to Vercel edge network
7. Automatic HTTPS certificate
8. DNS propagation to custom domain

**Environment Configuration:**
- Development: Local environment with Supabase dev instance
- Production: Vercel deployment with production Supabase

**Domain Configuration:**
- Primary domain: cit-techconnect.org
- DNS managed through Squarespace
- SSL/TLS certificate auto-renewed
- CDN distribution via Vercel edge network

### 3.7.2 Monitoring and Maintenance

**System Monitoring:**
- Vercel analytics for performance
- Supabase dashboard for database metrics
- Error tracking via browser console
- User feedback collection

**Maintenance Tasks:**
- Database backup (Supabase automatic)
- Dependency updates
- Security patches
- Performance optimization
- Bug fixes based on user reports

**Scalability Considerations:**
- Supabase scales automatically
- Vercel edge network handles traffic
- Database indexes for query performance
- Connection pooling for database
- CDN for static assets

---

## 3.8 Development Evolution

### 3.8.1 Iterative Development Process

**Sprint 1-4: Core Development**
- Authentication and user management
- Session booking system
- Video session infrastructure
- Basic admin features
- Initial UI/UX implementation

**Sprint 5-6: IT Expert Revisions**
- Added rejection/cancellation reasons
- Implemented reschedule functionality
- Enhanced session status tracking
- Added admin live monitoring
- Improved availability management
- Bug fixes and optimizations

**Sprint 7: Client Revisions**
- Rating tags system
- Favorite tutors feature
- Donation QR codes
- Disconnect tracking
- Auto-cleanup features
- Final polish and refinements

### 3.8.2 Technology Decisions

**Why React + Vite:**
- Fast development experience
- Modern build tooling
- Excellent TypeScript support
- Large ecosystem and community

**Why Supabase:**
- PostgreSQL database (robust and scalable)
- Built-in authentication
- Real-time subscriptions
- Row Level Security
- Serverless functions
- File storage
- Generous free tier

**Why WebRTC + PeerJS:**
- Peer-to-peer reduces server costs
- Low latency for video/audio
- No meeting time limits
- Full control over features
- Better integration with custom UI

**Why Vercel:**
- Automatic deployments
- Global CDN
- Excellent performance
- Zero configuration
- Free SSL certificates
- Great developer experience

### 3.8.3 Challenges and Solutions

**Challenge 1: Real-time Synchronization**
- **Problem:** Keeping whiteboard and chat synchronized
- **Solution:** Supabase real-time subscriptions with debounced updates

**Challenge 2: WebRTC Connection Reliability**
- **Problem:** NAT traversal and connection failures
- **Solution:** STUN/TURN servers, reconnection logic, connection state management

**Challenge 3: Session State Management**
- **Problem:** Complex session lifecycle with multiple states
- **Solution:** Clear state machine, database triggers, automated status updates

**Challenge 4: Tutor Discovery**
- **Problem:** Efficient search and filtering
- **Solution:** Custom fuzzy search algorithm, database indexes, optimized queries

**Challenge 5: Notification Delivery**
- **Problem:** Reliable real-time notifications
- **Solution:** Multiple notification channels (in-app, email, toast), subscription management

---

## 3.9 System Limitations and Future Work

### 3.9.1 Current Limitations

**Technical Limitations:**
- No native mobile applications (web-responsive only)
- No offline access (requires internet connection)
- No session recording capability
- No automated content moderation
- No push notifications (browser-based)

**Feature Limitations:**
- No OAuth/social login
- No group sessions or breakout rooms
- No calendar integration (Google Calendar)
- No payment gateway integration
- No automated tutor-learner matching

**Scalability Limitations:**
- Peer-to-peer video limited by user bandwidth
- No video quality adjustment
- Single region deployment

### 3.9.2 Future Enhancements

**Planned Features:**
- Session recording and playback
- Native mobile applications (iOS, Android)
- OAuth integration (Google, Facebook)
- Automated tutor-learner matching algorithm
- Group session support
- Calendar integration
- Payment gateway for donations
- Advanced analytics dashboard
- AI-powered content recommendations
- Automated content moderation

**Technical Improvements:**
- Multi-region deployment
- Video quality adaptation
- Offline mode support
- Progressive Web App (PWA)
- Enhanced accessibility features
- Performance optimizations

---

## 3.10 Summary

The TechConnect system was developed using modern web technologies and best practices, following an Agile-Kanban methodology that allowed for iterative development and continuous feedback integration. The system architecture leverages React for the frontend, Supabase for backend services, and WebRTC for real-time communication, resulting in a scalable, secure, and user-friendly platform.

The development process spanned 7 sprints over 7 weeks, with each sprint building upon the previous one and incorporating feedback from IT experts and clients. The result is a comprehensive peer tutoring platform that addresses the needs of learners, tutors, and administrators while maintaining high standards of code quality, security, and user experience.

The system successfully implements all core features including user authentication, session management, video conferencing, interactive whiteboard, real-time chat, tutor discovery, availability management, feedback system, resource sharing, and administrative tools. The platform is deployed on Vercel with a custom domain and is ready for use by the CIT-U community.

---

**Document Version:** 1.0  
**Last Updated:** November 25, 2025  
**Status:** Complete  
**Related Documents:**
- diagrams/01-authentication-diagrams.md
- diagrams/02-session-management-diagrams.md
- diagrams/03-video-session-diagrams.md
- COMPLETE-SYSTEM-ANALYSIS.md
- AGILE-KANBAN-METHODOLOGY.md
