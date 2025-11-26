# TechConnect Sequence Diagram Descriptions

This document provides detailed descriptions for all sequence diagrams in the TechConnect system.

---

## 01. Authentication & User Management

### Figure 6. User Registration Flow
This sequence diagram describes the technical interactions during user registration. The learner or tutor submits their registration form through the React UI, which communicates with Supabase Auth to create a new account. Upon successful account creation, the system stores user metadata and triggers an Edge Function to send a verification email via the Resend API. When the user clicks the verification link in their email, the system validates the token, marks the email as verified, creates the necessary profile records in the database, and redirects the user to their role-specific dashboard.

### Figure 7. User Login Flow
This sequence diagram illustrates how the system authenticates users by verifying credentials through Supabase Auth. When a user enters their email and password, the React UI sends the credentials to Supabase Auth, which verifies them against the database. Upon successful authentication, Supabase Auth returns a session token and user data to the frontend. The React Router then navigates the user to their appropriate role-based dashboard (Admin, Tutor, or Learner) based on their assigned role.

### Figure 8. Password Reset Flow
This sequence diagram shows the password reset process. When a user requests a password reset, the React UI communicates with Supabase Auth to initiate the reset workflow. Supabase Auth triggers an Edge Function that sends a password reset email via the Resend API. The user receives the email and clicks the reset link, which directs them back to the platform. After entering and confirming their new password, the React UI sends the update to Supabase Auth, which updates the password in the database and redirects the user to the login page.

### Figure 9. Profile Update Flow
This sequence diagram describes how users update their profile information. The React UI first fetches the current profile data from the Supabase Database to display to the user. When the user makes changes and saves, if they've uploaded a new avatar image, it's first uploaded to Supabase Storage, which returns the image URL. The React UI then updates the profile record in the database with the new information, including the avatar URL if applicable, and displays a success message to the user.

### Figure 10. Tutor Profile Setup Flow
This sequence diagram shows how tutors complete their profile setup after registration. The tutor submits their profile information including subject expertise, bio, and registered year through the React UI. The system creates a tutor profile record in the database with a "pending" status, awaiting administrative approval. Supabase Realtime then broadcasts a notification to all online administrators, alerting them that a new tutor application requires review. The tutor sees a message indicating their profile is awaiting approval.

---

## 02. Session Management

### Figure 21. Request Scheduled Session Flow
This sequence diagram describes how learners create scheduled session requests. The learner selects a tutor, chooses a date and time from the tutor's availability, and specifies the subject. The React UI sends this information to the Supabase Database, which creates a new session record with "pending" status. The system then triggers notifications through two channels: Supabase Realtime broadcasts an instant in-app notification to the tutor if they're online, and an Edge Function sends an email notification via the Resend API. The learner receives confirmation that their request has been submitted.

### Figure 22. Request Instant Session Flow
This sequence diagram shows the instant session request process. When a learner requests an instant session with a subject and duration, the React UI creates a session record in the database and uses Supabase Realtime to broadcast the request to all tutors who are currently online and available. The first tutor to accept the request triggers a database update changing the session status to "accepted." Both the learner and tutor receive immediate notifications via Realtime, and the React UI redirects both parties to the video session interface to begin the tutoring session.

### Figure 23. Accept Session Request Flow
This sequence diagram illustrates how tutors accept session requests. When a tutor clicks the accept button on a pending session request, the React UI updates the session status to "accepted" in the Supabase Database. The system then creates a notification record for the learner and broadcasts it via Supabase Realtime for instant delivery. Additionally, an Edge Function sends an email notification to the learner via the Resend API, confirming that their session has been accepted and providing the session details.

### Figure 24. Reject Session Request Flow
This sequence diagram shows how tutors reject sessions with a reason. The tutor clicks reject, enters a reason in the dialog, and confirms. The React UI updates the session status to "rejected" in the database and stores the rejection reason. The system creates a notification for the learner including the rejection reason, broadcasts it via Supabase Realtime, and sends an email notification through Edge Functions and Resend API, allowing the learner to understand why the session was declined.

### Figure 25. Cancel Session Flow (Learner)
This sequence diagram depicts the learner-initiated session cancellation process. When a learner cancels a session, they must provide a cancellation reason. The React UI updates the session status to "cancelled" in the database and records the reason and timestamp. The system creates a notification for the tutor, broadcasts it via Supabase Realtime for immediate delivery, and sends an email notification through Edge Functions, informing the tutor of the cancellation and the stated reason.

### Figure 25b. Cancel Session Flow (Tutor)
This sequence diagram shows the tutor-initiated session cancellation process. When a tutor cancels a session, they provide a cancellation reason through the interface. The React UI updates the session status to "cancelled" in the database and stores the reason. The system creates a notification for the learner, broadcasts it via Supabase Realtime, and sends an email notification through Edge Functions and Resend API, informing the learner of the cancellation and allowing them to seek alternative tutoring arrangements.

