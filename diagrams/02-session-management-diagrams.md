# Session Management Diagrams

## Activity Diagrams

### 1. Request Scheduled Session

**Figure 11. Request Scheduled Session Process**

This diagram shows how learners request a scheduled tutoring session by selecting a tutor, choosing a date, time, and subject. The system validates the booking, creates the session request, and notifies the tutor via in-app notification and email.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Request Scheduled Session Process**" {
start
:Learner selects tutor;
:Choose date, time, and subject;

if (Valid booking?) then (yes)
  :Create session request;
  
  fork
    :Notify tutor (in-app);
  fork again
    :Notify tutor (email);
  end fork
  
  :Show success message;
else (no)
  :Show error message;
endif

stop

@enduml
```

###  Request Instant Session

**Figure 12. Request Instant Session Process** - Learners request instant sessions, system broadcasts to online tutors.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Request Instant Session Process**" {
start
:Learner requests instant session;
:Enter subject and duration;

if (Online tutors available?) then (yes)
  :Broadcast to online tutors;
  :Show waiting modal;
  
  if (Tutor accepts?) then (yes)
    :Close modal;
    :Redirect to session;
  else (no)
    :Show "Tutor busy" message;
    :Close modal;
  endif
else (no)
  :Show "No tutors online";
endif

stop

@enduml
```

###  Accept Session Request

**Figure 13. Accept Session Request Process**

This diagram shows how tutors accept incoming session requests by reviewing the request details and confirming acceptance. The system updates the session status to accepted and notifies the learner.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Accept Session Request Process**" {
start
:Tutor receives session request;
:Review request details;

if (Accept request?) then (yes)
  :Update session status to accepted;
  :Notify learner;
  :Show success message;
else (no)
  :Continue reviewing;
endif

stop

@enduml
```

###  Decline Session Request

**Figure 14. Decline Session Request Process**

This diagram depicts how tutors decline session requests by clicking the decline button, providing a reason in the dialog, and confirming the declination. The system updates the session status and notifies the learner with the declination reason.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Decline Session Request Process**" {
start
:Tutor views session request;
:Click reject button;
:Show reason dialog;

if (Reason provided?) then (yes)
  :Enter rejection reason;
  :Submit rejection;
  
  fork
    :Update session status to declined;
    :Save declination reason;
  fork again
    :Send notification to learner;
  end fork
  
  :Show success message;
  stop
else (no)
  :Show error: "Reason required";
  stop
endif

@enduml
```

###  Reschedule Session

**Figure 16. Reschedule Session Process** - Learners reschedule sessions, tutors approve new time.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Reschedule Session Process**" {
start
:Session declined or cancelled;
:Show reschedule dialog;
:Display reason;

if (Reschedule with same tutor?) then (yes)
  :Open booking dialog;
  :Book new session;
else (no)
  if (Find another tutor?) then (yes)
    :Navigate to find tutors page;
  else (no)
    :Close dialog;
  endif
endif

stop

@enduml
```

###  Cancel Session (Learner)

**Figure 15. Cancel Session Process (Learner)** - Learners cancel sessions with reason, system notifies tutor.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Cancel Session (Learner) Process**" {
start
:Learner views session;
:Click cancel button;
:Show cancellation dialog;

if (Session not started?) then (yes)
  :Enter cancellation reason;
  
  if (Reason provided?) then (yes)
    :Update session status to cancelled;
    :Save cancellation reason;
    :Set cancelled_by = learner;
    :Send notification to tutor;
    :Show success message;
    stop
  else (no)
    :Show error: "Reason required";
    stop
  endif
else (no)
  :Show error: "Cannot cancel started session";
  stop
endif

@enduml
```

###  Cancel Session (Tutor)

**Figure 15b. Cancel Session Process (Tutor)** - Tutors cancel sessions with reason, system notifies learner.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Cancel Session (Tutor) Process**" {
start
:Tutor views session;
:Click cancel button;
:Show cancellation dialog;

if (Session not started?) then (yes)
  :Enter cancellation reason;
  
  if (Reason provided?) then (yes)
    :Update session status to cancelled;
    :Save cancellation reason;
    :Set cancelled_by = tutor;
    :Send notification to learner;
    :Show success message;
    stop
  else (no)
    :Show error: "Reason required";
    stop
  endif
else (no)
  :Show error: "Cannot cancel started session";
  stop
endif

