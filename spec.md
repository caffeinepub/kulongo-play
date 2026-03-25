# Kulongo Play

## Current State
App de streaming musical com registo de artistas/ouvintes, upload de músicas, player, perfis de artistas, playlists por humor, e pesquisa. Sem painel de administração.

## Requested Changes (Diff)

### Add
- Rota `/admin/katson/2024` que acede ao painel de administração sem necessidade de login normal
- Página AdminPage com dashboard de gestão completa
- Backend: função `adminDeleteSong` (admin pode apagar qualquer música), `getAdminStats` (estatísticas da plataforma), `getAllProfiles` (lista todos os artistas)

### Modify
- App.tsx: adicionar rota admin fora do layout principal (sem auth gate)
- Backend main.mo: adicionar funções de admin com verificação de role #admin

### Remove
- Nada

## Implementation Plan
1. Modificar backend para adicionar adminDeleteSong, getAdminStats, getAllProfiles
2. Criar AdminPage.tsx com tabs: Visão Geral (stats), Músicas (lista + apagar), Artistas (lista de perfis)
3. Criar AdminLayout sem auth gate
4. Atualizar App.tsx para registar rota /admin/katson/2024 fora do RootLayout
