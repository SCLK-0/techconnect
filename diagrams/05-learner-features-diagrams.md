# Learner Features Diagrams

## Activity Diagrams

### 1. Browse and Search Tutors

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Browse and Search Tutors Process**" {
start
:Learner navigates to tutors page;
:View all available tutors;

fork
  :Apply filters;
  :Select subject;
  :Select year level;
  :Toggle "Available Now";
fork again
  :Enter search query;
  :Fuzzy search by name;
end fork

:System filters tutors;
:Display filtered results;

if (Results found?) then (yes)
  :Show tutor cards;
  :Display ratings and stats;
  :Show online status;
  
  if (Click tutor card?) then (yes)
    :Navigate to tutor profile;
    stop
  else (no)
    :Continue browsing;
    stop
  endif
else (no)
  :Show "No tutors found";
  :Suggest clearing filters;
  stop
endif

@enduml
```

###  Add Tutor to Favorites

**Figure 58. Add Tutor to Favorites Process** - Learners add/remove tutors from favorites list.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Add Tutor to Favorites Process**" {
start
:Learner views tutor profile;
:See favorite button;

if (Already favorited?) then (yes)
  :Click to unfavorite;
  :Remove from favorite_tutors table;
  :Update button state;
  :Show "Removed from favorites";
  stop
else (no)
  :Click to favorite;
  :Add to favorite_tutors table;
  :Update button state;
  :Show "Added to favorites";
  stop
endif

@enduml
```

###  Submit Feedback and Rating

**Figure 59. Submit Feedback and Rating Process** - Learners rate sessions with stars, tags, and comments.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Submit Feedback and Rating Process**" {
start
:Session completed;
:Feedback modal opens;
:Select star rating (1-5);
:Select rating tags (optional);
:Write comment (optional);

if (Rating selected?) then (yes)
  :Click submit;
  :Insert feedback and tags;
else (no)
  :Show error: "Please select rating";
  stop
endif

if (Tutor has donation QR?) then (yes)
  :Show donation QR dialog;
  :Learner closes dialog;
  :Return to dashboard;
  stop
else (no)
  :Return to dashboard;
  stop
endif

@enduml
```

###  View Favorite Tutors

**Figure 60. View Favorite Tutors Process** - Learners view their saved favorite tutors list.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - View Favorite Tutors Process**" {
start
:Learner navigates to favorites;
:System fetches favorite tutors;

if (Has favorites?) then (yes)
  :Display favorite tutors;
  
  if (Click tutor?) then (yes)
    :Navigate to profile;
  else (no)
    :Continue browsing;
  endif
else (no)
  :Show "No favorites yet";
endif

stop

@enduml
```

###  View Tutor Profile

**Figure 61. View Tutor Profile Process** - Learners view detailed tutor information and ratings.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - View Tutor Details Process**" {
start
:Learner clicks tutor card;
:View tutor details dialog;

fork
  :Display tutor information;
fork again
  :Display ratings and reviews;
fork again
  :Display availability;
end fork

if (Take action?) then (yes)
  :Book session or add to favorites;
else (no)
  :Close dialog;
endif

stop

@enduml
```

---

## Sequence Diagrams

### 1. Browse and Search Tutors

**Figure 62. Browse and Search Tutors Flow** - Technical flow for fetching and filtering tutors.

```plantuml
@startuml

title TechConnect - Browse and Search Tutors Flow

actor Learner
participant "React UI" as React
participant "Supabase DB" as DB

Learner -> React: Navigate to tutors page
activate React

React -> DB: Fetch all approved tutors
activate DB
DB -> DB: JOIN tutor_profiles\nWHERE status = 'approved'
DB -> DB: Get ratings and stats
DB --> React: Tutor list with data
deactivate DB

React --> Learner: Display tutor cards

Learner -> React: Apply filters/search
React -> React: Filter tutors locally\n(fuzzy search algorithm)

alt Filters Applied
    React -> React: Filter by subject
    React -> React: Filter by year level
    React -> React: Filter by availability
