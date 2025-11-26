# Video Session Diagrams

## Activity Diagrams

### 1. Join Session (Learner)

**Figure 31. Join Video Session Process (Learner)** - Learners test devices, enter waiting room, get admitted by tutor.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Join Session (Learner) Process**" {
start
:Session time arrives;
:Click "Join Session";
:Navigate to device test page;

if (Camera detected?) then (yes)
  if (Microphone detected?) then (yes)
    :Test devices;
    :Preview camera and mic;
    :Click "Continue";
    :Initialize PeerJS;
    :Save peer ID to database;
    :Enter waiting room;
    :Show "Waiting for tutor to admit";
    
    if (Tutor admitted learner?) then (yes)
      :Establish peer connection;
      :Start video session;
      stop
    else (no)
      :Continue waiting;
      stop
    endif
  else (no)
    :Show error: "Microphone not found";
    stop
  endif
else (no)
  :Show error: "Camera not found";
  stop
endif

@enduml
```

###  Join Session (Tutor)

**Figure 31b. Join Video Session Process (Tutor)** - Tutors test devices, join session, admit learner from waiting room.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Join Session (Tutor) Process**" {
start
:Session time arrives;
:Click "Join Session";
:Navigate to device test page;

if (Camera detected?) then (yes)
  if (Microphone detected?) then (yes)
    :Test devices;
    :Preview camera and mic;
    :Click "Continue";
    :Initialize PeerJS;
    :Save peer ID to database;
    :Check if learner waiting;
    
    if (Learner waiting?) then (yes)
      :Show "Admit Learner" button;
      :Tutor clicks admit;
      
      fork
        :Broadcast admission via Realtime;
      fork again
        :Call learner peer ID;
      end fork
      
      :Establish peer connection;
      :Start video session;
      stop
    else (no)
      :Show "Waiting for learner";
      stop
    endif
  else (no)
    :Show error: "Microphone not found";
    stop
  endif
else (no)
  :Show error: "Camera not found";
  stop
endif

@enduml
```

###  Use Whiteboard

**Figure 33. Use Whiteboard Process** - Users draw on collaborative whiteboard with real-time sync.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Use Whiteboard Process**" {
start
:User in video session;
:Click whiteboard tab;

if (Peer connected?) then (yes)
  :Show whiteboard canvas;
  :Select tool (pen, shapes, text);
  
  if (Tool selected?) then (yes)
    :Draw or write on canvas;
    :Fabric.js captures event;
    
    fork
      :Broadcast changes via Realtime;
      :Other user receives update;
      :Update other user's canvas;
    fork again
      :Save state to database (periodic);
    end fork
    
    stop
  else (no)
    :Show: "Select a tool";
    stop
  endif
else (no)
  :Show error: "Peer not connected";
  stop
endif

@enduml
```

###  Share Files in Session

**Figure 35. Upload Session Asset Process** - Users upload files during sessions, stored in Supabase Storage.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Share Files in Session Process**" {
start
:User in video session;
:Click assets tab;
:Click "Upload File";
:Select file from device;

if (Valid file type?) then (yes)
  if (File size OK?) then (yes)
    :Upload to Supabase Storage;
    :Save metadata to session_assets;
    
    fork
      :Notify other user via Realtime;
    fork again
      :Display in assets panel;
    end fork
    
    :Show success message;
    stop
  else (no)
    :Show error: "File too large";
    stop
  endif
else (no)
  :Show error: "Invalid file type";
  stop
endif

@enduml
```

###  Use In-Session Chat

**Figure 34. Send Chat Message Process** - Users send chat messages with real-time delivery.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Use In-Session Chat Process**" {
start
:User in video session;
:Click chat tab;
:Type message;

if (Message not empty?) then (yes)
  :Click send;
  
  fork
    :Save to session_messages table;
  fork again
    :Broadcast via Realtime;
    :Other user receives message;
    :Display in chat;
  end fork
  
  stop
else (no)
  :Show error: "Cannot send empty message";
  stop
endif

@enduml
```

###  Screen Share

**Figure 32. Share Screen Process** - Users share their screen, broadcast to other participant.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Screen Share Process**" {
start
:User in video session;
:Click "Share Screen" button;
:Browser shows screen picker;

if (User selects screen?) then (yes)
  :Get screen stream;
  :Send to peer;
  :Display shared screen;
else (no)
  :Cancel screen share;
endif

stop

@enduml
```

###  End Session

