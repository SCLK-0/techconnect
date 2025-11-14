# Design Document

## Overview

The OAuth redirect URI mismatch occurs because Supabase is configured to redirect to `localhost:8080` while the application expects redirects to the current origin (e.g., `localhost:5173` in development). This design addresses the issue through two complementary approaches:

1. **Application-side fix**: Update the OAuth configuration to use dynamic redirect URIs
2. **Supabase configuration**: Add all valid redirect URIs to the Supabase project settings

## Architecture

### Current Flow (Broken)
```
User clicks "Sign in with Google"
  ↓
App calls signInWithOAuth with redirectTo: "http://localhost:5173/admin/login"
  ↓
Supabase redirects to Google OAuth
  ↓
Google authenticates user
  ↓
Google redirects to Supabase callback
  ↓
Supabase redirects to "http://localhost:8080/..." (configured in Supabase dashboard)
  ↓
❌ Connection refused (port 8080 not running)
```

### Fixed Flow
```
User clicks "Sign in with Google"
  ↓
App calls signInWithOAuth with redirectTo: "http://localhost:5173/admin/login"
  ↓
Supabase redirects to Google OAuth
  ↓
Google authenticates user
  ↓
Google redirects to Supabase callback
  ↓
Supabase redirects to "http://localhost:5173/admin/login" (matches allowed list)
  ↓
✅ App receives callback and processes authentication
```

## Components and Interfaces

### 1. AdminLogin Component
**Location**: `src/pages/admin/AdminLogin.tsx`

**Current Implementation**:
- Uses `window.location.origin` for redirect URI (correct)
- Handles OAuth callback via URL hash parameters
- Checks user role after authentication

**Required Changes**: None - the component is already correctly configured

### 2. Supabase Client Configuration
**Location**: `src/integrations/supabase/client.ts`

**Current Implementation**:
- Uses localStorage for session persistence
- Auto-refreshes tokens
- No custom auth configuration

**Required Changes**: None - default configuration is sufficient

### 3. Supabase Project Settings
**Location**: Supabase Dashboard → Authentication → URL Configuration

**Current State**: 
- Redirect URLs likely only include `localhost:8080`

**Required Configuration**:
```
Site URL: http://localhost:5173

Redirect URLs:
- http://localhost:5173/**
- http://localhost:3000/**
- http://localhost:8080/**
- https://<production-domain>/**
```

## Data Models

No data model changes required. The existing `user_roles` table structure is sufficient:

```sql
user_roles (
  user_id: uuid (FK to auth.users)
  role: text
)
```

## Error Handling

### Current Error Handling
The AdminLogin component already implements proper error handling:

1. **OAuth Errors**: Caught and displayed via toast notification
2. **Role Check Failures**: Shows "Access Denied" and signs out user
3. **Session Errors**: Handled gracefully with no action if no session exists

### Additional Error Handling
No additional error handling needed. The existing implementation covers:
- Network failures during OAuth
- Invalid credentials
- Missing admin role
- Session expiration

## Testing Strategy

### Manual Testing Steps

1. **Development Environment Test**:
   - Start dev server on default port (5173)
   - Navigate to `/admin/login`
   - Click "Sign in with Google"
   - Verify redirect to Google OAuth
   - Complete authentication
   - Verify redirect back to `localhost:5173/admin/login`
   - Verify admin role check and dashboard navigation

2. **Alternative Port Test**:
   - Start dev server on port 3000
   - Repeat authentication flow
   - Verify successful redirect

3. **Non-Admin User Test**:
   - Sign in with non-admin Google account
   - Verify "Access Denied" message
   - Verify automatic sign-out

4. **Error Scenario Test**:
   - Test with invalid/revoked OAuth credentials
   - Verify error toast appears
   - Verify loading state resets

### Configuration Validation

1. **Supabase Dashboard Check**:
   - Verify all redirect URLs are added
   - Verify Google OAuth provider is enabled
   - Verify client ID and secret are configured

2. **Environment Variables Check**:
   - Verify `.env` contains correct Supabase URL
   - Verify `.env` contains correct publishable key
   - Verify project ID matches

## Implementation Notes

### Root Cause Analysis
The issue stems from a mismatch between:
- **Application expectation**: Redirect to current origin (e.g., `localhost:5173`)
- **Supabase configuration**: Redirect to `localhost:8080` (likely from previous configuration)

### Why the Code is Already Correct
The application code uses `window.location.origin` which dynamically adapts to any environment. This is the correct approach and requires no changes.

### What Needs to Change
Only the Supabase project configuration needs updating to include all valid redirect URIs in the allowed list.

### Configuration Steps
1. Log into Supabase Dashboard
2. Navigate to Authentication → URL Configuration
3. Add redirect URLs for all environments:
   - Development: `http://localhost:5173/**`, `http://localhost:3000/**`
   - Production: `https://<your-domain>/**`
4. Save configuration
5. Test authentication flow

### Wildcard Pattern Support
Supabase supports wildcard patterns in redirect URLs:
- `http://localhost:5173/**` matches any path on that origin
- This allows flexibility for different routes without listing each one

## Security Considerations

1. **Redirect URI Validation**: Supabase validates redirect URIs against the allowed list, preventing open redirect vulnerabilities
2. **Token Handling**: Tokens are passed via URL hash (not query params), preventing server-side logging
3. **Session Storage**: Using localStorage with auto-refresh provides good balance of security and UX
4. **Role-Based Access**: Admin role check happens server-side via database query, not client-side only

## Production Deployment

### Pre-Deployment Checklist
- [ ] Add production domain to Supabase redirect URLs
- [ ] Verify Google OAuth consent screen is configured for production
- [ ] Test OAuth flow in staging environment
- [ ] Verify environment variables are set in production

### Post-Deployment Verification
- [ ] Test admin login from production URL
- [ ] Verify redirect works correctly
- [ ] Test with both admin and non-admin accounts
- [ ] Monitor error logs for authentication issues