end

React --> Learner: Display filtered results

Learner -> React: Click tutor card
React --> Learner: Navigate to tutor profile
deactivate React

@enduml
```

###  Add Tutor to Favorites

**Figure 63. Add Tutor to Favorites Flow** - Technical flow for toggling favorite status.

```plantuml
@startuml

title TechConnect - Add Tutor to Favorites Flow

actor Learner
participant "React UI" as React
participant "Supabase DB" as DB

Learner -> React: View tutor profile
activate React

React -> DB: Check if favorited
activate DB
DB --> React: Favorite status
deactivate DB

React --> Learner: Display favorite button state

Learner -> React: Click favorite button

alt Not Favorited
    React -> DB: INSERT into favorite_tutors
    activate DB
    DB --> React: Favorite added
    deactivate DB
    React --> Learner: Show "Added to favorites"
else Already Favorited
    React -> DB: DELETE from favorite_tutors
    activate DB
    DB --> React: Favorite removed
    deactivate DB
    React --> Learner: Show "Removed from favorites"
end

React -> React: Update button state
deactivate React

@enduml
```

###  Submit Feedback and Rating

**Figure 64. Submit Feedback and Rating Flow** - Technical flow for submitting feedback with optional donation QR.

```plantuml
@startuml

title TechConnect - Submit Feedback and Rating Flow

actor Learner
participant "React UI" as React
participant "Supabase DB" as DB

Learner -> React: Session ends
activate React
React --> Learner: Show feedback modal (required)

Learner -> React: Select rating (1-5 stars)
Learner -> React: Select rating tags (optional)
Learner -> React: Write comment (optional)
Learner -> React: Click submit

React -> DB: INSERT into feedback
activate DB
DB --> React: Feedback created
deactivate DB

React -> DB: INSERT rating tags
activate DB
DB --> React: Tags saved
deactivate DB

React -> DB: Check tutor donation QR
activate DB
DB --> React: QR code (if exists)
deactivate DB

alt Tutor has donation QR
    React --> Learner: Show donation QR dialog
    Learner -> React: Close dialog
end

React --> Learner: Return to dashboard
deactivate React

@enduml
```

###  View Favorite Tutors

**Figure 65. View Favorite Tutors Flow** - Technical flow for retrieving favorite tutors with details.

```plantuml
@startuml

title TechConnect - View Favorite Tutors Flow

actor Learner
participant "React UI" as React
participant "Supabase DB" as DB

Learner -> React: Navigate to favorites page
activate React

React -> DB: Call get_favorite_tutors(learner_id)
activate DB
DB -> DB: SELECT FROM favorite_tutors\nJOIN tutor_profiles\nJOIN profiles
DB -> DB: Get ratings and stats
DB -> DB: Check online status
DB --> React: Favorite tutors with details
deactivate DB

alt Has Favorites
    React --> Learner: Display favorite tutor cards
    Learner -> React: Click tutor card
    React --> Learner: Navigate to tutor profile
else No Favorites
    React --> Learner: Show empty state
    React --> Learner: Show "Browse Tutors" button
end

deactivate React

@enduml
```

###  View Tutor Details

**Figure 66. View Tutor Profile Flow** - Technical flow for fetching comprehensive tutor information.

```plantuml
@startuml

title TechConnect - View Tutor Details Flow

actor Learner
participant "React UI" as React
participant "Supabase DB" as DB

Learner -> React: Click tutor card
activate React

React -> DB: Fetch tutor data
activate DB
DB --> React: Tutor info, ratings, reviews
deactivate DB

React --> Learner: Display tutor details dialog

Learner -> React: Take action
alt Book Session
    React --> Learner: Open booking dialog
else Add to Favorites
    React -> DB: Toggle favorite
    React --> Learner: Update favorite status
end

deactivate React

@enduml
```

---

**Total Diagrams in this file: 10 (5 Activity + 5 Sequence)**
