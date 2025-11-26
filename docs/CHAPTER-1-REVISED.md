# Chapter I

## INTRODUCTION

For many students in technical fields such as industrial technology, academic challenges extend beyond understanding complex concepts—they also involve adapting to intensive workloads, varying course structures, and a lack of personalized support. While traditional classroom instruction provides the core foundation of learning, it often falls short in meeting the individual needs of students who may be struggling with specific subjects or balancing academic responsibilities with hands-on technical requirements. In a highly practical and skill-driven environment like the College of Industrial Technology (CIT) at Southern Luzon State University (SLSU), the need for flexible and targeted academic assistance is more important than ever.

Peer tutoring has emerged as a powerful educational strategy that offers a solution to this gap. It enables students to support one another through structured academic assistance, building a culture of collaboration, shared responsibility, and mutual growth. Research has shown that peer tutoring helps reinforce subject mastery, boosts confidence, and fosters meaningful academic relationships among students (Paolillo, 2024). However, while the concept is widely recognized, the way it is implemented, particularly in technical programs, often lacks the structure and specialization needed to truly make an impact.

At SLSU, the Peer Assisted Learning (PAL) program is the existing framework for tutoring. However, it operates on a generalized level, which limits its effectiveness for CIT students who face specialized challenges across diverse technical fields. These programs demand more than general academic support—they require a tutoring environment that is tailored, adaptive, and built to match the rigor and diversity of technical coursework.

In response to these challenges, the proponents propose TechConnect, a web-based peer tutoring platform designed specifically for the College of Industrial Technology. The system aims to centralize and simplify the peer tutoring process by offering intelligent features such as fuzzy search for tutor discovery, rule-based filtering by subject expertise, year level, online status, and ratings, flexible scheduling with support for both scheduled and instant sessions, real-time video communication with integrated whiteboard and chat functionality, and a resource hub for study materials. The platform empowers learners to browse and select tutors based on their specific needs, while providing dashboards for activity tracking and performance analytics.

The development of TechConnect is guided by established quality standards such as ISO 25010, ensuring that the platform meets essential criteria for functional suitability, interaction capability, performance efficiency, reliability, security, and maintainability. By integrating these variables into the design and evaluation of the system, the project not only addresses current limitations in peer tutoring within CIT but also lays the groundwork for future scalability and institutional integration.

More than just a technical solution, TechConnect represents a step toward reimagining academic support at CIT, making it more student-centered, efficient, and aligned with the college's unique learning environment.

## Background of the Study

Students in technical programs such as those offered by the College of Industrial Technology (CIT) at Southern Luzon State University (SLSU) face unique academic challenges that go beyond traditional classroom instruction. With hands-on subjects, evolving curricula, and rigorous skill-based requirements, many CIT students struggle to find the personalized academic support they need to succeed. Although peer tutoring is widely acknowledged as an effective way to reinforce learning, boost academic confidence, and promote collaboration among students (Paolillo, 2024), the current support structures within the university fall short of meeting these specialized needs.

The university's Peer Assisted Learning (PAL) program, facilitated by the Learning Development Center, aims to provide general academic support to all students. However, its broad and non-specialized scope often results in low visibility and limited relevance for CIT students. As a result, students in technical disciplines are left without structured, subject-specific assistance tailored to their coursework.

Several key problems highlight the need for a more focused and responsive academic support system within the College of Industrial Technology. One major issue is the **lack of tailored academic support**. The existing Peer Assisted Learning (PAL) program does not adequately reflect the technical complexity of CIT's diverse programs. Students enrolled in both legacy and newly implemented curricula often have distinct academic needs that are not sufficiently addressed by the current generalized support system.

Another pressing concern involves **tutor recruitment and engagement**. Encouraging qualified students to participate as peer tutors remains a challenge, largely due to the absence of meaningful incentives. Participation tends to be inconsistent and unsustainable without formal recognition. Feedback from the CIT Student Council suggests that incentives such as performance tracking, resume-building opportunities through documented statistics, and official recognition are crucial to motivating and retaining student tutors.

