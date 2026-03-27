# Kulongo Play

## Current State
O admin dashboard lê dados de utilizadores (artistas e ouvintes) a partir do `localStorage` do browser local. Isso significa que o admin apenas vê utilizadores registados no seu próprio browser, nunca todos os utilizadores da plataforma. Os dados de músicas já estão no backend (canister) e funcionam.

## Requested Changes (Diff)

### Add
- Backend: tipo `PlatformUserRecord` com campos `emailHash`, `role`, `displayName`, `banned`, `registeredAt`
- Backend: `Map` `platformUsers` para guardar todos os registos
- Backend: `registerPlatformUser(emailHash, role, displayName)` - chamado no registo
- Backend: `getAllPlatformUsers()` - chamado pelo admin para ver todos
- Backend: `banPlatformUser(emailHash, banned)` - admin ban/unban
- Backend: `deletePlatformUser(emailHash)` - admin remove

### Modify
- AuthPage: ao registar um novo utilizador, chamar `actor.registerPlatformUser(...)` para sincronizar com o backend
- AdminPage: aba "Ouvintes" lê de `getAllPlatformUsers()` do backend (não localStorage)
- AdminPage: estatísticas de ouvintes e artistas leem do backend
- AdminPage: ban/unban e remoção de utilizadores operam via backend

### Remove
- AdminPage: dependência de `storedUsers` (localStorage) para contagens de stats e gestão de utilizadores

## Implementation Plan
1. Adicionar tipos e funções ao `main.mo`
2. Atualizar `AuthPage.tsx` para chamar o backend ao registar
3. Atualizar `AdminPage.tsx` para ler utilizadores do backend