### Figure 26. Reschedule Session Flow
This sequence diagram shows how learners request to reschedule sessions. The learner selects a new date and time from the tutor's availability and submits the reschedule request. The React UI creates a reschedule request record in the database and notifies the tutor via Realtime and email. The tutor reviews the request and either approves or rejects it. If approved, the system updates the session with the new scheduled time and notifies the learner. If rejected, the original time remains and the learner is notified of the decision.

### Figure 28. Mark Session as Completed Flow
This sequence diagram shows the automated process of marking sessions as completed. When a video session ends, the system checks the scheduled end time and updates the session status to "completed" in the database. The learner is immediately presented with a feedback modal prompting them to rate the session. After feedback submission, the system updates the tutor's statistics and, if configured, displays the tutor's donation QR code to the learner.

### Figure 29. Mark Session as Missed Flow
This sequence diagram depicts how the system automatically detects and marks missed sessions. The system monitors sessions and checks if either party joined within the grace period after the scheduled start time. If neither the tutor nor learner joined, the system automatically updates the session status to "missed" in the database and creates notifications for both parties informing them that the session was not attended.

### Figure 30. View Session Details Flow
This sequence diagram shows how users retrieve and view comprehensive session information. When a user clicks on a session, the React UI fetches the session details from the database, including participant information, scheduled time, subject, status, and any associated feedback or ratings. The system joins data from multiple tables to provide a complete view of the session, which is then displayed to the user.

---

## 03. Video Session

### Figure 39. Join Video Session Flow (Learner)
This sequence diagram describes the technical process of a learner joining a video session. The learner first goes through a device testing page where they verify their camera and microphone functionality. After confirming their devices work properly, they click continue and the React UI initializes PeerJS, generates a unique peer ID, and saves it to the database. The learner then enters a waiting room where they see a message indicating they're waiting for the tutor. The system continuously checks the session status via Realtime. When the tutor admits the learner, the session status updates, PeerJS establishes the peer-to-peer WebRTC connection using the stored peer IDs, and the video session begins with audio and video streams exchanged directly between participants.

### Figure 39b. Join Video Session Flow (Tutor)
This sequence diagram shows the technical flow for tutors joining video sessions. The tutor similarly tests their camera and microphone devices, then clicks continue to join the session. The React UI initializes PeerJS, generates a peer ID, and saves it to the database. Unlike learners, tutors join the session directly without a waiting room. The tutor sees the learner waiting and clicks the admit button, which updates the session status in the database. This triggers Supabase Realtime to notify the learner, and PeerJS establishes the peer-to-peer WebRTC connection between both participants, initiating the video and audio streams.

### Figure 40. Establish Video Connection Flow
This sequence diagram shows the technical process of establishing peer-to-peer video connections. After both participants have joined the session and the tutor has admitted the learner, PeerJS initiates the WebRTC connection negotiation. The system exchanges ICE (Interactive Connectivity Establishment) candidates between peers to find the best connection path. Once the peer connection is established, both participants' camera and microphone streams are captured by their browsers and transmitted directly to each other through the WebRTC connection. The React UI displays the remote video stream and local video preview, completing the video session setup.

### Figure 41. Use Whiteboard Flow
This sequence diagram illustrates the collaborative whiteboard functionality. When a user draws on the whiteboard using Fabric.js, the React UI captures the drawing action and its coordinates. This data is immediately sent to the Supabase Database to save the whiteboard state and simultaneously broadcast via Supabase Realtime to the other participant. The remote participant's React UI receives the drawing data through the Realtime subscription and updates their whiteboard canvas in real-time, creating a synchronized collaborative drawing experience. All whiteboard states are persisted in the database for session history.

### Figure 42. Send Chat Message Flow
This sequence diagram shows how chat messages are sent and delivered during sessions. When a user types a message and clicks send, the React UI inserts the message into the chat_messages table in the Supabase Database with the session ID, sender ID, message content, and timestamp. Supabase Realtime immediately broadcasts this new message to all participants subscribed to that session's chat channel. The remote participant's React UI receives the message through the Realtime subscription and displays it in their chat interface, providing instant communication alongside the video stream.

### Figure 43. Upload Session Asset Flow
This sequence diagram depicts the file upload process during sessions. When a user selects a file to share, the React UI first uploads the file to Supabase Storage, which returns a secure URL for the file. The system then creates a record in the database linking the file URL to the session, including metadata such as filename, file type, uploader ID, and timestamp. Supabase Realtime broadcasts a notification to the other participant that a new file has been shared. The remote participant receives the notification and can click to download or view the file from Supabase Storage.

