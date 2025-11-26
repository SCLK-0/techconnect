# Notification System Diagrams

## Activity Diagrams

### 1. View Notifications

**Figure 77. View Notifications Process** - Users view and mark notifications as read.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - View Notifications Process**" {
start
:User clicks notification bell;
:Fetch notifications;

if (Has notifications?) then (yes)
  :Display notification list;
  
  if (Click notification?) then (yes)
    :Mark as read;
  else (no)
    :Continue viewing;
  endif
else (no)
  :Show "No notifications";
endif

stop

@enduml
```

---

## Sequence Diagrams

### 1. View Notifications

**Figure 78. View Notifications Flow** - Technical flow for fetching and displaying notifications.

```plantuml
@startuml

title TechConnect - View Notifications Flow

actor User
participant "React UI" as React
participant "Supabase DB" as DB

User -> React: Click notification bell
activate React
React -> DB: Fetch notifications
activate DB
DB --> React: Notification list
deactivate DB
React --> User: Display dropdown

User -> React: Click notification
React -> DB: Mark as read
activate DB
DB --> React: Updated
deactivate DB
React --> User: Update UI
deactivate React

@enduml
```

---

**Total Diagrams in this file: 2 (1 Activity + 1 Sequence)**
