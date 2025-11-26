# Tutor Features Diagrams

## Activity Diagrams

### 1. Manage Availability

**Figure 47. Manage Availability Process** - Tutors set weekly schedule and date-specific availability.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Manage Availability Process**" {
start
:Tutor navigates to availability;
:View current schedule;
:Edit availability;

if (Weekly or date-specific?) then (weekly)
  :Update weekly schedule;
else (date)
  :Set date override;
endif

:Save changes;
:Show success message;

stop

@enduml
```

###  Upload Resource

**Figure 48. Upload Resource Process** - Tutors upload educational resources for admin approval.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Upload Resource Process**" {
start
:Tutor navigates to resources;
:Click upload button;
:Fill resource form;
:Select file;

if (Valid file?) then (yes)
  :Upload to storage;
  :Create resource record (pending);
  :Notify admin for approval;
  :Show success message;
else (no)
  :Show validation error;
endif

stop

@enduml
```

###  Upload Donation QR Code

**Figure 49. Upload Donation QR Code Process** - Tutors upload donation QR codes for learner tips.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Upload Donation QR Code Process**" {
start
:Tutor navigates to profile settings;
:Click "Donation Settings";
:View current QR code (if exists);
:Click "Upload QR Code";
:Select image file;

if (Image selected?) then (yes)
  if (Valid image format?) then (yes)
    if (Image size < 2MB?) then (yes)
      :Preview image;
      :Confirm upload;
      
      if (Confirm?) then (yes)
        :Convert image to Base64;
        :Update tutor_profiles.donation_qr_code;
        :Show success message;
        :Display uploaded QR code;
        stop
      else (no)
        :Cancel upload;
        stop
      endif
    else (no)
      :Show error: "Image too large";
      stop
    endif
  else (no)
    :Show error: "Invalid image format";
    stop
  endif
else (no)
  :Show error: "Please select an image";
  stop
endif

@enduml
```

###  Toggle Online Status

**Figure 50. Toggle Online Status Process** - Tutors toggle availability for instant sessions.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Toggle Online Status Process**" {
start
:Tutor views dashboard;
:See current online status;
:Click status toggle;

if (Currently online?) then (yes)
  :Set is_online = false;
  :Update database;
  :Stop listening for instant requests;
  :Show "You are now offline";
  stop
else (no)
  if (Tutor approved?) then (yes)
    :Set is_online = true;
    :Update database;
    :Start listening for instant requests;
    :Show "You are now online";
    stop
  else (no)
    :Show error: "Awaiting admin approval";
    stop
  endif
endif

@enduml
```

###  View Session Statistics

**Figure 51. View Session Statistics Process** - Tutors view dashboard with session stats and ratings.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - View Session Statistics Process**" {
start
:Tutor navigates to dashboard;

fork
  :Fetch total sessions;
fork again
  :Fetch completed sessions;
fork again
  :Fetch average rating;
fork again
  :Fetch pending requests;
fork again
  :Fetch recent sessions;
end fork

:Display 4 statistics cards;
:Display recent sessions list;

stop

@enduml
```

---

## Sequence Diagrams

### 1. Manage Availability

**Figure 52. Manage Availability Flow** - Technical flow for updating tutor availability schedules.

```plantuml
@startuml

title TechConnect - Manage Availability Flow

actor Tutor
participant "React UI" as React
participant "Supabase DB" as DB

Tutor -> React: Navigate to availability page
activate React
React -> DB: Fetch current availability
activate DB
DB --> React: Weekly schedule + date overrides
deactivate DB
React --> Tutor: Display availability calendar

Tutor -> React: Edit availability
Tutor -> React: Toggle day/add time slots
React -> React: Validate time slots

Tutor -> React: Click save
React -> DB: UPDATE tutor_availability
activate DB
DB --> React: Availability updated
deactivate DB

React -> DB: INSERT/UPDATE tutor_day_availability
activate DB
DB --> React: Date overrides saved
deactivate DB

