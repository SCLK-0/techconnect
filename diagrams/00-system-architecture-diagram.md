# TechConnect System Architecture Diagram

```plantuml
@startuml
skinparam rectangle {
    BackgroundColor<<user>> #FFF8DC
    BorderColor<<user>> #8B4513
    BackgroundColor<<hosting>> #FFE4E1
    BorderColor<<hosting>> #CD5C5C
    BackgroundColor<<backend>> #E8F5E9
    BorderColor<<backend>> #4CAF50
    BackgroundColor<<external>> #E3F2FD
    BorderColor<<external>> #2196F3
}

' End Users
rectangle "END USERS" <<user>> {
    actor "Tutor" as tutor
    actor "Learner" as learner
    actor "Administrator" as admin
}

' Hosting Layer
rectangle "VERCEL" <<hosting>> {
    rectangle "TechConnect Web App\n(React + Vite)" as webapp {
        component "React UI\n(Frontend)" as react_ui
        
        component "Video Session\nModule" as video
        
        component "Donation\nModule" as donation
        
        component "Notification\nSystem" as notification
        
        component "PeerJS\n(WebRTC)" as peerjs
    }
}

' Supabase Services
rectangle "SUPABASE SERVICES" <<backend>> {
    database "Supabase\nDatabase" as db
    component "Supabase\nAuth" as auth
    component "Supabase\nStorage" as storage
    component "Supabase\nRealtime" as realtime
    component "Edge\nFunctions" as edge
}

' External APIs
rectangle "EXTERNAL APIS" <<external>> {
    component "Resend\n(Email)" as resend
}

' User connections
tutor --> react_ui : manage availability
learner --> react_ui : browse tutors
admin --> react_ui : approve tutors

' Frontend to Supabase
react_ui --> db : sessions, profiles,\nfeedback, resources
react_ui --> auth : login, register,\nverify email
react_ui --> storage : avatars, resources,\nQR codes
react_ui --> realtime : session updates,\nnotifications

' Video Module
video --> peerjs : video/audio streams
video --> db : whiteboard states,\nchat messages
peerjs ..> peerjs : P2P WebRTC\nconnection

' Edge to External
edge --> resend : send emails

' Realtime updates
realtime ..> notification : live updates
realtime ..> react_ui : push updates

' Donation flow
donation --> storage : save QR codes

@enduml
```

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS + shadcn/ui** - Styling
- **react-router-dom** - Routing
- **@tanstack/react-query** - Server state management
- **react-hook-form + zod** - Forms & validation
- **peerjs** - WebRTC video
- **fabric** - Whiteboard canvas
- **lucide-react** - Icons
- **sonner** - Toast notifications

### Backend (Supabase)
- **PostgreSQL** - Database
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage
- **Supabase Realtime** - Live updates
- **Edge Functions** - Serverless functions

### External Services
- **Resend** - Email delivery

### Database Tables
- `profiles` - User information
- `tutor_profiles` - Tutor details & availability
- `sessions` - Scheduled & instant sessions
- `feedback` - Ratings & reviews
- `resources` - Learning materials
- `notifications` - In-app notifications
- `whiteboard_states` - Collaborative whiteboard data
- `chat_messages` - In-session chat
