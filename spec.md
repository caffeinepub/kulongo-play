# Kulongo Play - Admin Dashboard Enhancement

## Current State
Admin dashboard at `/adimin/katson/2024` has 3 tabs: Visão Geral (stats), Músicas (list + delete), Artistas (list only). No artist deletion, no artist profile view, no subscription packages, no payment methods.

## Requested Changes (Diff)

### Add
- Artist profile view modal: clicking an artist shows full profile (cover photo, bio, social links, song count, visitor count) in a dialog
- Artist removal: delete button on each artist card with confirmation dialog
- New tab "Pacotes" listing subscription tiers: Free, Bronze, Prata (Silver), Ouro (Gold) with features and price per tier
- New tab "Pagamentos" showing available payment methods: Kwik, Unitel Money, Express — each with logo/icon, description, and status toggle (active/inactive)

### Modify
- Artists tab: add View Profile button (eye icon) and Delete button (trash icon) per artist card
- Tabs bar: add Pacotes and Pagamentos tabs

### Remove
- Nothing removed

## Implementation Plan
1. Add `viewArtistId` state to show artist profile dialog
2. Add `confirmDeleteArtistId` state for artist deletion confirmation
3. Artist profile dialog shows avatar, display name, bio, social links parsed from newline-separated string, song count, truncated principal
4. Artist delete confirmation dialog with mutation calling `actor.adminDeleteArtist(principal)` (mock if backend lacks it — show toast)
5. Add Pacotes tab with 4 plan cards: Free (0 Kz), Bronze (500 Kz/mês), Prata (1500 Kz/mês), Ouro (3000 Kz/mês) — each with feature list and highlight for recommended plan
6. Add Pagamentos tab with 3 payment method cards: Kwik, Unitel Money, Express — each with icon placeholder, description, and an active/inactive badge toggle stored in local state
