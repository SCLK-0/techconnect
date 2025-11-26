# Authentication & User Management Diagrams

## Activity Diagrams

### 1. User Registration

**Figure 1. User Registration Process**

This diagram shows how users register for TechConnect by selecting their role (Tutor or Learner), filling out the registration form with role-specific fields, and creating an account. The system validates input, creates the account via Supabase Auth, and sends a verification email.

  ```plantuml
  @startuml
  skinparam conditionStyle diamond

  rectangle "**TechConnect - User Registration Process**" {
  start
  :Navigate to role selection;
  :Choose role (Tutor/Learner);
  :Navigate to registration form;
  :Enter email, password, name;

  if (Role = Tutor?) then (yes)
    :Enter bio;
    :Select subject expertise;
    :Select registered year;
  else (no)
    :Select subjects of interest;
    :Select registered year;
  endif

  :Click register button;

  if (Valid input?) then (yes)
    :Create account via Supabase Auth;
    :Store metadata in auth.users;
    
    fork
      :Send verification email;
    fork again
      :Redirect to verification page;
    end fork
    
    :Show success message;
  else (no)
    :Show validation error;
  endif
  
  stop
  }

  @enduml
  ```

### 2. Email Verification

**Figure 2. Email Verification Process**

This diagram illustrates how users verify their email address by clicking the verification link sent to their inbox. The system validates the token, marks the email as verified, creates profile records, and redirects the user to their dashboard.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Email Verification Process**" {
start
:User receives verification email;
:Open email;
:Click verification link;

if (Token valid and not expired?) then (yes)
  :Mark email as verified;
  :Create profile records;
  :Show success message;
  :Redirect to dashboard;
else (no)
  :Show error message;
  :Offer to resend email;
endif

stop
}

@enduml
```

### 3. User Login

**Figure 3. User Login Process**

This diagram shows how users authenticate by entering their credentials. The system verifies the credentials and email verification status, retrieves the user's role from the database, and redirects them to their role-specific dashboard.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - User Login Process**" {
start
:Navigate to login page;
:Enter email and password;

if (Valid credentials and verified?) then (yes)
  :Authenticate via Supabase Auth;
  :Get user role from database;
  :Redirect to role-based dashboard;
else (no)
  :Show error message;
endif

stop
}

@enduml
```

### 4. Password Reset

**Figure 4. Password Reset Process**

This diagram depicts how users reset their forgotten password by requesting a reset email, clicking the reset link, and entering a new password. The system validates the token and updates the password in Supabase Auth.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Password Reset Process**" {
start
:Click "Forgot Password";
:Enter email address;

:Send password reset email;
:Show "Check your email" message;
:User clicks reset link;

if (Valid token and passwords match?) then (yes)
  :Update password in Supabase Auth;
  :Show success message;
  :Redirect to login;
else (no)
  :Show error message;
endif

stop
}

@enduml
```

### 5. Profile Update

**Figure 5. Profile Update Process**

This diagram shows how users update their profile information by navigating to the profile page, editing fields, optionally uploading an avatar, and saving changes. The system validates input and updates the profile in the database.

```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - Profile Update Process**" {
start
:Navigate to profile page;
:View current profile;
:Click edit button;
:Modify profile fields;
:Upload avatar (optional);
:Click save button;

if (Valid input?) then (yes)
  :Update profile in database;
  :Show success message;
else (no)
  :Show validation error;
endif

stop
}

@enduml
```

---

## Sequence Diagrams

### 1. User Registration

**Figure 6. User Registration Flow**

This sequence diagram describes the technical interactions during user registration. It shows how the React UI communicates with Supabase Auth to create an account, triggers the Edge Function to send a verification email, and handles the email verification process when the user clicks the link.

```plantuml
@startuml
title TechConnect - User Registration Flow

actor User
participant "React UI" as React
participant "Supabase Auth" as Auth
participant "Supabase DB" as DB
participant "Supabase Edge\nFunctions" as Edge

