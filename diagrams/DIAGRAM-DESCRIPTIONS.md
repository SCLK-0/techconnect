# TechConnect System Diagrams - Complete Figure List

This document provides descriptions for all 78 diagrams across the TechConnect system documentation.

## 01. Authentication & User Management (Figures 1-10)

### Activity Diagrams

**Figure 1. User Registration Process**
This diagram shows how users register for TechConnect by selecting their role (Tutor or Learner), filling out the registration form with role-specific fields, and creating an account. The system validates input, creates the account via Supabase Auth, and sends a verification email.

**Figure 2. Email Verification Process**
This diagram illustrates how users verify their email address by clicking the verification link sent to their inbox. The system validates the token, marks the email as verified, creates profile records, and redirects the user to their dashboard.

**Figure 3. User Login Process**
This diagram shows how users authenticate by entering their credentials. The system verifies the credentials and email verification status, retrieves the user's role from the database, and redirects them to their role-specific dashboard.

**Figure 4. Password Reset Process**
This diagram depicts how users reset their forgotten password by requesting a reset email, clicking the reset link, and entering a new password. The system validates the token and updates the password in Supabase Auth.

**Figure 5. Profile Update Process**
This diagram shows how users update their profile information by navigating to the profile page, editing fields, optionally uploading an avatar, and saving changes. The system validates input and updates the profile in the database.

### Sequence Diagrams

**Figure 6. User Registration Flow**
This sequence diagram describes the technical interactions during user registration. It shows how the React UI communicates with Supabase Auth to create an account, triggers the Edge Function to send a verification email, and handles the email verification process when the user clicks the link.

**Figure 7. User Login Flow**
This sequence diagram illustrates how the system authenticates users by verifying credentials through Supabase Auth, retrieving user data from the database, and using React Router to navigate to the appropriate role-based dashboard.

**Figure 8. Password Reset Flow**
This sequence diagram shows the password reset process, including how the system sends a reset email via Edge Functions, handles the user clicking the reset link, and updates the password in Supabase Auth.

**Figure 9. Profile Update Flow**
This sequence diagram describes how users update their profile, including fetching current profile data, uploading a new avatar to Supabase Storage if changed, and updating profile information in the database.

**Figure 10. Tutor Profile Setup Flow**
This sequence diagram shows how tutors complete their profile setup by submitting tutor-specific information. The system creates a pending tutor profile and uses Supabase Realtime to notify admins of the new tutor awaiting approval.

---

## 02. Session Management (Figures 11-30)

### Activity Diagrams

**Figure 11. Request Scheduled Session Process**
This diagram shows how learners request a scheduled tutoring session by selecting a tutor, choosing a date, time, and subject. The system validates the booking, creates the session request, and notifies the tutor via in-app notification and email.

**Figure 12. Request Instant Session Process**
This diagram illustrates how learners request an instant tutoring session by entering the subject and duration. The system broadcasts the request to online tutors, shows a waiting modal, and redirects to the session if a tutor accepts.

**Figure 13. Accept Session Request Process**
This diagram shows how tutors accept incoming session requests by reviewing the request details and confirming acceptance. The system updates the session status to accepted and notifies the learner.

**Figure 14. Decline Session Request Process**
This diagram depicts how tutors decline session requests by clicking the decline button, providing a reason in the dialog, and confirming the declination. The system updates the session status and notifies the learner with the declination reason.

**Figure 15. Cancel Session Process**
This diagram shows how users (learner or tutor) cancel a session by clicking the cancel button, providing a cancellation reason, and confirming. The system updates the session status and notifies the other party.

**Figure 16. Reschedule Session Process**
This diagram illustrates how learners reschedule a session by selecting a new date and time, submitting the request, and waiting for tutor approval. The system notifies the tutor and updates the session details upon approval.

**Figure 17. View Session History Process**
This diagram shows how users view their past sessions by navigating to the session history page, applying filters, and viewing session details including ratings and feedback.

**Figure 18. Mark Session as Completed Process**
This diagram depicts how the system automatically marks sessions as completed when the scheduled end time passes. It triggers the feedback modal for the learner to rate the session.

**Figure 19. Mark Session as Missed Process**
This diagram shows how the system automatically marks sessions as missed when neither party joins within the grace period after the scheduled start time.

**Figure 20. View Session Details Process**
This diagram illustrates how users view detailed information about a specific session, including participant information, scheduled time, subject, status, and any feedback or ratings.

### Sequence Diagrams

**Figure 21. Request Scheduled Session Flow**
This sequence diagram describes how learners create a scheduled session request. It shows the interaction between the React UI, Supabase DB for creating the session, and the notification system for alerting the tutor.

**Figure 22. Request Instant Session Flow**
This sequence diagram shows the instant session request process, including broadcasting to online tutors via Supabase Realtime, handling tutor acceptance, and redirecting the learner to the video session.

**Figure 23. Accept Session Request Flow**
This sequence diagram illustrates how tutors accept session requests, including updating the session status in the database and sending notifications to the learner via Realtime and email.