**Figure 36. End Video Session Process** - Users end session, disconnect, learner provides feedback.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - End Session Process**" {
start
:User clicks "End Session";
:Show confirmation dialog;

if (Confirm end?) then (yes)
  if (Session active?) then (yes)
    fork
      :Stop all media tracks;
      :Close peer connection;
    fork again
      :Update session status to completed;
      :Clear peer IDs from database;
    end fork
    
    :Redirect to dashboard;
    
    if (User is learner?) then (yes)
      :Show feedback modal;
      stop
    else (no)
      :Show session summary;
      stop
    endif
  else (no)
    :Show error: "Session not active";
    stop
  endif
else (no)
  :Cancel end session;
  :Return to session;
  stop
endif

@enduml
```

###  Device Testing

**Figure 37. Handle Connection Issues Process** - System tests devices before joining session.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Device Testing Process**" {
start
:Navigate to device test modal;
:Request camera and microphone access;

if (Devices found?) then (yes)
  :Show preview;
  :Test camera and microphone;
  :Select devices (optional);
  :Click "Continue";
  :Proceed to session;
else (no)
  :Show device error;
endif

stop

@enduml
```

---

## Sequence Diagrams

### 1. Join Session (Learner)

**Figure 39. Join Video Session Flow (Learner)** - Technical flow for learner joining with device test and waiting room.

```plantuml
@startuml

title TechConnect - Join Session (Learner) Flow

actor Learner
participant "React UI" as React
participant "PeerJS Client" as PeerJS
participant "Supabase DB" as DB
participant "Supabase" as Realtime

Learner -> React: Click "Join Session"
activate React
React -> React: Device test\n(camera, mic)
React -> PeerJS: Initialize peer
activate PeerJS
PeerJS --> React: Peer ID generated
deactivate PeerJS

React -> DB: UPDATE sessions\nSET learner_peer_id = peer_id
activate DB
DB --> React: Peer ID saved
deactivate DB

React -> React: Enter waiting room
React -> Realtime: Subscribe to admission event
activate Realtime
Realtime --> React: Listening for admission
deactivate Realtime

React --> Learner: Show "Waiting for tutor"

note right: Learner waits for tutor to admit

@enduml
```

###  Join Session (Tutor)

**Figure 39b. Join Video Session Flow (Tutor)** - Technical flow for tutor joining and admitting learner.

```plantuml
@startuml

title TechConnect - Join Session (Tutor) Flow

actor Tutor
participant "React UI" as React
participant "PeerJS Client" as PeerJS
participant "Supabase DB" as DB
participant "Supabase" as Realtime

Tutor -> React: Click "Join Session"
activate React
React -> React: Device test\n(camera, mic)
React -> PeerJS: Initialize peer
activate PeerJS
PeerJS --> React: Peer ID generated
deactivate PeerJS

React -> DB: UPDATE sessions\nSET tutor_peer_id = peer_id
activate DB
DB --> React: Peer ID saved
deactivate DB

React -> DB: GET learner_peer_id
activate DB
DB --> React: Learner waiting
deactivate DB

React --> Tutor: Show "Admit Learner" button

Tutor -> React: Click "Admit"
React -> Realtime: Broadcast admission
activate Realtime
Realtime --> React: Admission sent
deactivate Realtime

React -> PeerJS: Call learner peer ID
activate PeerJS
PeerJS --> React: Connection established
deactivate PeerJS

React --> Tutor: Video session started
deactivate React

@enduml
```

###  Establish Video Connection

**Figure 40. Share Screen Flow** - Technical flow for establishing peer-to-peer video connections.

```plantuml
@startuml

title TechConnect - Establish Video Connection Flow

participant "Tutor PeerJS" as TutorPeer
participant "WebRTC" as WebRTC
participant "Learner PeerJS" as LearnerPeer
participant "Media Streams" as Media

TutorPeer -> Media: Get local stream\n(camera, mic)
activate Media
Media --> TutorPeer: Local media stream
deactivate Media

TutorPeer -> WebRTC: Call learner peer ID\n(with media stream)
activate WebRTC
WebRTC -> LearnerPeer: Incoming call
activate LearnerPeer

LearnerPeer -> Media: Get local stream\n(camera, mic)
activate Media
Media --> LearnerPeer: Local media stream
deactivate Media

LearnerPeer -> WebRTC: Answer call\n(with media stream)
WebRTC -> TutorPeer: Exchange media streams
WebRTC -> LearnerPeer: Exchange media streams

TutorPeer -> TutorPeer: Display remote video
LearnerPeer -> LearnerPeer: Display remote video

deactivate LearnerPeer
deactivate WebRTC

note right: Peer-to-peer\nconnection established

@enduml
```

