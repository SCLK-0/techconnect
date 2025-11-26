# Chapter II Review of Related Literature - Revision Guide

## SECTIONS TO KEEP (Already Aligned with Your System)

### ✅ Keep As-Is:
1. **Digital Learning Support in the Current Generation** - Good foundation
2. **Peer Tutoring Systems in Modern Education** - Relevant and accurate
3. **Modern Web Frameworks in E-Learning** (React.js section ONLY) - Matches your tech stack
4. **Database Technologies in Educational Platforms** (Supabase & PostgreSQL) - Matches your tech stack
5. **UI/UX Design and Responsive Frameworks** (Tailwind CSS) - Matches your tech stack
6. **Acceptability Testing in Educational Technologies** - Good for your evaluation
7. **Agile-Kanban in Software Development for Education** - Matches your methodology
8. **ISO/IEC 25010 Quality Standards** - Good for evaluation framework

---

## SECTIONS TO DELETE COMPLETELY

### ❌ DELETE:
1. **"Fuzzy Logic and Approximate Matching in Educational Tools"** - ENTIRE SECTION
   - You don't use fuzzy logic
   - You don't use fuzzy string matching
   - Your system uses simple filtering only

---

## SECTIONS TO DELETE COMPLETELY

### ❌ DELETE:
2. **Next.js section in "Modern Web Frameworks in E-Learning"**
   - You use React with Vite, not Next.js
   - Keep the React.js section, delete Next.js section

---

## SECTIONS TO REVISE/SIMPLIFY

### 🔧 REVISE: "Rule-Based Filtering and Matchmaking in Peer Platforms"

**Current Problem:** 
- Too complex, mentions AI-driven matching
- Talks about sophisticated algorithms you don't use

**What to Change:**
- Simplify to focus on basic filtering (by subject, availability, rating)
- Emphasize **learner-driven selection** (not algorithmic matching)
- Remove references to "intelligent matching" and "AI tutoring systems"
- Focus on transparency and user control in tutor selection

**Keep:**
- Importance of transparent filtering
- User control in selection process
- Multi-criteria filtering (subject, availability, rating)

**Search Terms for New Literature:**
- "manual tutor selection systems"
- "user-driven filtering educational platforms"
- "transparent search and filter mechanisms"
- "learner autonomy in tutor selection"

---

### 🔧 REVISE: "API Integration in Learning Platforms"

**Current Problem:**
- Focuses on external scheduling APIs (Cronofy, Nylas) you don't use
- Mentions calendar integrations you didn't implement

**What to Change:**
- Remove references to Cronofy, Nylas, external calendar APIs
- Focus on **Supabase APIs** (authentication, database, real-time)
- Add **PeerJS signaling** for WebRTC connections
- Emphasize custom-built scheduling system

**Keep:**
- General importance of API integration
- Automation benefits
- Data synchronization concepts

**Search Terms for New Literature:**
- "Supabase API integration education"
- "real-time database APIs learning platforms"
- "custom scheduling systems educational technology"

---

### 🔧 REVISE: "Implementation Strategies" & "Deployment Practices"

**Current Problem:**
- Mentions Hostinger (you use Vercel)
- References Schoolhouse.world using Zoom (you use PeerJS/WebRTC)

**What to Change:**
- Replace Hostinger with **Vercel**
- Remove Zoom/Schoolhouse.world references
- Emphasize **peer-to-peer video** (no centralized video server)
- Add PeerJS implementation approach

**Search Terms for New Literature:**
- "Vercel deployment Next.js applications"
- "serverless deployment educational platforms"
- "edge computing education technology"

---

## NEW SECTIONS TO ADD

### ➕ ADD: "Vite as Modern Build Tool for Educational Applications"

**Why Add This:**
- Your actual build tool (not Next.js)
- Fast development experience
- Modern bundling approach

**What to Include:**
- Vite's fast HMR (Hot Module Replacement)
- Benefits for development speed
- Production build optimization
- Comparison with traditional bundlers

**Search Terms:**
- "Vite build tool web applications"
- "Vite React development"
- "modern JavaScript bundlers education"
- "fast development tools educational platforms"

**Suggested Placement:** After React.js section in "Modern Web Frameworks"

---

### ➕ ADD: "WebRTC and PeerJS in Educational Video Communication"

**Why Add This:**
- Core technology for your video sessions
- Differentiates your system from centralized video platforms

**What to Include:**
- WebRTC peer-to-peer architecture
- PeerJS as WebRTC wrapper/simplification library
- Benefits: no video server costs, direct connections, lower latency
- Educational applications of WebRTC
- Security and privacy in peer-to-peer video