In addition, there is a clear problem with **unstructured resource and session management**. The lack of a centralized platform to organize tutoring sessions, share learning materials, or document academic progress creates inefficiencies. Tutors have limited tools for uploading content or tracking learner development, while students struggle to find accessible review resources. The absence of real-time communication tools further complicates coordination between tutors and learners.

Peer tutoring within CIT is also **fragmented and informal**, often relying on personal arrangements rather than a coordinated system. This disorganization diminishes the potential impact of tutoring and weakens accountability among both tutors and learners. Students seeking immediate assistance have no mechanism for instant session requests, forcing them to wait for scheduled appointments even when tutors are available.

Finally, the **absence of a digital platform** results in limited administrative oversight and analytics. Faculty and department heads currently lack effective tools to monitor session activities, evaluate tutor performance, or analyze academic trends, all of which are essential for informed academic planning and support.

These gaps hinder the academic success and engagement of CIT students. Studies have shown that unstructured peer mentoring programs are less effective in improving student productivity and well-being (Murrell & Blake-Beard, 2021; Nwaesei & Liao, 2023). A structured, technology-driven system is therefore critical to addressing these inefficiencies.

In response to these challenges, this capstone project proposes the development of TechConnect, a web-based peer tutoring platform exclusively for the College of Industrial Technology. The system is designed to streamline the peer tutoring process by enabling learners to discover and select tutors through a custom fuzzy search algorithm that combines priority matching (exact, prefix, and substring matching) with Levenshtein distance calculation for approximate string matching, along with rule-based filtering by subject expertise, year level, online availability, and rating thresholds. The platform provides subject tagging for tutor expertise identification, flexible scheduling with both scheduled and instant session support, real-time video communication powered by WebRTC technology, integrated whiteboard and chat features for collaborative learning, progress tracking through session history and feedback analytics, and centralized access to academic resources. The platform provides performance tracking through comprehensive statistics dashboards that tutors can use for resume-building and self-improvement, while a voluntary donation module allows learners to financially appreciate tutors through QR code-based contributions.

By aligning with the academic environment of CIT and leveraging modern web technologies including React, TypeScript, Vite for frontend development, Tailwind CSS with shadcn/ui for responsive user interface design, Supabase for backend services, Vercel for hosting, and PeerJS for peer-to-peer video communication, TechConnect offers a tailored solution that empowers students, supports tutors, and enhances institutional coordination of peer tutoring activities.

## Objectives of the Study

The main objective of the project is to provide an academic support solution tailored to the needs of the College of Industrial Technology by creating a structured, accessible, and efficient peer tutoring environment through a web-based system.

Specifically, it aims to:

1. **Design and develop a web-based platform called TechConnect: A Peer Tutoring Platform for the College of Industrial Technology**, which will be capable of:

   - Providing an efficient peer tutoring platform that allows students to securely create profiles with email verification, indicate academic needs or tutoring expertise through subject tagging, browse and search for available tutors using a custom fuzzy search algorithm that prioritizes exact matches, prefix matches, and substring matches before applying Levenshtein distance for approximate matching (enabling tutor discovery even with typographical errors), and apply rule-based filters to narrow results by subject specialization, year level, online availability status, and minimum rating thresholds.

   - Empowering learners to independently discover and select tutors that best match their learning needs, with the ability to view tutor profiles, ratings, reviews, subject expertise, and availability before requesting sessions.

   - Facilitating real-time video communication through peer-to-peer WebRTC connections, integrated whiteboard functionality for visual collaboration, and in-session chat messaging for seamless tutor-learner interaction.

   - Allowing tutors to upload review materials, session notes, and learning resources with administrative approval, and enabling learners to browse, bookmark, and download resources from the centralized repository.

   - Providing a dashboard that visualizes tutoring activity, session history, feedback summaries with rating tags, and performance metrics to support self-improvement and data-driven decisions.

   - Enabling administrators to manage user accounts, verify tutor applications with approval or rejection workflows, monitor tutoring sessions, post announcements and events, and oversee learning material submissions.

   - Supporting a voluntary donation system where learners can contribute to tutors through QR code-based payments, with tutors able to upload and manage their donation QR codes.

   - Addressing tutor recruitment challenges by providing comprehensive performance statistics dashboards for resume-building, including session analytics, rating tracking, and engagement metrics that tutors can showcase for academic or professional purposes.