React --> Tutor: Show success message
React --> Tutor: Refresh calendar
deactivate React

@enduml
```

###  Upload Resource

**Figure 53. Upload Resource Flow** - Technical flow for uploading resources and notifying admins.

```plantuml
@startuml

title TechConnect - Upload Resource Flow

actor Tutor
participant "React UI" as React
participant "Supabase Storage" as Storage
participant "Supabase DB" as DB
participant "Supabase" as Realtime
actor Admin

Tutor -> React: Click "Upload Resource"
activate React
React --> Tutor: Show upload form

Tutor -> React: Fill form + select file
React -> React: Validate file (type, size)

Tutor -> React: Click upload
React -> Storage: Upload file
activate Storage
Storage --> React: File URL
deactivate Storage

React -> DB: INSERT into resources\n(status: pending)
activate DB
DB --> React: Resource created
deactivate DB

React -> DB: Create notification for admin
activate DB
DB --> React: Notification created
deactivate DB

React -> Realtime: Broadcast to admin
activate Realtime
Realtime -> Admin: New resource pending approval
deactivate Realtime

React --> Tutor: Show success message
deactivate React

@enduml
```

###  Upload Donation QR Code

**Figure 54. Upload Donation QR Code Flow** - Technical flow for uploading and storing QR codes.

```plantuml
@startuml

title TechConnect - Upload Donation QR Code Flow

actor Tutor
participant "React UI" as React
participant "Supabase DB" as DB

Tutor -> React: Navigate to donation settings
activate React
React -> DB: Fetch current QR code
activate DB
DB --> React: donation_qr_code (Base64 or null)
deactivate DB
React --> Tutor: Display current QR or upload button

Tutor -> React: Select image file
React -> React: Validate image (type, size)
React -> React: Preview image

Tutor -> React: Confirm upload
React -> React: Convert image to Base64

React -> DB: UPDATE tutor_profiles\nSET donation_qr_code = base64
activate DB
DB --> React: QR code updated
deactivate DB

React --> Tutor: Show success message
React --> Tutor: Display uploaded QR code
deactivate React

@enduml
```

###  Toggle Online Status

**Figure 55. Toggle Online Status Flow** - Technical flow for toggling online status and instant session availability.

```plantuml
@startuml

title TechConnect - Toggle Online Status Flow

actor Tutor
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase" as Realtime

Tutor -> React: Click status toggle
activate React
React -> React: Check current status

React -> DB: UPDATE tutor_profiles\nSET is_online = !is_online
activate DB
DB --> React: Status updated
deactivate DB

alt Now Online
    React -> Realtime: Subscribe to instant requests
    activate Realtime
    Realtime --> React: Listening for requests
    deactivate Realtime
    React --> Tutor: Show "You are now online"
else Now Offline
    React -> Realtime: Unsubscribe from instant requests
    activate Realtime
    Realtime --> React: Stopped listening
    deactivate Realtime
    React --> Tutor: Show "You are now offline"
end

deactivate React

@enduml
```

###  View Session Statistics

**Figure 56. View Session Statistics Flow** - Technical flow for fetching and displaying tutor statistics.

```plantuml
@startuml

title TechConnect - View Session Statistics Flow

actor Tutor
participant "React UI" as React
participant "Supabase DB" as DB

Tutor -> React: Navigate to dashboard
activate React

React -> DB: Call get_tutor_stats(tutor_id)
activate DB
DB -> DB: Count total sessions
DB -> DB: Count completed sessions
DB -> DB: Count pending sessions
DB -> DB: Calculate average rating
DB -> DB: Count total reviews
DB --> React: Statistics data
deactivate DB

React -> DB: Fetch recent sessions (limit 5)
activate DB
DB -> DB: Get sessions ordered by date
DB -> DB: Join with learner profiles
DB --> React: Recent sessions with learner names
deactivate DB

React --> Tutor: Display 4 stat cards + recent sessions
deactivate React

@enduml
```

---

**Total Diagrams in this file: 10 (5 Activity + 5 Sequence)**
