# Admin Features Diagrams

## Activity Diagrams

### 1. Approve Tutor

**Figure 67. Approve Tutor Process** - Admins review and approve/reject tutor applications.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Approve Tutor Process**" {
start
:Admin views pending tutors;
:Select tutor to review;
:Review credentials;

if (Approve tutor?) then (yes)
  :Update status to approved;
  
  fork
    :Notify tutor (in-app);
  fork again
    :Notify tutor (email);
  end fork
  
  :Show success message;
else (no)
  :Update status to rejected;
  :Notify tutor with reason;
endif

stop

@enduml
```

###  Manage Users

**Figure 68. Manage Users Process** - Admins manage user accounts, change roles, suspend users.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Manage Users Process**" {
start
:Admin navigates to user management;
:View all users;
:Apply filters;

if (Select user?) then (yes)
  :View user details;
  :Take action (change role/suspend);
  :Update database;
  :Show success message;
else (no)
  :Continue browsing;
endif

stop

@enduml
```

###  Monitor Active Sessions

**Figure 69. Monitor Active Sessions Process** - Admins monitor live sessions in real-time.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Monitor Active Sessions Process**" {
start
:Admin navigates to monitoring;
:View active sessions;

if (Active sessions exist?) then (yes)
  :Display session list;
  
  if (Click monitor?) then (yes)
    fork
      :View whiteboard state;
    fork again
      :View chat messages;
    fork again
      :View connection status;
    end fork
    
    :Monitor session;
  else (no)
    :View details only;
  endif
else (no)
  :Show "No active sessions";
endif

stop

@enduml
```

###  Manage Resources

**Figure 70. Manage Resources Process** - Admins approve or reject tutor-uploaded resources.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Manage Resources Process**" {
start
:Admin views pending resources;
:Select resource to review;

if (Approve resource?) then (yes)
  :Update status to approved;
  :Notify tutor;
  :Show success message;
else (no)
  :Update status to rejected;
  :Delete file;
  :Notify tutor with reason;
endif

stop

@enduml
```

###  View Analytics Dashboard

**Figure 71. View Analytics Dashboard Process** - Admins view system statistics and analytics.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - View Analytics Dashboard Process**" {
start
:Admin navigates to analytics;

fork
  :Fetch user statistics;
fork again
  :Fetch session statistics;
fork again
  :Fetch tutor statistics;
fork again
  :Fetch resource count;
end fork

:Display analytics dashboard;
:Show completion rate;
:Show engagement metrics;

stop

@enduml
```

---

## Sequence Diagrams

### 1. Approve Tutor

**Figure 72. Approve Tutor Flow** - Technical flow for approving tutors with notifications.

```plantuml
@startuml

title TechConnect - Approve Tutor Flow

actor Admin
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase Edge" as Edge
actor Tutor

Admin -> React: Navigate to tutor management
activate React

React -> DB: Fetch pending tutors
activate DB
DB --> React: Pending tutor list
deactivate DB

React --> Admin: Display pending tutors

Admin -> React: Select tutor to review
React -> DB: Fetch tutor details
activate DB
DB --> React: Tutor profile data
deactivate DB

React --> Admin: Display tutor profile

Admin -> React: Click "Approve"
React -> DB: UPDATE tutor_profiles\nSET status = 'approved'
activate DB
DB --> React: Status updated
deactivate DB

React -> DB: Create notification
activate DB
DB --> React: Notification created
deactivate DB

React -> Edge: Send approval email
activate Edge
Edge -> Tutor: Approval email
deactivate Edge

React --> Admin: Show success message
deactivate React

@enduml
```

###  Manage Users

**Figure 73. Manage Users Flow** - Technical flow for managing user accounts and roles.

```plantuml
@startuml

title TechConnect - Manage Users Flow

actor Admin
participant "React UI" as React
participant "Supabase DB" as DB

Admin -> React: Navigate to user management
activate React

React -> DB: Fetch all users
activate DB
DB --> React: User list with roles
deactivate DB

React --> Admin: Display user list

Admin -> React: Apply filters
React -> React: Filter users locally

React --> Admin: Display filtered results

Admin -> React: Select user
React -> DB: Fetch user details
activate DB
DB --> React: User data
deactivate DB

React --> Admin: Display user details

Admin -> React: Take action (change role/suspend)
React -> DB: Update database
activate DB
DB --> React: Updated
deactivate DB

