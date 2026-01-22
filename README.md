# TechConnect

A real-time peer tutoring platform that connects college students for collaborative learning sessions with video conferencing, interactive whiteboard, and session management.

## Overview

TechConnect is a web-based platform designed to facilitate peer-to-peer tutoring sessions between college students. The platform supports real-time video communication, collaborative whiteboard, chat functionality, and session observation features.

## Key Features

### For Learners
- Browse and search available tutors by subject expertise
- Book instant or scheduled tutoring sessions
- Request to observe ongoing sessions (tag-along feature)
- Real-time video and audio communication
- Interactive whiteboard for collaborative problem-solving
- Session chat for text-based communication
- Session history and feedback system
- Reschedule or cancel sessions

### For Tutors
- Create and manage tutor profile with subject expertise
- Accept or decline session requests
- Admit learners to sessions with waiting room
- Control session flow and duration
- Share screen during sessions
- View tutee history and session logs
- Receive feedback from learners

### For Observers (Tag-Along Learners)
- Request to observe ongoing sessions
- View-only access to video streams
- Access to whiteboard and chat
- Learn by watching tutor-learner interactions

### For Administrators
- Live monitoring of active sessions
- User management (tutors, learners, admins)
- Session oversight and intervention capabilities
- Platform analytics and reporting

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for data fetching and caching
- React Router for navigation
- Tailwind CSS for styling
- shadcn/ui component library
- Fabric.js for whiteboard canvas

### Backend & Services
- Supabase for backend services
  - PostgreSQL database
  - Authentication
  - Realtime subscriptions
  - Storage
- WebRTC for peer-to-peer video/audio
- Custom signaling server using Supabase Realtime

### Real-time Features
- WebRTC for video/audio streams
- Supabase Realtime for signaling
- Collaborative whiteboard with real-time sync
- Live chat with typing indicators
- Presence tracking for observers

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Modern web browser with WebRTC support

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd techconnect
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

The application will be available at `http://localhost:xxx` for local development, or access the live deployment at https://www.cit-techconnect.org/

## Project Structure

```
techconnect/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   ├── learner/        # Learner-specific components
│   │   ├── tutor/          # Tutor-specific components
│   │   ├── video-session/  # Video session components
│   │   └── ui/             # Base UI components (shadcn)
│   ├── pages/              # Page components
│   │   ├── admin/          # Admin pages
│   │   ├── learner/        # Learner pages
│   │   └── tutor/          # Tutor pages
│   ├── utils/              # Utility functions
│   │   ├── supabaseSignaling.ts  # WebRTC signaling
│   │   ├── observerWebRTC.ts     # Observer connections
│   │   └── webrtcConfig.ts       # WebRTC configuration
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client and types
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Library configurations
├── supabase/               # Supabase migrations and functions
└── public/                 # Static assets
```

## Key Components

### Video Session
- Real-time video/audio communication using WebRTC
- Screen sharing capability
- Camera and microphone controls
- Connection quality monitoring
- Automatic reconnection handling

### Whiteboard
- Collaborative drawing and annotation
- Text insertion
- Image upload and manipulation
- Real-time synchronization across participants
- Object manipulation indicators
- Persistent state storage

### Session Management
- Waiting room for learners
- Session status tracking (waiting, in-progress, completed)
- Session duration timer
- Automatic session logging
- Feedback collection

### Observer Mode
- Receive-only WebRTC connections
- Real-time presence tracking
- Heartbeat-based connection monitoring
- Automatic cleanup on disconnect

## Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- `profiles` - User profile information
- `user_roles` - User role assignments (tutor, learner, admin)
- `tutor_profiles` - Tutor-specific information and expertise
- `learner_profiles` - Learner-specific information and interests
- `sessions` - Tutoring session records
- `session_participants` - Session participant tracking
- `observer_requests` - Tag-along observation requests
- `session_logs` - Session activity logs
- `feedback` - Session feedback from learners
- `whiteboard_states` - Persistent whiteboard data

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Environment Variables

Required environment variables:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

WebRTC features require a modern browser with full WebRTC support.

## Known Limitations

- Maximum 2 participants per session (1 tutor, 1 learner) plus observers
- Whiteboard state is saved every 2 seconds (not instant)
- Screen sharing is one-way (tutor/learner to others)
- Observer connections are receive-only (no sending media)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For issues or questions, please contact the development team.