**Search Terms (RRL #2 from my list):**
- "WebRTC video conferencing education"
- "peer-to-peer video communication learning"
- "PeerJS educational applications"
- "WebRTC real-time collaboration education"
- "decentralized video conferencing platforms"

**Suggested Placement:** After "Modern Web Frameworks" section

---

### ➕ ADD: "Real-Time Collaboration Tools in Education"

**Why Add This:**
- You have whiteboard and chat features
- Important differentiator from basic tutoring platforms

**What to Include:**
- Canvas API for collaborative whiteboard
- WebSocket/Supabase Realtime for chat
- Real-time state synchronization
- Benefits of synchronous collaboration in peer tutoring

**Search Terms (RRL #5 from my list):**
- "collaborative whiteboard education"
- "real-time chat learning environments"
- "Canvas API educational applications"
- "synchronous collaboration tools online tutoring"
- "WebSocket real-time education"

**Suggested Placement:** After "WebRTC and PeerJS" section

---

### ➕ ADD: "Digital Payment and Donation Systems in Educational Platforms"

**Why Add This:**
- Your unique QR code donation feature
- Important for tutor incentivization

**What to Include:**
- QR code payment systems (GCash, PayMaya)
- Base64 image storage for QR codes
- Voluntary donation models vs. payment processing
- Mobile payment adoption in Philippines/Southeast Asia
- Incentive structures for peer tutors

**Search Terms (New - not in original 10):**
- "QR code payment systems education"
- "voluntary donation platforms peer tutoring"
- "mobile payment education Philippines"
- "GCash PayMaya educational platforms"
- "tutor incentivization models"

**Suggested Placement:** After "Peer Tutoring Systems" section

---

### ➕ ADD: "Feedback and Rating Systems in Educational Platforms"

**Why Add This:**
- You have 11 predefined feedback tags
- Rating system for tutors
- Quality assurance mechanism

**What to Include:**
- Structured feedback mechanisms
- Tag-based feedback categorization
- Rating systems for quality assurance
- Impact on tutor performance and improvement

**Search Terms (RRL #6 from my list):**
- "student feedback systems"
- "tutor evaluation mechanisms"
- "tag-based feedback education"
- "rating systems peer tutoring"
- "structured feedback educational platforms"

**Suggested Placement:** After "Peer Tutoring Systems" section

---

### ➕ ADD: "Learning Resource Management and Sharing"

**Why Add This:**
- Tutors can upload learning materials
- Admin approval workflow
- Resource repository feature

**What to Include:**
- Educational resource repositories
- Content moderation and approval workflows
- File storage and management
- Resource sharing in peer learning contexts

**Search Terms (RRL #7 from my list):**
- "educational resource repositories"
- "learning materials management systems"
- "content moderation educational platforms"
- "file sharing peer tutoring"
- "resource approval workflows education"

**Suggested Placement:** After "Database Technologies" section

---

### ➕ ADD: "Notification Systems and User Engagement"

**Why Add This:**
- In-app notification system
- Session reminders, updates, feedback requests
- User engagement strategy

**What to Include:**
- Push notification systems in education
- Real-time alerts and reminders
- User engagement through notifications
- Notification types (session updates, reminders, system alerts)

**Search Terms (RRL #9 from my list):**
- "push notifications educational engagement"
- "alert systems student retention"
- "notification systems learning platforms"
- "real-time alerts education"
- "user engagement notifications"

**Suggested Placement:** After "Real-Time Collaboration Tools" section

---

## CONCEPTUAL FRAMEWORK - REVISIONS NEEDED

### 🔧 Changes Required:

**REMOVE these phrases:**
- "intelligent matching"
- "fuzzy logic"
- "algorithmic matchmaking"
- "AI-driven matching"

**ADD these concepts:**
- "learner-driven tutor selection"
- "manual browsing and filtering"
- "peer-to-peer video communication"
- "real-time collaboration tools"
- "voluntary donation incentives"
- "structured feedback mechanisms"

**Revise the matching paragraph to:**
"Central to this framework is the concept of transparent filtering and learner-driven selection, which allows students to browse available tutors and make informed choices based on subject expertise, availability, ratings, and feedback. This filtering process considers multiple factors including tutor qualifications, schedule compatibility, and performance ratings to help learners find suitable tutoring partners. The framework emphasizes learner autonomy and transparency in the selection process, ensuring students maintain control over their learning partnerships."

---

## RESEARCH PARADIGM (IPO) - REVISIONS NEEDED

### 🔧 Software Requirements - UPDATE TO:

**Current (Incorrect):**
- Hostinger for deployment

**Correct (Your Actual Stack):**
- React with Vite (front-end framework and build tool)
- TypeScript (type-safe JavaScript)
- React Router (client-side routing)
- Supabase (real-time database, authentication, storage)
- PostgreSQL (database via Supabase)
- PeerJS (WebRTC wrapper for peer-to-peer video)
- Tailwind CSS (responsive UI styling)
- Canvas API (collaborative whiteboard)
- Vercel (deployment and hosting)
- GitHub (version control)
- Visual Studio Code (IDE)

### 🔧 Process Section - REMOVE:

**Delete these phrases:**
- "fuzzy logic"
- "intelligent filtering techniques"
- "AI-assisted prototyping" (unless you actually used AI tools)

**Replace with:**
- "filtering by subject, availability, and rating"
- "learner-driven tutor selection"
- "peer-to-peer video communication via PeerJS"

### 🔧 Output Section - UPDATE:

**Change from:**
"...intelligent tutor–tutee matching..."

**To:**
"...transparent filtering and learner-driven tutor selection..."

---

## SUMMARY OF RRL TOPICS TO RESEARCH

Based on the 10 topics I provided earlier, here's what you need:

### ✅ Already Covered (Keep):
1. ✅ Online Peer Tutoring Systems - Already have this
3. ✅ Student-to-Student Learning - Already have this
8. ✅ User Authentication and RBAC - Already have this
10. ✅ Agile Development Methodology - Already have this

### ➕ Need to Add:
2. **WebRTC Technology in Educational Applications** - ADD NEW SECTION
4. **Scheduling and Availability Management** - Revise existing API section
5. **Real-Time Collaboration Tools** - ADD NEW SECTION
6. **Feedback and Rating Systems** - ADD NEW SECTION
7. **Learning Resource Management** - ADD NEW SECTION
9. **Notification Systems and User Engagement** - ADD NEW SECTION

### ➕ Additional (Not in Original 10):
11. **QR Code Payment/Donation Systems** - ADD NEW SECTION
12. **Vercel/Serverless Deployment** - Revise deployment section

---

## REVISION CHECKLIST

### Phase 1: Delete
- [ ] Delete entire "Fuzzy Logic and Approximate Matching" section
- [ ] Delete Next.js section (keep React.js section only)

### Phase 2: Revise Existing
- [ ] Simplify "Rule-Based Filtering" section (remove AI/intelligent matching)
- [ ] Revise "API Integration" section (remove Cronofy/Nylas, add Supabase focus)
- [ ] Update "Implementation Strategies" (remove Zoom references)
- [ ] Update "Deployment Practices" (Hostinger → Vercel)
- [ ] Revise Conceptual Framework (remove fuzzy logic, add learner-driven selection)
- [ ] Update Research Paradigm/IPO (fix tech stack, remove fuzzy logic)

### Phase 3: Add New Sections
- [ ] Add "Vite as Modern Build Tool"
- [ ] Add "WebRTC and PeerJS in Educational Video Communication"
- [ ] Add "Real-Time Collaboration Tools in Education"
- [ ] Add "Digital Payment and Donation Systems"
- [ ] Add "Feedback and Rating Systems"
- [ ] Add "Learning Resource Management and Sharing"
- [ ] Add "Notification Systems and User Engagement"

### Phase 4: Terminology
- [ ] Change all "tutee" → "Learner"
- [ ] Ensure "CIT-SC" properly identified as student council
- [ ] Verify all tech stack mentions are accurate

---

## RECOMMENDED SECTION ORDER (After Revisions)

1. Digital Learning Support in the Current Generation
2. Peer Tutoring Systems in Modern Education
3. **[NEW] Digital Payment and Donation Systems in Educational Platforms**
4. **[NEW] Feedback and Rating Systems in Educational Platforms**
5. **[REVISED] Learner-Driven Filtering and Search in Peer Platforms**
6. Modern Web Frameworks in E-Learning (React.js ONLY - delete Next.js)
7. **[NEW] Vite as Modern Build Tool for Educational Applications**
8. **[NEW] WebRTC and PeerJS in Educational Video Communication**
9. **[NEW] Real-Time Collaboration Tools in Education**
10. Database Technologies in Educational Platforms (Supabase & PostgreSQL)
11. **[NEW] Learning Resource Management and Sharing**
12. **[NEW] Notification Systems and User Engagement**
13. UI/UX Design and Responsive Frameworks (Tailwind CSS)
14. **[REVISED] Deployment Practices for Educational Platforms** (Vercel focus)
15. Acceptability Testing in Educational Technologies
16. Agile-Kanban in Software Development for Education
17. ISO/IEC 25010 Quality Standards
18. **[REVISED] Conceptual Framework**
19. **[REVISED] Research Paradigm**

---

## FINAL NOTES

- Your existing sections on React, Next.js, Tailwind, Supabase, and PostgreSQL are good - keep them!
- Focus your research efforts on the 6 new sections you need to add
- When revising, emphasize what makes your system unique: peer-to-peer video, learner-driven selection, QR code donations
- Ensure all technical details match your actual implementation
- Maintain academic tone while being accurate about your system's capabilities
