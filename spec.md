# Kulongo Play

## Current State
AuthPage has two login buttons in the login step: "Continuar com Google" and "Entrar com Email", both calling the same `login` function from Internet Identity.

## Requested Changes (Diff)

### Add
- Facebook login button
- Instagram login button  
- TikTok login button
- Apple login button (optional, popular globally)

### Modify
- Login step layout to accommodate more social buttons in a clean grid or list

### Remove
- Nothing

## Implementation Plan
- Add Facebook, Instagram, TikTok social login buttons to the login step in AuthPage.tsx
- All buttons call the same `login` function (Internet Identity handles auth under the hood)
- Keep the same visual style: bordered cards with brand colors/icons
- Arrange buttons in a clean list (same as current) or 2-column grid if 4+ options
