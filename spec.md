# Kulongo Play

## Current State
The app uses Internet Identity for authentication. The backend has authorization component integrated. Currently, the app loads without requiring login - no dedicated login/signup screen exists for listeners. The `showProfileSetup` modal appears after login but there's no explicit auth gate.

## Requested Changes (Diff)

### Add
- `AuthPage` component: a full-screen listener login/signup screen shown when user is not authenticated
- The page shows the Kulongo Play logo, a welcome message, and two CTA buttons: "Entrar com Google" and "Entrar com Email" -- both trigger Internet Identity login (since that's the underlying auth on ICP)
- Auth gate in `App.tsx` `RootLayout`: if not authenticated, render `AuthPage` instead of the main app

### Modify
- `App.tsx` `RootLayout`: check `identity` from `useInternetIdentity` -- if null/undefined and not initializing, show `AuthPage` full-screen; otherwise show normal layout

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/AuthPage.tsx` with a beautiful branded login/signup screen showing logo, tagline, and two buttons (Google + Email) both calling `login()` from `useInternetIdentity`
2. Update `RootLayout` in `App.tsx` to gate on authentication: if `!identity && !isInitializing`, render `<AuthPage />` instead of the main layout
3. The auth page must match the app's dark purple theme, show the Kulongo logo symbol, have vibrant orange CTA buttons, and feel premium like a streaming platform