### Figure 44. Screen Share Flow
This sequence diagram shows how screen sharing is initiated during a session. When a user clicks the share screen button, the React UI requests screen capture permissions from the browser. Once granted, the system captures the screen stream using the browser's getDisplayMedia API and sends it through the existing PeerJS peer connection to the remote participant. The remote participant's React UI receives the screen stream and displays it in their video interface, replacing or supplementing the camera feed. The screen sharing continues until the user stops sharing or the session ends, at which point the stream reverts to the camera feed.

### Figure 45. End Video Session Flow
This sequence diagram shows how sessions are ended and feedback is collected. When either participant clicks the end session button, the React UI updates the session status to "completed" in the database and records the end timestamp. The PeerJS connections are closed, terminating the video and audio streams. For learners, the system immediately displays a feedback modal prompting them to rate the session with stars, select rating tags, and write optional comments. After feedback submission, if the tutor has a donation QR code configured, it's displayed to the learner. Both participants are then redirected to their respective dashboards.

---

## 04. Tutor Features

### Figure 52. Manage Availability Flow
This sequence diagram describes how tutors update their availability schedules. The React UI first fetches the tutor's current availability from the database, including both weekly recurring schedules and date-specific overrides. The tutor can then modify their weekly schedule by toggling days and adding time slots, or set date-specific availability that overrides the weekly schedule. When the tutor saves changes, the React UI updates the tutor_availability table for weekly schedules and the tutor_day_availability table for date-specific overrides. The system validates time slots to ensure end times are after start times and displays a success message upon completion.

### Figure 53. Upload Resource Flow
This sequence diagram shows the resource upload process for tutors. The tutor fills out a resource form with title, description, and subject, then selects a file. The React UI uploads the file to Supabase Storage, which returns a file URL. The system then creates a resource record in the database with "pending" status, linking the file URL and metadata. A notification is created for administrators and broadcast via Supabase Realtime to alert them of the new resource awaiting approval. The tutor receives confirmation that their resource has been submitted for review.

### Figure 54. Upload Donation QR Code Flow
This sequence diagram illustrates how tutors upload donation QR codes. The tutor navigates to donation settings, selects an image file, and previews it. Upon confirmation, the React UI converts the image to Base64 format and updates the tutor_profiles table, storing the Base64 string in the donation_qr_code column. This approach eliminates the need for separate file storage and allows the QR code to be easily retrieved and displayed to learners after sessions. The tutor receives confirmation that their QR code has been uploaded successfully.

### Figure 55. Toggle Online Status Flow
This sequence diagram shows how the online status toggle works. When a tutor clicks the status toggle, the React UI updates the is_online field in the tutor_profiles table. If toggling to online, the system also updates the last_seen timestamp and the React UI subscribes to Supabase Realtime channels for instant session requests, allowing the tutor to receive broadcasts when learners request instant sessions. If toggling to offline, the system unsubscribes from instant session channels. The tutor sees their status badge update to reflect the new state.

### Figure 56. View Session Statistics Flow
This sequence diagram depicts how the dashboard fetches and displays tutor statistics. When a tutor navigates to their dashboard, the React UI calls the get_tutor_stats database function, which calculates total sessions, completed sessions, pending sessions, average rating, and total reviews. The system also fetches the tutor's 5 most recent sessions with learner names. All this data is managed by TanStack Query for efficient caching and automatic refetching. The dashboard displays the statistics in cards and shows the recent sessions list, providing tutors with an overview of their performance and activity.

---

## 05. Learner Features

### Figure 62. Browse and Search Tutors Flow
This sequence diagram describes how the system fetches and filters tutors for learners. When a learner navigates to the Find Tutors page, the React UI fetches all approved tutors from the database along with their profiles, availability schedules (both weekly and date-specific), current session status to identify tutors in active sessions, and ratings with review counts. The system calculates each tutor's next available time slot and checks their online status based on the last_seen timestamp (within 60 seconds indicates online). When learners apply search queries, the React UI performs fuzzy matching locally, calculating relevance scores based on name, subject, and bio similarity, then sorts results by score. Filters for online status, rating, subject, and year level are also applied client-side for instant results.

### Figure 63. Add Tutor to Favorites Flow
This sequence diagram shows how the system toggles favorite status for tutors. When a learner clicks the favorite button on a tutor card, the React UI first checks if the tutor is already favorited by querying the favorite_tutors table. If not favorited, the system inserts a new record linking the learner ID and tutor ID. If already favorited, the system deletes the existing record. The UI immediately updates the heart icon to reflect the new state (filled for favorited, outline for not favorited), and displays a toast notification confirming the action.

