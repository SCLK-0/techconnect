# Chapter V - Corrections Needed

## Issues Found:

### 1. **Fuzzy Search and Rule-Based Filtering - Needs Clarification**
**Status:** ✅ You DO have fuzzy search and rule-based filtering, but the wording needs adjustment

**Current (slightly misleading):**
"Its fuzzy search and rule-based filtering allow accurate pairing based on subjects, availability, ratings, and learning preferences"

**Issue:** The word "pairing" implies automatic matching, but your system uses learner-driven selection.

**Corrected:**
"Its fuzzy search with rule-based scoring and filtering capabilities allow learners to find and select tutors based on subjects, availability, ratings, and learning preferences, with search results ranked by relevance"

**What you actually have:**
- ✅ Fuzzy search using Levenshtein distance algorithm
- ✅ Rule-based scoring to rank search results (calculateMatchScore)
- ✅ Rule-based filtering by subject, rating, online status, year level
- ❌ NOT automatic matching - learners manually select tutors after searching/filtering

---

### 2. **Technology Stack Inaccuracies**
**Problem:** "Built with Node.js, npm, Tailwind CSS, React, and deployed on Vercel"

**Issue:** Missing key technologies and slightly misleading about Node.js role.

**Correction:** "Built with React, Vite, TypeScript, PeerJS, Tailwind CSS, and Supabase, and deployed on Vercel, the platform offers responsive interfaces and stable operations."

---

### 3. **Google Calendar Integration**
**Problem:** "Integrated with Google Calendar for scheduling"

**Issue:** You don't have Google Calendar integration. You have a custom scheduling system.

**Correction:** "With custom scheduling functionality and WebRTC for video conferencing, the platform ensures seamless communication, easy access to virtual sessions, and automatic reminders for users."

---

### 4. **Terminology: Tutee vs Learner**
**Problem:** Multiple instances of "tutee" and "tutor–tutee"

**Issue:** Your system uses "Learner" not "Tutee"

**Correction:** Change all instances:
- "tutor–tutee matching" → "tutor–learner matching"
- "tutees" → "learners"
- "Tutor, Learner, and Administrator" (already correct in some places)

---

### 5. **PWA Claims**
**Problem:** "TechConnect integrates modern web technologies with Progressive Web App (PWA) standards"

**Issue:** Do you actually have PWA implementation? (service workers, offline capability, installability?)

**If NO PWA:** Remove PWA mention entirely
**If YES PWA:** Keep it but be specific about what PWA features you implemented

---

### 6. **Automated Tutor Suggestions Recommendation**
**Problem:** "Explore integrating advanced features such as automated tutor suggestions using recommendation algorithms"

**Issue:** This contradicts your learner-driven selection approach which is a core design principle

**Better Recommendation:** "Explore enhancing the filtering and search capabilities with additional criteria such as learning style preferences, subject sub-categories, or tutor specializations to further support learner-driven selection."

---

### 7. **Missing Key Features in Findings**
**Problem:** Findings don't mention several important features

**Add:**
- Peer-to-peer video communication (WebRTC/PeerJS)
- Real-time collaboration tools (whiteboard, chat)
- QR code-based voluntary donations
- Structured feedback with 11 predefined tags
- Learning resource repository with admin approval

---

## Corrected Sections:

### FINDINGS (Corrected Version):

**Paragraph 1:**
TechConnect features an intuitive, user-centered interface that enables CIT students to navigate peer tutoring functions such as learner-driven tutor selection, session scheduling, learning material access, and session tracking. Its fuzzy search with rule-based scoring and filtering capabilities allow learners to find and select tutors based on subjects, availability, ratings, and feedback, with search results ranked by relevance using Levenshtein distance algorithm. Role differentiation between Tutor, Learner, and Administrator enhances workflow clarity and accountability. With custom scheduling functionality and WebRTC-based peer-to-peer video conferencing, the platform ensures seamless communication, easy access to virtual sessions with real-time collaboration tools (interactive whiteboard and chat), and automatic reminders for users.

**Paragraph 2:**
TechConnect is a web-based system accessible on desktops, laptops, tablets, and phones with a modern browser and stable internet. Key features use Supabase for authentication, storage, real-time sync, and notifications, ensuring secure and reliable performance. Built with React, Vite, TypeScript, PeerJS, Tailwind CSS, and Supabase, and deployed on Vercel, the platform offers responsive interfaces and stable operations. The peer-to-peer video architecture eliminates the need for centralized video servers, while real-time collaboration tools enhance the tutoring experience. While some real-time features depend on internet connectivity, these did not significantly affect performance during testing or deployment.

**Paragraph 3:**
TechConnect delivers reliable performance in line with ISO 25010 standards, supporting learner-driven tutor selection, session scheduling, secure login, peer-to-peer video sessions with real-time collaboration, and access to learning resources. Its responsive design ensures smooth use across devices and browsers, while Supabase authentication maintains data security. The platform includes structured feedback mechanisms with eleven predefined tags, voluntary QR code-based donations for tutor appreciation, and an admin-moderated resource repository. The modular system supports maintenance, future enhancements, and complies with ISO 25010:2023 safety principles, confirming readiness for college-wide deployment.

