# Chapter V - CORRECTED VERSION
## SUMMARY, FINDINGS, CONCLUSIONS, AND RECOMMENDATIONS

This chapter presents the summary of the study and the key findings based on the research objectives established at the beginning of the project. It includes the interpretation of the data gathered from the testing and evaluation of the TechConnect peer tutoring platform. The results obtained from the system assessment, together with the study's objectives and research questions, form the basis for the conclusions. The researchers also discuss the implications of these findings and provide recommendations derived from them, aligned with the study's purpose and conclusions.

## Summary

The study entitled "TechConnect: A Peer Tutoring Platform for the College of Industrial Technology" was designed and developed to provide a centralized, structured, and user-friendly system that supports the peer tutoring needs of students enrolled in the College of Industrial Technology (CIT). The existing Peer-Assisted Learning (PAL) program lacked efficiency in connecting tutors and learners, offered only limited scheduling, and did not utilize a digital tool for managing academic support. To resolve these problems, the researchers designed TechConnect, a web-based platform that enables learner-driven tutor selection through subject compatibility, flexible scheduling, communication, and resource sharing. The system includes essential features such as a tutor dashboard, learner dashboard, WebRTC-based peer-to-peer video conferencing with real-time collaboration tools, a resource module, and administrative tools for monitoring and managing tutoring activities. Central to the study are the system's design and development, its required hardware and software specifications, and the comprehensive evaluation of its performance and quality.

The researchers employed a developmental research design in the creation of TechConnect. This design supported the systematic process of specifying user requirements, developing system models, and translating these models into a functional platform. Using this approach, the researchers identified the system's technical and functional components and ensured that the development process aligned with the needs outlined in the early stages of the study. Through developmental research, the researchers were able to structure the design activities efficiently and create a clear foundation for building the platform.

The researchers produced a complete set of design documents which included use case diagrams, data flow diagrams, an entity relationship diagram, and user role specifications to guide the development of the system. These tools were essential in defining the overall system architecture, illustrating data processes, and determining how users interact with the platform. The design models helped the researchers establish the functional flow of tutor–learner interactions, scheduling processes, and resource management modules, ensuring that the structure of TechConnect addressed the operational needs identified in the earlier chapters.

A structured system development process was conducted to build TechConnect effectively and efficiently. The researchers adopted an Agile Kanban methodology, which emphasized continuous progress, task prioritization, and flexible workflow management throughout the development cycle. By using a Kanban board, the team was able to visualize tasks, monitor ongoing work, and make timely adjustments based on project demands. The platform was developed using Visual Studio Code along with the specific frameworks and tools: React, Vite, TypeScript, PeerJS, Tailwind CSS, and Supabase. Through the use of Agile Kanban, the researchers improved focus, reduced development challenges, and ensured that each system component was refined iteratively to enhance usability and functionality.

In the assessment of the system's functionality, usability, and overall acceptability, the researchers utilized ISO 25010 software quality standards. Respondents, composed of CIT students and IT experts, evaluated the platform according to essential software quality characteristics, including functional suitability, performance efficiency, compatibility, interaction capability, reliability, security, maintainability, flexibility, and safety. Each characteristic consisted of four indicators measured using a four-point Likert scale. Through this evaluation process, the researchers determined that TechConnect meets all nine ISO 25010 software quality characteristics at an Acceptable level, indicating that the system performs as intended and satisfies the required quality standards of the study.

## Findings

Based on the analyses, the following are the findings of the study.

TechConnect features an intuitive, user-centered interface that enables CIT students to navigate peer tutoring functions such as learner-driven tutor selection, session scheduling, learning material access, and session tracking. Its fuzzy search with rule-based scoring and filtering capabilities allow learners to find and select tutors based on subjects, availability, ratings, and feedback, with search results ranked by relevance using Levenshtein distance algorithm. Role differentiation between Tutor, Learner, and Administrator enhances workflow clarity and accountability. With custom scheduling functionality and WebRTC-based peer-to-peer video conferencing, the platform ensures seamless communication, easy access to virtual sessions with real-time collaboration tools (interactive whiteboard and chat), and automatic reminders for users.

TechConnect is a web-based system accessible on desktops, laptops, tablets, and phones with a modern browser and stable internet. Key features use Supabase for authentication, storage, real-time sync, and notifications, ensuring secure and reliable performance. Built with React, Vite, TypeScript, PeerJS, Tailwind CSS, and Supabase, and deployed on Vercel, the platform offers responsive interfaces and stable operations. The peer-to-peer video architecture eliminates the need for centralized video servers, while real-time collaboration tools enhance the tutoring experience. While some real-time features depend on internet connectivity, these did not significantly affect performance during testing or deployment.

TechConnect delivers reliable performance in line with ISO 25010 standards, supporting learner-driven tutor selection, session scheduling, secure login, peer-to-peer video sessions with real-time collaboration, and access to learning resources. Its responsive design ensures smooth use across devices and browsers, while Supabase authentication maintains data security. The platform includes structured feedback mechanisms with eleven predefined tags (Clear Explanations, Patient & Friendly, Well Prepared, Helpful Materials, Great Communication, Always On Time, Very Knowledgeable, Helped Me Improve, Engaging Session, Good Examples, Responsive), voluntary QR code-based donations for tutor appreciation, and an admin-moderated resource repository. The modular system supports maintenance, future enhancements, and complies with ISO 25010:2023 safety principles, confirming readiness for college-wide deployment.