### Figure 64. Submit Feedback and Rating Flow
This sequence diagram illustrates the feedback submission process after sessions. When a session ends, the learner sees a feedback modal (which cannot be dismissed). The learner selects a star rating (1-5, required), optionally selects rating tags from predefined options, and optionally writes a comment. Upon submission, the React UI inserts the feedback into the feedback table and, if tags were selected, inserts them into the feedback_tags table. The system then checks if the tutor has a donation QR code configured. If yes, the feedback modal closes and a donation dialog opens displaying the QR code. If no, the learner is redirected directly to their dashboard. The tutor's statistics are automatically updated via database triggers.

### Figure 65. View Favorite Tutors Flow
This sequence diagram shows how the system retrieves favorite tutors. When a learner navigates to their favorites page, the React UI calls the get_favorite_tutors database function with the learner's ID. This function joins the favorite_tutors table with tutor_profiles and profiles tables to get complete tutor information, fetches ratings and statistics, and checks online status. The system returns the list of favorite tutors with all their details, which are displayed as tutor cards. If the learner has no favorites, an empty state is shown with a button to browse tutors.

### Figure 66. View Tutor Profile Flow
This sequence diagram depicts how the system fetches comprehensive tutor information for the detail dialog. When a learner clicks on a tutor card, the React UI fetches the tutor's complete profile including bio, subject expertise, registered year, ratings with review counts, recent reviews with rating tags, and availability schedule. The system also checks the tutor's current online status and whether they're in an active session. All this information is displayed in a dialog, allowing the learner to view detailed tutor information and decide whether to book a session, request an instant session, or add the tutor to favorites.

---

## 06. Admin Features

### Figure 72. Approve Tutor Flow
This sequence diagram describes how admins approve tutor applications. When an admin navigates to tutor management, the React UI fetches all pending tutors from the database. The admin selects a tutor to review and the system fetches detailed profile information. After reviewing credentials, if the admin clicks approve, the React UI updates the tutor_profiles status to "approved" in the database. The system creates an in-app notification for the tutor and triggers an Edge Function to send an approval email via the Resend API. The tutor receives both notifications and can now set their availability and go online to accept sessions.

### Figure 73. Manage Users Flow
This sequence diagram shows how admins manage user accounts. The React UI fetches all users with their roles and profile information from the database. Admins can apply filters to find specific users. When an admin selects a user, the system fetches detailed user data including profile information, session history, and activity. The admin can then take actions such as changing the user's role (updating the user_roles table) or suspending the account (updating the profiles status). The system updates the database and displays a success message to the admin.

### Figure 74. Monitor Active Sessions Flow
This sequence diagram illustrates how admins monitor live sessions in real-time. The React UI fetches all sessions with "in_progress" status from the database, joining with tutor and learner profiles to get participant names. When an admin clicks "Monitor" on a session, the system fetches detailed session data and subscribes to Supabase Realtime channels for that specific session. The admin can then view the current whiteboard state from the database and chat message history. As the session progresses, Realtime broadcasts whiteboard changes and new chat messages to the admin's interface, allowing them to observe the session without participating. The admin can close monitoring at any time, unsubscribing from the Realtime channels.

### Figure 75. Manage Resources Flow
This sequence diagram shows the resource approval process. The React UI fetches all resources with "pending" status from the database. When an admin selects a resource to review, the system fetches the resource details including the file URL from Supabase Storage. If the admin approves, the resource status is updated to "approved" and becomes available to learners. If rejected, the resource status is updated to "rejected" and the file is deleted from Supabase Storage to free up space. In both cases, a notification is created for the tutor and an email is sent via Edge Functions and Resend API, informing them of the decision.

### Figure 76. View Analytics Dashboard Flow
This sequence diagram depicts how the analytics dashboard fetches system statistics. When an admin navigates to analytics, the React UI makes multiple database queries to fetch user counts (total users by role), session statistics (counts by status, completion rate), popular subjects (sessions grouped by subject), top-rated tutors, and activity trends over time. The database performs aggregations and calculations, returning the statistical data. The React UI displays this information in charts and cards. Admins can also export the data by clicking an export button, which generates a CSV file for download.

---

## 07. Notification System

### Figure 78. View Notifications Flow
This sequence diagram describes how users view and interact with notifications. When a user clicks the notification bell icon, the React UI fetches unread and recent notifications from the database, ordered by creation time. The notifications are displayed in a dropdown with icons, titles, and timestamps. When a user clicks on a notification, the React UI updates the is_read field to true in the database, marks the notification as read in the UI (changing its appearance), and may navigate the user to the relevant page (e.g., session details, tutor profile). The notification count badge updates to reflect the new number of unread notifications.

---

**Total: 39 Sequence Diagrams with Detailed Descriptions**
