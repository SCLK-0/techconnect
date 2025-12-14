# Functional Requirements Documentation (Revised)

The functional requirements of TechConnect describe the system's capabilities and expected behavior, focusing on the delivery of an accessible and efficient peer tutoring environment for the College of Industrial Technology. At its core, the platform provides user account management, tutor discovery and selection, a centralized resource hub, dashboards for activity tracking, communication and notification services, announcements, performance tracking, voluntary donation system, and administrative oversight features.

## User Account Management

For user account management, enrolled CIT students are able to register using their email address, secured by a password and verified through an email confirmation link. During registration, students select a role as either a tutor or a learner. Users may later edit their personal details including profile photo, bio, course, and year level. Tutors specify subject expertise through tags and set availability using a calendar interface with weekly schedules and date-specific overrides, and can toggle their online status to indicate availability for instant session requests. Learners identify subjects they need help with and can browse tutors using fuzzy search and filtering. Administrator accounts are created manually by system administrators, granting them the ability to activate or deactivate user accounts, verify tutor applications, and access dashboards summarizing overall system activity.

## Tutor Discovery & Session Booking

Tutor discovery is accomplished through a learner-driven search and filtering system. Learners browse available tutors using a custom fuzzy search algorithm that employs Levenshtein distance calculation to find matches even with typographical errors or partial input. The search algorithm prioritizes exact matches, prefix matches, and substring matches before applying distance-based fuzzy matching, then ranks results using weighted scores that consider both tutor name and subject expertise. Learners can apply rule-based filters to narrow results by subject specialization, year level compatibility, online availability status, and minimum rating thresholds. The system displays tutor profiles showing subject expertise, ratings with review counts, bio, year level, and online status, empowering learners to independently select tutors that match their needs.

Learners may request sessions in two ways: scheduled sessions where they select from a tutor's available time slots and provide session details, or instant sessions where they request immediate help from online tutors (limited to 10-60 minutes). Tutors receive in-app and email notifications of session requests and may accept or decline, with the option to provide rejection reasons. Confirmed sessions appear in both participants' calendars. Sessions can be rescheduled or cancelled by either party with reason selection. Completed sessions are followed by learner feedback, which includes a 1-5 star rating, selection of predefined feedback tags (Clear Explanations, Patient & Friendly, Well Prepared, Helpful Materials, Great Communication, Always On Time, Very Knowledgeable, Helped Me Improve, Engaging Session, Good Examples, Responsive), and optional written review, all of which contribute to tutor performance metrics.

## Video Session Features

Real-time video communication is facilitated through peer-to-peer WebRTC connections using PeerJS, enabling direct browser-to-browser video calls without centralized video servers. During sessions, participants have access to camera and microphone controls, screen sharing capabilities, an integrated whiteboard with drawing tools (pen, eraser, text, shapes, color picker, line thickness) and actions (clear, undo, redo, save, refresh), in-session chat messaging for text communication, and file sharing functionality supporting documents, images, spreadsheets, presentations, and code files up to 10MB. The whiteboard state is synchronized in real-time between participants and saved to the database for session records. For tutors, there is a waiting room feature where they admit learners before the session begins.


## Resource Hub & Materials

The resource hub serves as a centralized repository where verified tutors may upload learning materials including documents (PDF, DOC, DOCX), presentations (PPT, PPTX), images (PNG, JPG), spreadsheets (XLS, XLSX, CSV), and code files, with a maximum file size of 10MB. Each resource includes metadata such as title, description, subject classification, uploader identification, and upload timestamp. All uploaded resources undergo administrative review before becoming available to users, with status tracking (pending, approved, rejected). Learners and tutors can access the repository through a searchable interface that supports filtering by subject and tutor, with the ability to download approved materials. Download counts are tracked for engagement monitoring.

## Dashboard & Activity Tracking

Dashboards are tailored according to user roles. Tutors access comprehensive statistics dashboards showing total sessions conducted, average rating out of 5 stars, total reviews received, sessions per week/month, rating trends, and most common feedback tags received. They can view upcoming sessions, pending requests, manage their availability calendar, toggle online status for instant sessions, view all learners they've tutored with session history and ratings, access feedback with detailed reviews and tags, and manage uploaded resources. Learners can review their session history across three tabs (upcoming, completed, cancelled), view favorite tutors, access bookmarked learning materials, and track their engagement with the platform. Administrators are provided with a consolidated view of total users, pending tutor approvals, active sessions in real-time, total sessions count, and access to detailed analytics, with the ability to navigate to specific management sections.

## Communication & Notification

Communication is facilitated through both in-app notifications via Supabase Realtime WebSocket connections and email notifications via Resend service. In-app notifications appear in real-time when users are active on the platform, with a notification bell icon showing unread count and a dropdown displaying recent notifications. Email notifications are sent for important events including session requests, session acceptances or rejections with reasons, session reminders (24 hours and 1 hour before scheduled time), tutor verification status (approved or rejected), session cancellations with reasons, instant session starting notifications, and session missed alerts. The notification system maintains history for later viewing, ensuring users stay informed even when not actively using the platform.

## Announcements

Administrators can publish announcements with title (maximum 200 characters) and content (maximum 2000 characters) that support basic markdown formatting for bold text. Announcements are displayed to all users on their dashboards and can be viewed in full detail through a dialog interface. Administrators can delete announcements when they are no longer relevant. All announcements show the posted date and are ordered by creation time with the most recent appearing first.


## Performance Tracking & Recognition