**Figure 24. Decline Session Request Flow**
This sequence diagram shows how tutors decline sessions with a reason, update the database, and notify the learner through multiple channels.

**Figure 25. Cancel Session Flow**
This sequence diagram depicts the session cancellation process, including updating the session status, recording the cancellation reason, and notifying the other party.

**Figure 26. Reschedule Session Flow**
This sequence diagram shows how learners request to reschedule a session, how the system notifies the tutor, and how the tutor approves or rejects the reschedule request.

**Figure 27. View Session History Flow**
This sequence diagram illustrates how the system fetches and displays session history, including joining with user profiles and filtering based on user criteria.

**Figure 28. Mark Session as Completed Flow**
This sequence diagram shows the automated process of marking sessions as completed, including checking the scheduled end time and triggering the feedback modal.

**Figure 29. Mark Session as Missed Flow**
This sequence diagram depicts how the system automatically detects missed sessions by checking join times and marks them accordingly in the database.

**Figure 30. View Session Details Flow**
This sequence diagram shows how the system retrieves and displays comprehensive session information, including participant details, session metadata, and any associated feedback.

---

## 03. Video Session (Figures 31-46)

### Activity Diagrams

**Figure 31. Join Video Session Process**
This diagram shows how users join a video session by clicking the join button, testing their devices, and entering the session. The system establishes peer-to-peer connections and displays video streams.

**Figure 32. Share Screen Process**
This diagram illustrates how users share their screen during a session by clicking the share screen button. The system captures the screen stream and broadcasts it to the other participant.

**Figure 33. Use Whiteboard Process**
This diagram shows how users interact with the collaborative whiteboard by selecting drawing tools, drawing on the canvas, and seeing real-time updates from the other participant.

**Figure 34. Send Chat Message Process**
This diagram depicts how users send chat messages during a session. The system stores messages in the database and broadcasts them in real-time to the other participant.

**Figure 35. Upload Session Asset Process**
This diagram shows how users upload files during a session. The system uploads the file to Supabase Storage, creates a database record, and notifies the other participant.

**Figure 36. End Video Session Process**
This diagram illustrates how users end a video session by clicking the end button, confirming the action, and disconnecting. The system updates the session status and shows the feedback modal to the learner.

**Figure 37. Handle Connection Issues Process**
This diagram shows how the system detects and handles connection issues, including attempting reconnection and notifying users of connection problems.

**Figure 38. Admit Learner to Session Process**
This diagram depicts how tutors admit learners from the waiting room by clicking the admit button. The system updates the session status and allows the learner to join.

### Sequence Diagrams

**Figure 39. Join Video Session Flow**
This sequence diagram describes the technical process of joining a video session, including fetching session data, establishing PeerJS connections, and setting up media streams.

**Figure 40. Share Screen Flow**
This sequence diagram shows how screen sharing is initiated, including capturing the screen stream, sending it through the peer connection, and displaying it to the remote participant.

**Figure 41. Use Whiteboard Flow**
This sequence diagram illustrates the collaborative whiteboard functionality, including drawing actions, saving state to the database, and broadcasting changes via Supabase Realtime.

**Figure 42. Send Chat Message Flow**
This sequence diagram shows how chat messages are sent, stored in the database, and delivered to the other participant in real-time.

**Figure 43. Upload Session Asset Flow**
This sequence diagram depicts the file upload process during a session, including uploading to Supabase Storage, creating database records, and notifying participants.

**Figure 44. End Video Session Flow**
This sequence diagram shows how sessions are ended, including updating the session status, disconnecting peer connections, and triggering the feedback modal.

**Figure 45. Handle Connection Issues Flow**
This sequence diagram illustrates how the system monitors connection quality, detects issues, attempts reconnection, and notifies users of connection problems.

**Figure 46. Admit Learner to Session Flow**
This sequence diagram shows how tutors admit learners from the waiting room, including updating the session status and notifying the learner via Realtime.

---

## 04. Tutor Features (Figures 47-56)

### Activity Diagrams

**Figure 47. Manage Availability Process**
This diagram shows how tutors set their availability by navigating to the availability page, editing their weekly schedule or date-specific overrides, and saving changes.

**Figure 48. Upload Resource Process**
This diagram illustrates how tutors upload educational resources by filling out a form, selecting a file, and submitting for admin approval. The system creates a pending resource record and notifies admins.

**Figure 49. Upload Donation QR Code Process**
This diagram shows how tutors upload their donation QR code by navigating to donation settings, selecting an image file, previewing it, and confirming the upload.

**Figure 50. Toggle Online Status Process**
This diagram depicts how tutors toggle their online status to indicate availability for instant sessions. The system updates the database and starts/stops listening for instant session requests.

**Figure 51. View Session Statistics Process**
This diagram shows how tutors view their dashboard statistics, including total sessions, completed sessions, average rating, and pending requests.

### Sequence Diagrams