###  Whiteboard Sync

**Figure 41. Use Whiteboard Flow** - Technical flow for real-time whiteboard synchronization.

```plantuml
@startuml

title TechConnect - Whiteboard Sync Flow

actor User
participant "React UI" as React
participant "Fabric.js" as Fabric
participant "Supabase" as Realtime
participant "Supabase DB" as DB
actor "Other User" as Other

User -> Fabric: Draw on canvas
activate Fabric
Fabric -> Fabric: Capture canvas event
Fabric -> React: Canvas state changed
deactivate Fabric
activate React

React -> Realtime: Broadcast canvas data
activate Realtime
Realtime -> Other: Receive canvas data
activate Other
Other -> Fabric: Update canvas
activate Fabric
Fabric -> Other: Display changes
deactivate Fabric
deactivate Other
deactivate Realtime

React -> DB: Save whiteboard state\n(periodic)
activate DB
DB --> React: State saved
deactivate DB
deactivate React

note right: State persists\nacross disconnections

@enduml
```

###  Send Chat Message

**Figure 42. Send Chat Message Flow** - Technical flow for sending and receiving chat messages.

```plantuml
@startuml

title TechConnect - Send Chat Message Flow

actor User
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor "Other User" as Other

User -> React: Type message
activate React
User -> React: Click send

React -> DB: INSERT INTO session_messages
activate DB
DB --> React: Message saved
deactivate DB

React -> Realtime: Broadcast message
activate Realtime
Realtime -> Other: Receive message
activate Other
Other -> Other: Display in chat
deactivate Other
deactivate Realtime

React --> User: Message sent
deactivate React

@enduml
```

###  Share File in Session

**Figure 43. Upload Session Asset Flow** - Technical flow for uploading and sharing files during sessions.

```plantuml
@startuml

title TechConnect - Share File in Session Flow

actor User
participant "React UI" as React
participant "Supabase" as Storage
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor "Other User" as Other

User -> React: Select file
activate React
React -> React: Validate file

React -> Storage: Upload file
activate Storage
Storage --> React: File URL
deactivate Storage

React -> DB: INSERT INTO session_assets
activate DB
DB --> React: Asset saved
deactivate DB

React -> Realtime: Notify other user
activate Realtime
Realtime -> Other: New file available
activate Other
Other -> Other: Display in assets panel
deactivate Other
deactivate Realtime

React --> User: File shared
deactivate React

@enduml
```

###  Screen Share

**Figure 44. Screen Share Flow** - Technical flow for capturing and broadcasting screen share.

```plantuml
@startuml

title TechConnect - Screen Share Flow

actor User
participant "React UI" as React
participant "Browser API" as Browser
participant "PeerJS" as PeerJS
actor "Other User" as Other

User -> React: Click "Share Screen"
activate React
React -> Browser: Request screen permission
activate Browser
Browser --> User: Permission dialog
User -> Browser: Grant permission
Browser --> React: Screen stream
deactivate Browser

React -> PeerJS: Send screen stream
activate PeerJS
PeerJS -> Other: Receive screen stream
activate Other
Other -> Other: Display shared screen
deactivate Other
deactivate PeerJS

React --> User: Screen sharing active
deactivate React

@enduml
```

###  End Session

**Figure 45. End Video Session Flow** - Technical flow for ending sessions and triggering feedback.

```plantuml
@startuml

title TechConnect - End Session Flow

actor User
participant "React UI" as React
participant "PeerJS" as PeerJS
participant "Supabase DB" as DB
participant "Media Tracks" as Media

User -> React: Click "End Session"
activate React
React --> User: Confirm dialog
User -> React: Confirm end

React -> Media: Stop all tracks\n(camera, mic)
activate Media
Media --> React: Tracks stopped
deactivate Media

React -> PeerJS: Close peer connection
activate PeerJS
PeerJS --> React: Connection closed
deactivate PeerJS

React -> DB: UPDATE sessions\nSET status = 'completed'
activate DB
React -> DB: Clear peer IDs
DB --> React: Session ended
deactivate DB

React --> User: Redirect to dashboard
deactivate React

@enduml
```

---

**Total Diagrams in this file: 16 (8 Activity + 8 Sequence)**