2. **Evaluate the TechConnect system** to determine if it complies with the ISO 25010 standards in terms of:

   - Functional Suitability
   - Performance Efficiency
   - Compatibility
   - Interaction Capability
   - Reliability
   - Security
   - Maintainability
   - Flexibility
   - Safety

3. **Prepare an implementation plan** for the deployment of TechConnect.

## Significance of the Study

The capstone project titled TechConnect: A Peer Tutoring Platform for the College of Industrial Technology is designed to improve access to academic support by offering a structured and technology-enabled environment for peer-assisted learning. By addressing existing limitations in tutoring coordination and student engagement, the system aims to enhance educational outcomes and foster a collaborative learning culture within CIT. The project is expected to benefit the following:

**University Leaders** will benefit from the project as it aligns with Southern Luzon State University's broader mission of academic innovation and student success. By introducing a scalable, data-informed tutoring framework, the platform provides a model for academic support that can extend beyond CIT to other departments. The system's analytics capabilities offer insights into student engagement patterns and academic support effectiveness.

**CIT Administrators** are equipped with a centralized system to oversee tutoring operations, monitor performance metrics through comprehensive dashboards, manage tutor verification processes, and ensure the effective delivery of peer-led academic services. The platform enables administrators to post announcements, organize events, approve learning materials, and track session activities in real-time. This strengthens the college's institutional support mechanisms and reinforces its commitment to high-quality technical education.

**Faculty Members** gain a complementary tool that helps address basic academic concerns, allowing them to focus on advanced instruction. With access to session feedback, rating tag analytics, and performance trends, faculty can identify common learning challenges, recognize effective tutors for potential teaching assistant roles, and adjust teaching strategies based on data-driven insights into student needs.

**CIT Students**, as the primary users, benefit from accessible and personalized academic assistance tailored to their subject needs. Learners receive structured support through scheduled sessions or immediate help via instant session requests, access to curated learning materials, real-time video collaboration with whiteboard and chat features, and the ability to provide detailed feedback with rating tags. Tutors reinforce their understanding of course material, develop leadership and communication abilities, build their academic portfolio through documented performance statistics and session analytics, and engage in meaningful academic service while potentially receiving voluntary donations as recognition for their efforts.

**CIT Tutors** are empowered through skill-building opportunities and resume-enhancing features such as comprehensive performance statistics dashboards showing session counts, average ratings, total reviews, and engagement metrics that can be used to demonstrate their tutoring experience. The platform provides them with professional tools for session management, availability scheduling, material uploads, and performance tracking. The integrated video session features with whiteboard and chat enable effective remote tutoring, while the donation module offers optional financial appreciation from satisfied learners.

**Researchers** gain valuable experience in full-stack web development, system analysis, user experience design, database architecture, real-time communication implementation, and academic writing, while deepening their understanding of how peer tutoring platforms can positively influence student outcomes. The project provides practical exposure to modern web technologies, agile development methodologies, and software quality evaluation frameworks.

**Future Researchers** may use this study as a reference for further exploration of web-based academic platforms, peer-assisted learning systems, educational technology integration, or real-time collaborative tools. The structure, methodology, and findings of this project may guide similar initiatives in other colleges and institutions seeking to implement technology-driven academic support systems.

## Scope and Limitation

