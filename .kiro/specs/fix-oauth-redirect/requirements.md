# Requirements Document

## Introduction

This document outlines the requirements for fixing the Google OAuth redirect URI mismatch that causes authentication failures when users attempt to sign in to the admin portal. Currently, after successful Google authentication, users are redirected to localhost:8080 instead of the correct application URL, resulting in a connection error.

## Glossary

- **OAuth Application**: The authentication system that handles Google sign-in for admin users
- **Redirect URI**: The URL where users are sent after completing OAuth authentication
- **Supabase Auth**: The authentication service managing user sessions and OAuth providers
- **Admin Portal**: The restricted area of the application accessible only to administrators

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to sign in with Google OAuth so that I can access the admin dashboard securely

#### Acceptance Criteria

1. WHEN an administrator clicks "Sign in with Google" on the admin login page, THE OAuth Application SHALL initiate the Google OAuth flow with the correct redirect URI
2. WHEN Google authentication completes successfully, THE OAuth Application SHALL redirect the user to the admin login page at the current application origin
3. WHEN the OAuth callback is received, THE OAuth Application SHALL extract the authentication tokens from the URL hash
4. WHEN authentication tokens are valid, THE OAuth Application SHALL verify the user's admin role
5. IF the user has admin role, THEN THE OAuth Application SHALL navigate the user to the admin dashboard

### Requirement 2

**User Story:** As a developer, I want the OAuth redirect URI to work in both development and production environments so that authentication works consistently across deployments

#### Acceptance Criteria

1. THE OAuth Application SHALL use the current window origin as the base URL for redirect URIs
2. THE OAuth Application SHALL support localhost development URLs with any port number
3. THE OAuth Application SHALL support production URLs on custom domains
4. WHEN the environment changes, THE OAuth Application SHALL automatically use the correct redirect URI without code changes

### Requirement 3

**User Story:** As an administrator, I want clear error messages when authentication fails so that I understand what went wrong

#### Acceptance Criteria

1. IF Google OAuth fails, THEN THE OAuth Application SHALL display a toast notification with the error message
2. IF the user lacks admin privileges, THEN THE OAuth Application SHALL display an "Access Denied" message
3. IF the user lacks admin privileges, THEN THE OAuth Application SHALL sign out the user automatically
4. WHEN authentication errors occur, THE OAuth Application SHALL stop the loading state and allow retry

### Requirement 4

**User Story:** As a developer, I want to configure the Supabase OAuth redirect URIs so that the authentication service accepts redirects from valid application URLs

#### Acceptance Criteria

1. THE Supabase Auth SHALL accept redirect URIs from localhost with common development ports (5173, 3000, 8080)
2. THE Supabase Auth SHALL accept redirect URIs from the production domain
3. THE Supabase Auth SHALL validate redirect URIs match the configured allowed list
4. WHEN a redirect URI is not in the allowed list, THE Supabase Auth SHALL reject the authentication attempt