Tutor performance tracking is embedded into the system through comprehensive statistics dashboards that display session counts, average ratings, total reviews, rating distribution, and engagement metrics. These statistics serve as resume-building tools that tutors can reference for scholarship applications, academic portfolios, or professional development. The platform tracks tutor response rates to session requests, completion rates, and feedback trends over time. Learners can view tutor performance metrics before booking sessions, including average rating, total reviews, and common feedback tags, enabling informed tutor selection. The system does not provide automated certificates or badges; instead, it focuses on data-driven performance documentation that tutors can leverage for their academic and professional advancement.

## Voluntary Donation System

A voluntary donation module allows learners to financially appreciate tutors through QR code-based contributions. Tutors can upload their donation QR codes (GCash, PayMaya, or bank QR codes) as images with a maximum size of 2MB, stored as base64-encoded data in the database. Learners can view a tutor's donation QR code through the tutor profile interface and scan it using their mobile banking applications to send donations of any amount they choose. The platform does not process payments directly; all transactions occur outside TechConnect through the learner's banking app. Tutors are responsible for managing their own QR codes and verifying donations independently. The donation system is entirely optional and does not affect tutor visibility, ratings, or platform access.

## Administrative & Oversight Features

Administrative functions provide comprehensive oversight of platform activity. Administrators can view all registered users with search and filtering capabilities by role (admin, tutor, learner) and year level, and can activate or deactivate user accounts, which prevents or restores login access and triggers email notifications. The tutor verification process allows administrators to review pending applications showing applicant name, year level, subject expertise, and bio, with the ability to approve or reject applications. Rejected tutors can be re-approved from the rejected applications tab.

Session management enables administrators to view all sessions with search and filtering by status (pending, accepted, completed, cancelled), view session details including participants, subject, duration, and timestamps, and access detailed session logs for completed sessions. Live monitoring functionality allows administrators to observe active sessions in real-time, viewing video feeds, whiteboard activity, and chat messages invisibly to participants, intended for quality assurance and investigation purposes only.

Learning resource management provides administrators with a review interface for pending resources showing title, description, uploader information, file type, and upload date, with preview functionality and the ability to approve or reject resources. Approved resources become available in the platform-wide resource library, while rejected resources trigger notifications to uploaders.

Platform analytics display key metrics including total users, new user growth, session statistics, completion rates, popular subjects, tutor performance trends, and learner engagement patterns, supporting data-driven decision-making and institutional reporting.


## System & Infrastructure Context

From a system and infrastructure perspective, TechConnect is built using React with TypeScript for type safety and Vite as the build tool for fast development and optimized production builds. The user interface is styled using Tailwind CSS with shadcn/ui component library built on Radix UI primitives, ensuring responsive design and accessibility. The frontend is hosted on Vercel, which provides automatic deployments from the project repository, edge network distribution for global performance, serverless functions for API endpoints, and SSL certificates for secure HTTPS communication.

Supabase serves as the primary backend infrastructure, providing PostgreSQL database for relational data storage with row-level security policies, authentication service with email verification and encrypted password storage, file storage for learning materials and donation QR codes with access control, real-time WebSocket subscriptions for in-app notifications and live updates, and edge functions for server-side operations including email sending via Resend API integration. All data is transmitted over HTTPS and encrypted at rest, while database queries implement indexing and pagination to maintain performance under load.

Video communication is facilitated through PeerJS, a WebRTC wrapper library that handles peer-to-peer signaling, connection establishment, and media stream management, enabling direct browser-to-browser video calls without requiring centralized video servers. This architecture provides cost efficiency and low latency but may encounter connectivity challenges with restrictive network configurations or firewalls.

Email notifications are sent through Resend service via Supabase Edge Functions, supporting transactional emails for session events, tutor verification status, and system notifications. The platform implements a continuous integration and deployment pipeline through Vercel's Git integration, enabling automated deployment of updates and consistent delivery of new features with zero-downtime deployments.

---

## Key Corrections Made:

**Removed Inaccurate Features:**
- ❌ "Study Buddy" and "Learning Buddy" role classifications (not implemented)
- ❌ Automated certificate generation (not implemented)
- ❌ Badges system (Top Tutor, Resource Contributor) (not implemented)
- ❌ Credential summary generation (not implemented)
- ❌ Events calendar system (not implemented)
- ❌ Audit logs for admin actions (not implemented)
- ❌ Report generation/download tools (not implemented)
- ❌ Next.js framework (not used)
- ❌ Node.js functions (not used)
- ❌ Hostinger hosting (not used)

**Added Actual Features:**
- ✅ Fuzzy search with Levenshtein distance algorithm
- ✅ Rule-based filtering (subject, year level, online status, rating)
- ✅ Instant sessions (10-60 minutes)
- ✅ Feedback tags (10 predefined categories)
- ✅ Donation QR code system (upload/view)
- ✅ Performance statistics dashboards
- ✅ Live session monitoring (admin)
- ✅ Whiteboard with drawing tools and actions
- ✅ In-session chat and file sharing
- ✅ Screen sharing
- ✅ Email notifications via Resend
- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS + shadcn/ui
- ✅ Vercel hosting
- ✅ PeerJS for WebRTC
- ✅ Waiting room for tutors to admit learners

**Corrected Descriptions:**
- Changed from "matching" to "discovery and selection"
- Emphasized learner autonomy
- Removed automated features that don't exist
- Added accurate technical stack details
- Clarified peer-to-peer video architecture

