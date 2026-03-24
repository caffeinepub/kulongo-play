# Kulongo Play

## Current State
The home page shows three Destaques cards (Afro Hits, Top Vibes, Relax) as visual elements but clicking them does nothing. Songs are already stored with genres (kuduro, rap, gospel) in the backend.

## Requested Changes (Diff)

### Add
- New `PlaylistPage` component at `src/frontend/src/pages/PlaylistPage.tsx`
- Route `/playlist/:mood` in App.tsx
- The page shows songs filtered by mood:
  - `afro-hits` → kuduro genre
  - `top-vibes` → rap genre
  - `relax` → gospel genre
- Header with mood name, cover image, description, and a "Play All" button
- Song list with SongCard (list variant) for each song
- Empty state if no songs for that genre

### Modify
- `HomePage.tsx`: Make each Destaque card a Link to `/playlist/<mood-slug>` (afro-hits, top-vibes, relax)
- `App.tsx`: Add `playlistRoute` with path `/playlist/$mood`

### Remove
- Nothing removed

## Implementation Plan
1. Create `PlaylistPage.tsx` using mood param to determine genre, fetch songs, display in a scrollable list with play-all support
2. Add route to `App.tsx`
3. Wrap Destaque cards in `<Link>` elements pointing to correct `/playlist/<slug>` URLs
