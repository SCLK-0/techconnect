# Research Methodology (Revised)

This study employed a developmental research design, as the primary goal is to design, build, and evaluate TechConnect, a web-based peer tutoring platform tailored to the needs of the College of Industrial Technology (CIT) at Southern Luzon State University (SLSU). Developmental research is appropriate because it focuses on producing a functional system that directly addresses real-world academic challenges and validating its effectiveness through iterative design, testing, and refinement. The development process is guided by an Agile–Kanban approach, which supports flexibility, continuous improvement, and responsiveness to user feedback, ensuring that each development cycle delivers incremental progress while allowing for adjustments based on the needs of CIT students, tutors, and administrators.

TechConnect is designed to resolve the limitations of the existing Peer Assisted Learning (PAL) program by providing a structured and specialized academic support platform. Its features include tutor discovery through fuzzy search using a custom Levenshtein distance algorithm and rule-based filtering by subject expertise, year level, online availability, and rating thresholds, enabling learners to independently browse and select tutors that match their needs. The platform supports flexible scheduling with both scheduled and instant session requests, allowing learners to book sessions in advance or connect immediately with online tutors. Real-time video communication is facilitated through peer-to-peer WebRTC connections via PeerJS, with integrated whiteboard functionality for visual collaboration, in-session chat messaging, screen sharing capabilities, and file sharing. The system provides centralized resource management through a digital library where tutors upload learning materials subject to administrative approval, and learners can browse, bookmark, and download resources. A comprehensive feedback system with predefined rating tags (Clear Explanations, Patient & Friendly, Well Prepared, etc.) allows learners to provide structured qualitative feedback that supplements numerical ratings.

To encourage tutor participation, the platform incorporates performance tracking through comprehensive statistics dashboards showing session counts, average ratings, total reviews, and engagement metrics that tutors can use for resume-building and self-improvement. A voluntary donation module allows learners to financially appreciate tutors through QR code-based contributions, with tutors able to upload and manage their own donation QR codes. The platform equips administrators with tools for verifying tutor applications with approval or rejection workflows, monitoring live sessions in real-time (invisible to participants), approving learning materials, posting announcements to all users, viewing platform analytics, and managing user accounts through activation and deactivation capabilities, thereby enhancing institutional oversight and coordination.

To ensure quality and reliability, the platform will be evaluated using the ISO 25010 software quality model, focusing on functional suitability, performance efficiency, compatibility, interaction capability, reliability, security, maintainability, flexibility, and safety. The evaluation process will involve feedback from stakeholders—CIT students, tutors, faculty members, and administrators—during pilot implementation. Their input will guide refinements to the system's features, user interface, and performance. By integrating modern web technologies such as React, TypeScript, Vite for frontend development, Tailwind CSS with shadcn/ui for responsive user interface design, Supabase for backend services (PostgreSQL database, authentication with email verification, file storage, real-time WebSocket subscriptions, and edge functions), Vercel for hosting with automatic deployments and edge network distribution, PeerJS for peer-to-peer video communication, and Resend for email notifications, TechConnect not only strengthens peer-assisted learning but also establishes a scalable model for academic support initiatives within SLSU.

---

## Key Corrections Made:

**Removed Inaccurate Features:**
- ❌ Google Calendar and Google Meet integration (not implemented)
- ❌ "Study Buddy" and "Learning Buddy" role differentiation (not in system)
- ❌ Certificates as incentives (not implemented)
- ❌ Tutor–tutee matching algorithm (learners browse and select)
- ❌ Node.js (not used)

**Added Actual Features:**
- ✅ Fuzzy search with Levenshtein distance algorithm
- ✅ Rule-based filtering (subject, year level, online status, rating)
- ✅ Instant sessions (10-30 minutes)
- ✅ PeerJS for WebRTC video communication
- ✅ Integrated whiteboard, chat, screen share, file sharing
- ✅ Feedback tags (10 predefined categories)
- ✅ Performance statistics dashboards
- ✅ Donation QR code system
- ✅ Live session monitoring (admin)
- ✅ Email notifications via Resend
- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS + shadcn/ui
- ✅ Supabase backend
- ✅ Vercel hosting

**Corrected Technical Stack:**
- React + TypeScript + Vite (not Next.js)
- Tailwind CSS + shadcn/ui (added)
- Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- Vercel (not Hostinger)
- PeerJS (not Google Meet)
- Resend (for emails)



---

## Problem Statement (Revised)

The peer-tutoring landscape at Southern Luzon State University (SLSU) rests almost entirely on informal networks and manual coordination, creating challenges that ripple through student support. Learners who need assistance typically wait for a classmate's recommendation or chance upon a bulletin-board post before they can secure a tutor. While the Learning Development Center's Peer-Assisted Learning (PAL) programme does provide general academic help, it operates without a central digital platform, automated scheduling system, or notification mechanism. Sessions are announced sporadically and filled on a first-come, first-served basis, leaving many students uncertain about availability and next steps. This ad-hoc model may work for small study circles, but it cannot guarantee consistent tutor quality, subject-specific discovery, or reliable record-keeping as the university's enrollment grows.

Incorporating a centralized digital platform that enables learners to discover and select tutors through intelligent search and filtering would streamline operations, improve service quality, and allow SLSU to track outcomes and refine its support strategies. Rather than relying on automated matching algorithms that may not account for learner preferences and autonomy, TechConnect empowers learners to browse verified tutors using fuzzy search (which accommodates typographical errors and partial matches through Levenshtein distance calculation) and apply rule-based filters by subject expertise, year level, online availability, and rating thresholds. This learner-driven approach ensures that students retain control over tutor selection while benefiting from structured discovery tools, verified tutor profiles with ratings and reviews, flexible scheduling options including instant session requests for immediate help, real-time video collaboration with integrated whiteboard and chat functionality, and comprehensive administrative oversight through tutor verification, resource approval, and session monitoring capabilities.

By addressing the limitations of informal coordination and providing a structured yet flexible platform tailored to the College of Industrial Technology's specific needs, TechConnect establishes a sustainable model for peer-assisted learning that balances learner autonomy with institutional quality assurance, enabling SLSU to scale academic support services while maintaining accountability and continuous improvement through data-driven insights.

---

## Key Corrections:

**Original Issues:**
- ❌ Mentioned "smart-matching platform" (implies automatic matching)
- ❌ Suggested system "pairs tutees with tutors" (not accurate)

**Corrected Approach:**
- ✅ Emphasizes learner-driven discovery and selection
- ✅ Describes fuzzy search with Levenshtein distance
- ✅ Explains rule-based filtering (not matching)
- ✅ Highlights learner autonomy and control
- ✅ Mentions instant sessions for immediate help
- ✅ Includes real-time collaboration features
- ✅ Adds administrative oversight capabilities
- ✅ Maintains academic tone while being accurate