This project is bounded by several practical constraints that shaped both design and implementation. A key challenge lies in sustaining consistent tutor availability, since participation is voluntary despite the platform's performance tracking features and optional donation system that may motivate continued engagement. During peak academic periods such as midterms and finals, tutor activity is expected to decline as students prioritize their own coursework, which may lead to temporary service gaps. The platform addresses this through instant session requests and online status indicators, but cannot guarantee tutor availability at all times.

The platform must also address the complexities of CIT's dual curriculum system, where legacy and updated program structures coexist, requiring ongoing adjustments to subject tags and tutor expertise mappings. The system's fuzzy search and flexible tagging architecture accommodate this complexity, but administrators must periodically review and update subject classifications as curricula evolve.

Technical limitations arise from the system's reliance on external services, particularly Supabase for authentication, PostgreSQL database management, file storage, real-time WebSocket notifications, and edge functions, as well as PeerJS for WebRTC signaling in peer-to-peer video sessions. These dependencies impose restrictions such as service availability, potential latency in real-time features, and scalability considerations if platform usage increases significantly. Hosting on Vercel, while providing excellent performance through edge network distribution and serverless functions, operates within free tier limitations that may require upgrade considerations as user base grows.

Certain design trade-offs were made to ensure timely project delivery. TechConnect was developed as a standalone system rather than integrated with the university's IT infrastructure, requiring users to register separately with email verification instead of leveraging institutional single sign-on. While this decision simplified development and deployment, it added an extra onboarding step. Similarly, features such as offline access, native mobile applications, and fully automated content moderation were excluded due to resource and time constraints.

Video communication relies on peer-to-peer WebRTC connections through PeerJS rather than centralized video servers, which provides cost efficiency and low latency but may encounter connectivity challenges with restrictive network configurations or firewalls. The system does not integrate with external calendar services or third-party video conferencing platforms, instead providing its own scheduling and video session infrastructure.

Notifications are delivered through two channels: in-app notifications via Supabase Realtime WebSocket connections for immediate alerts when users are active on the platform, and email notifications via Resend service for important events such as session requests, session acceptances/rejections, session reminders, tutor verification status, and session cancellations. The system maintains notification history for later viewing, ensuring users stay informed even when not actively using the platform. However, push notifications to mobile devices are not currently implemented.

The donation module, though functional via QR code image uploads and display, remains basic and does not include automated payment tracking, transaction verification, or integration with payment gateways. It serves as a voluntary appreciation mechanism rather than a formal payment system, with tutors responsible for managing their own QR codes and verifying donations independently.

Administrative functions such as tutor verification, event management, and learning material approval continue to rely on manual oversight through the admin dashboard, as full automation was beyond project scope. Administrators must review tutor applications, approve or reject materials, and moderate content to ensure quality and appropriateness.

The whiteboard feature provides basic drawing, text, and shape tools for collaborative visual learning during video sessions, but does not include advanced features such as mathematical equation editors, diagram templates, or persistent multi-session canvases. Whiteboard states are saved per session but are not designed for long-term collaborative document editing.

Despite these limitations, TechConnect successfully delivers a comprehensive peer tutoring ecosystem for CIT, with a modular architecture built on React, TypeScript, Tailwind CSS, and modern web technologies that supports future performance improvements, feature enhancements, and potential integration with institutional systems as resources permit. The platform's use of Supabase for backend services and Vercel for hosting provides a solid foundation for scalability and maintenance.

## Definition of Terms

The following terms are defined conceptually and operationally to support clear understanding of the variables and technical elements used in this study:

**Administrator** is a user role within TechConnect responsible for managing user accounts, verifying tutor applications, overseeing session activities, approving learning materials, posting announcements and events, and monitoring overall platform activity through administrative dashboards.

**Deployment** is the process of launching the finalized platform online, making it accessible to users through Vercel's hosting infrastructure with continuous integration and automatic deployments from the project repository.

**Feedback Tags** are predefined categorical labels that learners can select when rating tutors, such as "Clear Explanations," "Patient," "Well Prepared," or "Helpful Materials." These tags provide structured, qualitative feedback that supplements numerical ratings and helps identify specific tutor strengths.