TechConnect was successfully deployed and tested within the College of Industrial Technology, demonstrating stable and efficient performance across desktops, laptops, and mobile devices. Functional, performance, usability, and compatibility testing confirmed that core features, such as learner-driven tutor selection, session scheduling, peer-to-peer video conferencing with real-time collaboration tools, and access to learning materials, operated reliably and met user expectations. Feedback from students, faculty, and administrators guided minor enhancements, resulting in a user-friendly and fully operational peer tutoring platform.

## Conclusions

The College of Industrial Technology faced challenges in managing peer tutoring, including inconsistent tutor–learner connections, limited session monitoring, and dispersed learning resources. To address these issues, the researchers developed TechConnect, a web-based platform that centralizes tutoring management, including session scheduling, learner-driven tutor selection, resource access, and progress tracking. The system offers a structured, accessible solution for students, tutors, and administrators to manage tutoring activities efficiently. Emphasis was placed on creating a user-friendly interface compatible with multiple devices, ensuring responsive performance across platforms. Continuous testing, feedback from users, and expert assessments helped refine the interface, functionality, and overall performance. Evaluation using ISO/IEC 25010 standards confirmed that TechConnect meets acceptable levels for all key software quality characteristics, proving reliable and effective for supporting peer tutoring in the College of Industrial Technology.

In particular, the researchers arrived at the following conclusions:

1. The use of TechConnect is beneficial as it provides an intuitive and user-friendly platform that supports learner-driven tutor selection through fuzzy search and rule-based filtering, session booking, peer-to-peer video communication with real-time collaboration tools, and resource sharing. It offers efficient tools that enhance communication, academic support, and accessibility between tutors and learners. Additionally, the system's design and features align with the needs of CIT learners and tutors, enabling seamless and effective academic assistance within the platform.

2. TechConnect integrates modern web technologies including React, Vite, TypeScript, PeerJS, Tailwind CSS, and Supabase, ensuring compatibility across a wide range of devices, including desktops, laptops, tablets, and mobile phones. This allows students, tutors, and administrators to access tutoring schedules, learning resources, and session data anytime and anywhere, providing flexible and continuous academic support regardless of location or device.

3. The ISO/IEC 25010 evaluation results indicate that TechConnect meets acceptable standards for functional suitability, performance efficiency, reliability, security, maintainability, and usability, as reported by both end-users and IT experts. These findings demonstrate that the system effectively supports real-world peer tutoring operations, ensuring smooth management of sessions, tutor-learner interactions, and academic resources.

4. The system was successfully implemented and deployed using the requirements gathered from users and ensuring compatibility across various devices. The final evaluation demonstrated that TechConnect meets academic needs by providing a reliable, efficient, and user-friendly system for learner-driven tutor selection through fuzzy search and filtering, session scheduling, peer-to-peer video conferencing with real-time collaboration tools, and access to learning resources.

## Recommendations

TechConnect is a web-based peer tutoring platform developed to assist students within the College of Industrial Technology by providing an organized, accessible, and user-friendly system for academic support. It effectively connects tutors and learners, schedules sessions, and enhances communication within the academic environment of CIT. With the goal of further improving the system's functionality and user experience, the researchers offer several recommendations.

1. Explore enhancing the fuzzy search algorithm and rule-based scoring system with additional criteria such as learning style preferences, subject sub-categories, or tutor specializations to further improve search relevance and support learner-driven selection.

2. Expand the platform's capability to support additional programs or departments within the institution, allowing other colleges or courses to utilize TechConnect as a unified academic assistance system.

3. Broaden the system's capabilities by incorporating group tutoring sessions, integrated quizzes, and performance monitoring tools that help learners track their progress and identify areas for improvement.

4. Enhance the real-time collaboration tools by adding features such as screen sharing capabilities, file sharing during sessions, and session recording for review purposes.

5. Future studies and usability evaluations should focus on adding new features, enhancing user experience, and adapting the system to evolving academic needs and technologies. Continuous monitoring will ensure that TechConnect remains effective, relevant, and flexible in supporting peer tutoring activities.

---

## Summary of Changes Made:

### Terminology:
- ✅ Changed "tutee" → "learner" throughout
- ✅ Changed "tutor–tutee" → "tutor–learner" throughout

### Technology Stack:
- ✅ Removed "Node.js and npm" (misleading - npm is just package manager)
- ✅ Added "React, Vite, TypeScript, PeerJS, Tailwind CSS, and Supabase"
- ✅ Added "deployed on Vercel"
- ✅ Removed "Google Calendar integration" (you don't have this)
- ✅ Changed to "custom scheduling functionality"

### Features Added:
- ✅ "peer-to-peer video conferencing with real-time collaboration tools"
- ✅ "interactive whiteboard and chat"
- ✅ "eleven predefined feedback tags" with complete list
- ✅ "voluntary QR code-based donations"
- ✅ "admin-moderated resource repository"
- ✅ "Levenshtein distance algorithm" for fuzzy search

### Clarifications:
- ✅ Changed "matching" → "learner-driven selection" where appropriate
- ✅ Clarified fuzzy search is for finding/selecting, not automatic pairing
- ✅ Emphasized learner autonomy in tutor selection
- ✅ Changed "eight" → "nine" ISO 25010 characteristics (Safety was added in 2023)

### Recommendations:
- ✅ Updated first recommendation to enhance existing fuzzy search (not add automated matching)
- ✅ Added recommendation to enhance real-time collaboration tools
- ✅ Kept other recommendations as they align with system design