User -> React: Submit registration form
activate React
React -> Auth: Create account
activate Auth
Auth -> DB: Store user data
Auth --> React: Account created
deactivate Auth

React -> Edge: Send verification email
activate Edge
Edge -> User: Verification email
deactivate Edge
React --> User: Show "Check your email"
deactivate React

User -> React: Click verification link
activate React
React -> Auth: Verify email
activate Auth
Auth -> DB: Create profile records
Auth --> React: Email verified
deactivate Auth
React --> User: Redirect to dashboard
deactivate React

@enduml
```

### 2. User Login

**Figure 7. User Login Flow**

This sequence diagram illustrates how the system authenticates users by verifying credentials through Supabase Auth, retrieving user data from the database, and using React Router to navigate to the appropriate role-based dashboard.

```plantuml
@startuml
title TechConnect - User Login Flow

actor User
participant "React UI" as React
participant "Supabase Auth" as Auth
participant "Supabase DB" as DB
participant "React Router" as Router

User -> React: Enter credentials
activate React
React -> Auth: Sign in
activate Auth
Auth -> DB: Verify credentials
Auth --> React: Session + user data
deactivate Auth

React -> Router: Navigate to dashboard
activate Router
Router --> User: Role-based dashboard
deactivate Router
deactivate React

@enduml
```

### 3. Password Reset

**Figure 8. Password Reset Flow**

This sequence diagram shows the password reset process, including how the system sends a reset email via Edge Functions, handles the user clicking the reset link, and updates the password in Supabase Auth.

```plantuml
@startuml
title TechConnect - Password Reset Flow

actor User
participant "React UI" as React
participant "Supabase Auth" as Auth
participant "Supabase Edge\nFunctions" as Edge

User -> React: Request password reset
activate React
React -> Auth: Send reset email
activate Auth
Auth -> Edge: Trigger email
activate Edge
Edge -> User: Reset email
deactivate Edge
deactivate Auth
React --> User: Show "Check your email"
deactivate React

User -> React: Click reset link
activate React
User -> React: Enter new password
React -> Auth: Update password
activate Auth
Auth --> React: Password updated
deactivate Auth
React --> User: Redirect to login
deactivate React

@enduml
```

### 4. Profile Update

**Figure 9. Profile Update Flow**

This sequence diagram describes how users update their profile, including fetching current profile data, uploading a new avatar to Supabase Storage if changed, and updating profile information in the database.

```plantuml
@startuml
title TechConnect - Profile Update Flow

actor User
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase Storage" as Storage

User -> React: Navigate to profile
activate React
React -> DB: Fetch profile
activate DB
DB --> React: Profile data
deactivate DB
React --> User: Display profile

User -> React: Edit and save
React -> Storage: Upload avatar (if changed)
activate Storage
Storage --> React: Image URL
deactivate Storage

React -> DB: Update profile
activate DB
DB --> React: Updated
deactivate DB
React --> User: Show success
deactivate React

@enduml
```

### 5. Tutor Profile Setup

**Figure 10. Tutor Profile Setup Flow**

This sequence diagram shows how tutors complete their profile setup by submitting tutor-specific information. The system creates a pending tutor profile and uses Supabase Realtime to notify admins of the new tutor awaiting approval.

```plantuml
@startuml
title TechConnect - Tutor Profile Setup Flow

actor Tutor
participant "React UI" as React
participant "Supabase DB" as DB
participant "Supabase\nRealtime" as Realtime
actor Admin

Tutor -> React: Submit tutor profile
activate React
React -> DB: Create tutor profile (pending)
activate DB
DB --> React: Profile created
deactivate DB

React -> Realtime: Notify admin
activate Realtime
Realtime -> Admin: New tutor pending
deactivate Realtime

React --> Tutor: Show "Awaiting approval"
deactivate React

@enduml
```

---

**Total Diagrams in this file: 10 (5 Activity + 5 Sequence)**