@enduml
```

###  Mark Session Completed

  ```plantuml
  @startuml
  skinparam conditionStyle diamond

  rectangle "**TechConnect - Mark Session Completed Process**" {
  start
  :Session ends;

  fork
    :Tutor: Enter topics covered (required);
    :Save session log;
  fork again
    :Learner: Show feedback modal;
    :Enter topics covered (required);
    :Select rating (required);
    
    if (Tutor has QR code?) then (yes)
      :Show donation option (optional);
    else (no)
      :Skip donation;
    endif
    
    :Submit feedback;
  end fork

  :Update session status to completed;

  stop

  @enduml
  ```

###  Auto-Mark Missed Session

**Figure 19. Mark Session as Missed Process** - System automatically marks sessions as missed when no one joins.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Auto-Mark Missed Session Process**" {
start
:Scheduled time passes;
:System checks session status;

if (Session not started?) then (yes)
  :Mark session as missed;
  
  fork
    :Notify tutor;
  fork again
    :Notify learner;
  end fork
  
  :Update statistics;
else (no)
  :No action needed;
endif

stop

@enduml
```

###  View Session History

**Figure 17. View Session History Process** - Users view past sessions with filters and details.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - View Session History Process**" {
start
:User navigates to session history;
:System fetches user sessions;

if (Has sessions?) then (yes)
  :Display session list;
  :Show filters and search;
  
  if (Click session?) then (yes)
    :View session details;
  else (no)
    :Continue browsing;
  endif
else (no)
  :Show "No sessions yet";
endif

stop

@enduml
```

---

## Sequence Diagrams

### 1. Request Scheduled Session

**Figure 21. Request Scheduled Session Flow** - Technical flow for creating scheduled session requests.

```plantuml
@startuml

title TechConnect - Request Scheduled Session Flow

actor Learner
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime
participant "Supabase Edge" as Edge
actor Tutor

Learner -> React: Select tutor & time
activate React
React -> React: Validate availability
React -> DB: INSERT INTO sessions\n(status: pending)
activate DB
DB --> React: Session created
deactivate DB

React -> DB: INSERT INTO notifications
activate DB
DB --> React: Notification created
deactivate DB

React -> Realtime: Broadcast notification
activate Realtime
Realtime -> Tutor: In-app notification
deactivate Realtime

React -> Edge: send-notification-email
activate Edge
Edge -> Tutor: Email notification
deactivate Edge

React --> Learner: Show "Request sent"
deactivate React

@enduml
```

###  Request Instant Session

**Figure 22. Request Instant Session Flow** - Technical flow for instant session broadcasting and acceptance.

```plantuml
@startuml

title TechConnect - Request Instant Session Flow

actor Learner
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor "Online Tutors" as Tutors

Learner -> React: Request instant session
activate React
React -> DB: Query online tutors\n(is_online = true)
activate DB
DB --> React: List of online tutors
deactivate DB

alt Online tutors found
    React -> DB: INSERT INTO sessions\n(type: instant, status: pending)
    activate DB
    DB --> React: Session created
    deactivate DB
    
    React -> Realtime: Broadcast to online tutors
    activate Realtime
    Realtime -> Tutors: Instant request notification
    deactivate Realtime
    
    React --> Learner: Show "Finding tutor..."
    
    note right: Wait for tutor to accept
    
else No online tutors
    React --> Learner: Show "No tutors available"
end

deactivate React

@enduml
```

### 3. Accept Session Request

**Figure 23. Accept Session Request Flow** - Technical flow for tutors accepting session requests.

```plantuml
@startuml

title TechConnect - Accept Session Request Flow

actor Tutor
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor Learner

Tutor -> React: Click accept button
activate React
React -> React: Validate availability
React -> DB: UPDATE sessions\nSET status = 'confirmed'
activate DB
DB --> React: Session updated
deactivate DB

React -> DB: INSERT INTO notifications
activate DB
DB --> React: Notification created
deactivate DB

React -> Realtime: Broadcast notification
activate Realtime
Realtime -> Learner: Session confirmed
deactivate Realtime

React --> Tutor: Show success message
deactivate React

@enduml
```

### 4. Decline Session Request

**Figure 24. Decline Session Request Flow** - Technical flow for tutors declining sessions with reasons.

```plantuml
@startuml

title TechConnect - Decline Session Request Flow

actor Tutor
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor Learner

Tutor -> React: Click reject button
activate React
React --> Tutor: Show reason dialog
Tutor -> React: Enter declination reason
React -> DB: UPDATE sessions\nSET status = 'declined',\ndeclination_reason = reason
activate DB
DB --> React: Session updated
deactivate DB

React -> DB: INSERT INTO notifications
activate DB
DB --> React: Notification created
deactivate DB

React -> Realtime: Broadcast notification
activate Realtime
Realtime -> Learner: Session declined (with reason)
deactivate Realtime

React --> Tutor: Show success message
deactivate React

@enduml
```

### 5. Reschedule Session

**Figure 26. Reschedule Session Flow** - Technical flow for rescheduling and tutor approval.

```plantuml
@startuml

title TechConnect - Reschedule Session Flow

actor Learner
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor Tutor

Learner -> React: Click reschedule
activate React
React --> Learner: Show calendar
Learner -> React: Select new date/time
React -> React: Validate new time
React -> DB: UPDATE sessions\nSET scheduled_at = new_time,\nreschedule_count = reschedule_count + 1
activate DB
DB --> React: Session updated
deactivate DB

React -> DB: INSERT INTO notifications
activate DB
DB --> React: Notification created
deactivate DB

React -> Realtime: Broadcast notification
activate Realtime
Realtime -> Tutor: Session rescheduled
deactivate Realtime

React --> Learner: Show success message
deactivate React

@enduml
```

### 6. Cancel Session (Learner)

```plantuml
@startuml

title TechConnect - Cancel Session (Learner) Flow

actor Learner
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor Tutor

Learner -> React: Click cancel button
activate React
React --> Learner: Show reason dialog
Learner -> React: Enter cancellation reason
React -> DB: UPDATE sessions\nSET status = 'cancelled',\ncancelled_reason = reason,\ncancelled_by = 'learner'
activate DB
DB --> React: Session updated
deactivate DB

React -> DB: INSERT INTO notifications
activate DB
DB --> React: Notification created
deactivate DB

React -> Realtime: Broadcast notification
activate Realtime
Realtime -> Tutor: Session cancelled by learner
deactivate Realtime

React --> Learner: Show success message
deactivate React

@enduml
```

### 7. Cancel Session (Tutor)

```plantuml
@startuml

title TechConnect - Cancel Session (Tutor) Flow

actor Tutor
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor Learner

Tutor -> React: Click cancel button
activate React
React --> Tutor: Show reason dialog
Tutor -> React: Enter cancellation reason
React -> DB: UPDATE sessions\nSET status = 'cancelled',\ncancelled_reason = reason,\ncancelled_by = 'tutor'
activate DB
DB --> React: Session updated
deactivate DB

React -> DB: INSERT INTO notifications
activate DB
DB --> React: Notification created
deactivate DB

React -> Realtime: Broadcast notification
activate Realtime
Realtime -> Learner: Session cancelled by tutor
deactivate Realtime

React --> Tutor: Show success message
deactivate React

@enduml
```

### 8. Mark Session Completed

**Figure 28. Mark Session as Completed Flow** - Technical flow for automatic session completion.

```plantuml
@startuml

title TechConnect - Mark Session Completed Flow

actor Tutor
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor Learner

Tutor -> React: Click "End Session"
activate React
React --> Tutor: Show session log dialog
Tutor -> React: Enter session notes
Tutor -> React: Click "Complete"
React -> DB: UPDATE sessions\nSET status = 'completed'
activate DB
DB --> React: Session updated
deactivate DB

React -> DB: INSERT INTO session_logs
activate DB
DB --> React: Log saved
deactivate DB

React -> DB: INSERT INTO notifications\n(type: feedback_request)
activate DB
DB --> React: Notification created
deactivate DB

React -> Realtime: Broadcast notification
activate Realtime
Realtime -> Learner: Feedback request
deactivate Realtime

React --> Tutor: Show success message
deactivate React

@enduml
```

### 9. Auto-Mark Missed Session

**Figure 29. Mark Session as Missed Flow** - Technical flow for detecting and marking missed sessions.

```plantuml
@startuml

title TechConnect - Auto-Mark Missed Session Flow

participant "Database" as Cron
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor Tutor
actor Learner

Cron -> DB: SELECT overdue sessions
activate DB
DB --> Cron: List of overdue sessions
deactivate DB

loop For each overdue session
    Cron -> DB: UPDATE sessions\nSET status = 'missed'
    activate DB
    DB --> Cron: Session updated
    deactivate DB
    
    Cron -> DB: INSERT notifications\n(for tutor and learner)
    activate DB
    DB --> Cron: Notifications created
    deactivate DB
end

Cron -> Realtime: Broadcast notifications
activate Realtime
Realtime -> Tutor: Session marked as missed
Realtime -> Learner: Session marked as missed
deactivate Realtime

@enduml
```

### 10. View Session History

**Figure 30. View Session Details Flow** - Technical flow for fetching a
@startuml

title TechConnect - View Session History Flow

actor User
participant "React UI" as React
participant "Supabase DB" as DB

User -> React: Navigate to session history
activate React
React -> DB: SELECT sessions\nWHERE user_id = current_user\nORDER BY scheduled_at DESC
activate DB
DB --> React: Session list
deactivate DB

React --> User: Display sessions

User -> React: Apply filters
React -> DB: SELECT with filters
activate DB
DB --> React: Filtered sessions
deactivate DB

React --> User: Display filtered sessions
deactivate React

@enduml
```

---

**Total Diagrams in this file: 20 (10 Activity + 10 Sequence)**