**Figure 52. Manage Availability Flow**
This sequence diagram describes how tutors update their availability, including fetching current schedules, updating weekly availability, and saving date-specific overrides.

**Figure 53. Upload Resource Flow**
This sequence diagram shows the resource upload process, including uploading files to Supabase Storage, creating pending resource records, and notifying admins via Realtime.

**Figure 54. Upload Donation QR Code Flow**
This sequence diagram illustrates how tutors upload donation QR codes, including converting images to Base64 and updating the tutor profile in the database.

**Figure 55. Toggle Online Status Flow**
This sequence diagram shows how the online status toggle works, including updating the database, subscribing/unsubscribing from instant session notifications via Realtime.

**Figure 56. View Session Statistics Flow**
This sequence diagram depicts how the dashboard fetches tutor statistics, including calling database functions to get session counts, ratings, and recent session data.

---

## 05. Learner Features (Figures 57-66)

### Activity Diagrams

**Figure 57. Browse and Search Tutors Process**
This diagram shows how learners find tutors by browsing the tutor list, applying filters (subject, rating, year level, online status), and using fuzzy search to find specific tutors.

**Figure 58. Add Tutor to Favorites Process**
This diagram illustrates how learners add or remove tutors from their favorites list by clicking the favorite button on tutor profiles.

**Figure 59. Submit Feedback and Rating Process**
This diagram shows how learners submit feedback after a session by selecting a star rating, optionally choosing rating tags and writing comments, and submitting the feedback.

**Figure 60. View Favorite Tutors Process**
This diagram depicts how learners view their list of favorite tutors and navigate to tutor profiles from the favorites page.

**Figure 61. View Tutor Profile Process**
This diagram shows how learners view detailed tutor information, including bio, subject expertise, ratings, reviews, and availability.

### Sequence Diagrams

**Figure 62. Browse and Search Tutors Flow**
This sequence diagram describes how the system fetches approved tutors with their ratings, availability, and online status, then filters and displays them based on learner search criteria.

**Figure 63. Add Tutor to Favorites Flow**
This sequence diagram shows how the system adds or removes tutors from the favorites table and updates the UI to reflect the favorite status.

**Figure 64. Submit Feedback and Rating Flow**
This sequence diagram illustrates the feedback submission process, including inserting feedback and rating tags into the database, and optionally showing the tutor's donation QR code.

**Figure 65. View Favorite Tutors Flow**
This sequence diagram shows how the system retrieves favorite tutors by joining the favorites table with tutor profiles and ratings data.

**Figure 66. View Tutor Profile Flow**
This sequence diagram depicts how the system fetches comprehensive tutor information, including profile data, ratings, reviews, and availability for display in the detail dialog.

---

## 06. Admin Features (Figures 67-76)

### Activity Diagrams

**Figure 67. Approve Tutor Process**
This diagram shows how admins review and approve pending tutor applications by viewing tutor credentials and either approving or rejecting the application with notifications sent to the tutor.

**Figure 68. Manage Users Process**
This diagram illustrates how admins manage user accounts by viewing all users, applying filters, selecting users, and taking actions such as changing roles or suspending accounts.

**Figure 69. Monitor Active Sessions Process**
This diagram shows how admins monitor live tutoring sessions by viewing the active sessions list and optionally joining sessions to observe the whiteboard, chat, and connection status.

**Figure 70. Manage Resources Process**
This diagram depicts how admins review and approve or reject educational resources uploaded by tutors, with notifications sent to tutors about the decision.

**Figure 71. View Analytics Dashboard Process**
This diagram shows how admins view system analytics, including user statistics, session statistics, tutor performance, and resource counts.

### Sequence Diagrams

**Figure 72. Approve Tutor Flow**
This sequence diagram describes how admins approve tutor applications, including updating the tutor status in the database, creating notifications, and sending approval emails via Edge Functions.

**Figure 73. Manage Users Flow**
This sequence diagram shows how admins manage users, including fetching user lists, viewing user details, and updating user roles or account status in the database.

**Figure 74. Monitor Active Sessions Flow**
This sequence diagram illustrates how admins monitor live sessions, including fetching active sessions, subscribing to real-time updates, and viewing whiteboard state and chat messages.

**Figure 75. Manage Resources Flow**
This sequence diagram shows the resource approval process, including updating resource status, deleting rejected files from storage, and notifying tutors via email.

**Figure 76. View Analytics Dashboard Flow**
This sequence diagram depicts how the analytics dashboard fetches various statistics from the database, including user counts, session metrics, popular subjects, and top tutors.

---

## 07. Notification System (Figures 77-78)

### Activity Diagrams

**Figure 77. View Notifications Process**
This diagram shows how users view their notifications by clicking the notification bell, viewing the notification list, and optionally marking notifications as read.

### Sequence Diagrams

**Figure 78. View Notifications Flow**
This sequence diagram describes how the system fetches notifications from the database, displays them in a dropdown, and marks them as read when clicked.

---

**Total: 78 Diagrams (39 Activity + 39 Sequence)**