**Paragraph 4:**
TechConnect was successfully deployed and tested within the College of Industrial Technology, demonstrating stable and efficient performance across desktops, laptops, and mobile devices. Functional, performance, usability, and compatibility testing confirmed that core features, such as learner-driven tutor selection, session scheduling, peer-to-peer video conferencing with real-time collaboration tools, and access to learning materials, operated reliably and met user expectations. Feedback from students, faculty, and administrators guided minor enhancements, resulting in a user-friendly and fully operational peer tutoring platform.

---

### CONCLUSIONS (Corrected Version):

**Paragraph 1:**
The College of Industrial Technology faced challenges in managing peer tutoring, including inconsistent tutor–learner connections, limited session monitoring, and dispersed learning resources. To address these issues, the researchers developed TechConnect, a web-based platform that centralizes tutoring management, including session scheduling, learner-driven tutor selection, resource access, and progress tracking. The system offers a structured, accessible solution for students, tutors, and administrators to manage tutoring activities efficiently. Emphasis was placed on creating a user-friendly interface compatible with multiple devices, ensuring responsive performance across platforms. Continuous testing, feedback from users, and expert assessments helped refine the interface, functionality, and overall performance. Evaluation using ISO/IEC 25010 standards confirmed that TechConnect meets acceptable levels for all key software quality characteristics, proving reliable and effective for supporting peer tutoring in the College of Industrial Technology.

**Specific Conclusions (Corrected):**

1. The use of TechConnect is beneficial as it provides an intuitive and user-friendly platform that supports learner-driven tutor selection, session booking, peer-to-peer video communication with real-time collaboration tools, and resource sharing. It offers efficient tools that enhance communication, academic support, and accessibility between tutors and learners. Additionally, the system's design and features align with the needs of CIT learners and tutors, enabling seamless and effective academic assistance within the platform.

2. TechConnect integrates modern web technologies including React, Vite, TypeScript, PeerJS, and Supabase, ensuring compatibility across a wide range of devices, including desktops, laptops, tablets, and mobile phones. This allows students, tutors, and administrators to access tutoring schedules, learning resources, and session data anytime and anywhere, providing flexible and continuous academic support regardless of location or device.

3. The ISO/IEC 25010 evaluation results indicate that TechConnect meets acceptable standards for functional suitability, performance efficiency, reliability, security, maintainability, and usability, as reported by both end-users and IT experts. These findings demonstrate that the system effectively supports real-world peer tutoring operations, ensuring smooth management of sessions, tutor-learner interactions, and academic resources.

4. The system was successfully implemented and deployed using the requirements gathered from users and ensuring compatibility across various devices. The final evaluation demonstrated that TechConnect meets academic needs by providing a reliable, efficient, and user-friendly system for learner-driven tutor selection, session scheduling, peer-to-peer video conferencing with real-time collaboration tools, and access to learning resources.

---

### RECOMMENDATIONS (Corrected Version):

TechConnect is a web-based peer tutoring platform developed to assist students within the College of Industrial Technology by providing an organized, accessible, and user-friendly system for academic support. It effectively connects tutors and learners, schedules sessions, and enhances communication within the academic environment of CIT. With the goal of further improving the system's functionality and user experience, the researchers offer several recommendations.

1. Explore enhancing the filtering and search capabilities with additional criteria such as learning style preferences, subject sub-categories, or tutor specializations to further support learner-driven selection and improve the accuracy of learner-tutor matching.

2. Expand the platform's capability to support additional programs or departments within the institution, allowing other colleges or courses to utilize TechConnect as a unified academic assistance system.

3. Broaden the system's capabilities by incorporating group tutoring sessions, integrated quizzes, and performance monitoring tools that help learners track their progress and identify areas for improvement.

4. Enhance the real-time collaboration tools by adding features such as screen sharing capabilities, file sharing during sessions, and session recording for review purposes.

5. Future studies and usability evaluations should focus on adding new features, enhancing user experience, and adapting the system to evolving academic needs and technologies. Continuous monitoring will ensure that TechConnect remains effective, relevant, and flexible in supporting peer tutoring activities.

---

## Summary of All Changes Needed:

1. ⚠️ Clarify "fuzzy search and rule-based filtering" - you have it, but change "pairing" to "find and select" to emphasize learner-driven approach
2. ✅ Keep fuzzy search (Levenshtein distance) and rule-based scoring/filtering - these are accurate
3. ❌ Remove "Google Calendar integration" - you have custom scheduling
4. ❌ Remove or clarify "PWA standards" - only if you actually implemented PWA
5. ✅ Add "React, Vite, TypeScript, PeerJS" to tech stack
6. ✅ Add "peer-to-peer video" and "real-time collaboration tools"
7. ✅ Add "QR code-based donations" and "structured feedback tags"
8. ✅ Change all "tutee" to "learner"
9. ✅ Change all "tutor–tutee" to "tutor–learner"
10. ✅ Update recommendations to align with learner-driven approach