React --> Admin: Show success message

deactivate React

@enduml
```

###  Monitor Active Sessions

**Figure 74. Monitor Active Sessions Flow** - Technical flow for real-time session monitoring.

```plantuml
@startuml

title TechConnect - Monitor Active Sessions Flow

actor Admin
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime

Admin -> React: Navigate to session monitoring
activate React

React -> DB: Fetch active sessions
activate DB
DB -> DB: SELECT FROM sessions\nWHERE session_status = 'in_progress'
DB -> DB: JOIN with tutor and learner profiles
DB --> React: Active session list
deactivate DB

React --> Admin: Display active sessions

Admin -> React: Click "Monitor" on session
React -> DB: Fetch session details
activate DB
DB --> React: Session data
deactivate DB

React -> Realtime: Subscribe to session updates
activate Realtime
Realtime --> React: Connected to session
deactivate Realtime

React -> DB: Fetch whiteboard state
activate DB
DB --> React: Current whiteboard data
deactivate DB

React -> DB: Fetch chat messages
activate DB
DB --> React: Chat history
deactivate DB

React --> Admin: Display live monitoring view

loop Real-time Updates
    Realtime -> React: Whiteboard changes
    React --> Admin: Update whiteboard display
    
    Realtime -> React: New chat messages
    React --> Admin: Update chat display
end

Admin -> React: Close monitoring
React -> Realtime: Unsubscribe from session
deactivate React

@enduml
```

###  Manage Resources

**Figure 75. Manage Resources Flow** - Technical flow for approving/rejecting resources.

```plantuml
@startuml

title TechConnect - Manage Resources Flow

actor Admin
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase Storage" as Storage
participant "Supabase Edge" as Edge
actor Tutor

Admin -> React: Navigate to resource management
activate React

React -> DB: Fetch pending resources
activate DB
DB --> React: Pending resource list
deactivate DB

React --> Admin: Display pending resources

Admin -> React: Select resource to review
React -> DB: Fetch resource details
activate DB
DB --> React: Resource data
deactivate DB

React --> Admin: Display resource details

Admin -> React: Click "Approve" or "Reject"

alt Approve
    React -> DB: UPDATE resources\nSET status = 'approved'
    activate DB
    DB --> React: Status updated
    deactivate DB
    
    React -> DB: Create notification
    activate DB
    DB --> React: Notification created
    deactivate DB
    
    React -> Edge: Send approval email
    activate Edge
    Edge -> Tutor: Resource approved
    deactivate Edge
else Reject
    React -> DB: UPDATE resources\nSET status = 'rejected'
    activate DB
    DB --> React: Status updated
    deactivate DB
    
    React -> Storage: Delete file
    activate Storage
    Storage --> React: File deleted
    deactivate Storage
    
    React -> DB: Create notification
    activate DB
    DB --> React: Notification created
    deactivate DB
    
    React -> Edge: Send rejection email
    activate Edge
    Edge -> Tutor: Resource rejected
    deactivate Edge
end

React --> Admin: Show success message
deactivate React

@enduml
```

###  View Analytics Dashboard

**Figure 76. View Analytics Dashboard Flow** - Technical flow for fetching system analytics.

```plantuml
@startuml

title TechConnect - View Analytics Dashboard Flow

actor Admin
participant "React UI" as React
participant "Supabase DB" as DB

Admin -> React: Navigate to analytics
activate React

React -> DB: Fetch user statistics
activate DB
DB --> React: User counts
deactivate DB

React -> DB: Fetch session statistics
activate DB
DB -> DB: COUNT sessions GROUP BY status
DB -> DB: Calculate completion rate
DB --> React: Session stats
deactivate DB

React -> DB: Fetch popular subjects
activate DB
DB -> DB: COUNT sessions GROUP BY subject
DB -> DB: ORDER BY count DESC
DB --> React: Subject statistics
deactivate DB

React -> DB: Fetch top tutors
activate DB
DB --> React: Top-rated tutors
deactivate DB

React -> DB: Fetch activity trends
activate DB
DB --> React: Trend data
deactivate DB

React --> Admin: Display analytics dashboard

Admin -> React: Click "Export"
React -> React: Generate CSV report
React --> Admin: Download file

deactivate React

@enduml
```

---

**Total Diagrams in this file: 10 (5 Activity + 5 Sequence)**