**Fuzzy Search** is a custom approximate string matching technique that combines multiple matching strategies to help learners find tutors even with typographical errors or partial input. The algorithm first checks for exact matches (100% score), prefix matches (90% score), and substring matches (70% score). If these don't apply, it calculates Levenshtein distance—measuring the minimum number of single-character edits (insertions, deletions, substitutions) required to transform one string into another—and converts this to a similarity percentage. Results are then ranked by weighted scores that consider both tutor name and subject expertise matches, enhancing search accuracy and user experience.

**Implementation** is the execution phase where the system is developed using React, TypeScript, Vite for the frontend build tooling, Tailwind CSS for styling, Supabase for backend services, and PeerJS for video communication, then tested with actual users, and prepared for deployment.

**Instant Session** is a real-time tutoring request feature that allows learners to immediately connect with online tutors without prior scheduling. Tutors indicate their availability through online status toggles, and learners can request instant sessions which tutors can accept or decline in real-time.

**ISO 25010** is an international software quality model used to evaluate the platform based on criteria such as functional suitability, performance efficiency, compatibility, interaction capability, reliability, security, maintainability, flexibility, and safety.

**PeerJS** is a WebRTC wrapper library that simplifies peer-to-peer video communication by handling signaling, connection establishment, and media stream management. It enables direct browser-to-browser video calls without requiring centralized video servers.

**Progress Tracking** is a system feature that monitors and displays a student's academic development based on session participation history, feedback received, rating trends, and engagement metrics visualized through dashboard analytics.

**Resource Hub** is a centralized section of the platform where tutors upload study materials, review notes, and learning resources subject to administrative approval. Learners can browse, search, bookmark, and download materials organized by subject and tutor.

**Rule-based Filtering** is a filtering system that allows learners to narrow down tutor search results based on predefined criteria such as subject expertise, year level compatibility, minimum rating thresholds, and online availability status. Learners can apply multiple filters simultaneously to find tutors that meet their specific requirements, with the system displaying only tutors who satisfy all selected filter conditions.

**Supabase** is an open-source backend-as-a-service platform that provides PostgreSQL database, authentication with email verification, file storage, real-time WebSocket subscriptions, and edge functions. It serves as the primary backend infrastructure for TechConnect.

**Tutor** is a student user who provides academic assistance to peers by conducting tutoring sessions, uploading learning materials, setting availability schedules, and maintaining an online presence for instant session requests. Tutors must undergo verification by administrators before being approved to offer sessions.

**Tutor Tagging** is a labeling system where tutors specify their subject expertise through tags corresponding to CIT courses and topics. These tags enable learners to filter and discover tutors with relevant expertise, improving search relevance and helping learners find tutors qualified in their specific subject areas.

**Learner** is a student user who seeks academic support through the platform by browsing available tutors, requesting scheduled or instant sessions, participating in video sessions with whiteboard and chat features, accessing learning materials, and providing feedback with rating tags.

**User Roles** are defined access levels and responsibilities within the platform: Administrator (system management and oversight), Tutor (verified students providing academic assistance), and Learner (students seeking academic support). Each role has specific permissions and interface features tailored to their functions.

**Vercel** is a cloud platform for static site hosting and serverless functions that provides automatic deployments, edge network distribution, SSL certificates, and performance optimization. It serves as the hosting infrastructure for TechConnect's frontend and API endpoints.

**Video Session** is a real-time peer-to-peer video communication feature powered by WebRTC through PeerJS, enabling tutors and learners to conduct face-to-face tutoring sessions with integrated whiteboard for visual collaboration, chat messaging for text communication, screen sharing capabilities, and file sharing functionality.

**Whiteboard** is an interactive canvas tool integrated within video sessions that allows tutors and learners to collaboratively draw diagrams, write equations, sketch concepts, and visualize ideas in real-time. The whiteboard state is synchronized between participants and saved to the database for session records.

