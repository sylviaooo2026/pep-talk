# Pep Talk — Design Spec

**Date:** 2026-08-07  
**Status:** Approved for planning  
**Product:** pep talk — personal success case library

## Goal

Help the user build a private library of moments they overcame. Each case is titled as **feeling for event**, with notes on how they got through it. Later, when the same feeling or situation returns, flipping through their own cards reminds them: they’ve succeeded before.

v1 focuses on **recording and browsing**. AI recommendation is out of scope.

## Scope

### In scope (v1)

- Create / edit / delete personal success cases
- Mobile-first vertical **3D rolodex** card wheel
- Optional tags + occurred-on date
- Keyword filter over title, body, tags
- Local persistence (IndexedDB) with JSON export / merge-import
- PWA-ready packaging (add to home screen preferred; at minimum excellent mobile browser UX)
- Visual direction: **Daylight paper** (晴空纸笺)

### Out of scope (v1)

- AI / LLM recommendations
- Accounts, sync, multi-user runtime
- Sharing cases socially
- Desktop-first layouts (desktop should work, but mobile is the design target)

### Deferred (structure only)

- Swap `CaseRepository` to an API implementation for cloud sync / multi-user
- Soft “ownerId” awareness in the data layer later; UI stays single-user local

## Users

Primary: the product owner using the app alone on a phone.  
Secondary (later): friends/family each with their own library — not built in v1.

## Architecture

**Stack:** Vite + React + TypeScript

**Layers:**

1. **UI** — pages and components (no direct IndexedDB calls)
2. **Hooks / app state** — `useCases` (or equivalent) orchestrates load, filter, CRUD
3. **CaseRepository interface** — `list`, `get`, `create`, `update`, `remove`, `exportAll`, `importMerge`
4. **IndexedDbCaseRepository** — v1 implementation

Future cloud/auth replaces only the repository implementation.

```
┌─────────────────────────────────────┐
│  CardWheel / CaseForm / Settings    │
├─────────────────────────────────────┤
│  useCases (filter + CRUD orchestration) │
├─────────────────────────────────────┤
│  CaseRepository (interface)         │
├─────────────────────────────────────┤
│  IndexedDbCaseRepository (v1)       │
└─────────────────────────────────────┘
```

## Primary flows

1. **Record** — tap `+` → fill title (`feeling for event`), body (how they overcame), optional tags → save → card appears in the wheel
2. **Browse** — home screen is the 3D rolodex; scroll snaps between cards; tap open for full detail
3. **Find** — keyword filter narrows the wheel to matching cases
4. **Backup** — Settings → export JSON; import merges by `id`

## Pages & components

### Pages / surfaces

| Surface | Purpose |
|---------|---------|
| **Wheel (home)** | Brand, search, rolodex, FAB `+` |
| **Editor** | Create / edit case; delete with confirm when editing |
| **Settings** | Export, import, count, product blurb, clear-all with typed confirm |
| **Detail** | Full-screen overlay opened from the center card (back dismisses) |
| **Nav** | Settings via a small gear in the home top bar (does not compete with brand) |

### Components

- `CardWheel` — 3D vertical rolodex (`rotateX` neighbors, center card face-on)
- `CaseCard` — title, truncated body, tags chips
- `CaseForm` — title, body, tags, date
- `SearchBar` — expand/collapse keyword input
- `SettingsPanel` — backup actions
- `EmptyGuideCard` — first-case CTA when library is empty

## Data model

```ts
type Case = {
  id: string          // UUID
  title: string       // "感受 for 事件"
  body: string        // how they overcame it
  tags: string[]      // optional, may be empty
  occurredOn: string  // YYYY-MM-DD, defaults to today
  createdAt: string   // ISO-8601
  updatedAt: string   // ISO-8601
}
```

### Export file

```json
{
  "version": 1,
  "exportedAt": "<ISO-8601>",
  "cases": []
}
```

### Import (merge)

- Same `id` → overwrite with imported record
- New `id` → append
- Invalid / unreadable file → show error; **do not** mutate the library
- No “replace entire DB” as the default import path

### Clear all

Available in Settings only; requires typing the exact confirm word `清空` before wiping IndexedDB cases.

### Sort order

Wheel shows cases sorted by `occurredOn` descending, then `updatedAt` descending as tiebreaker.

### Search

Client-side: case matches if keyword appears in `title`, `body`, or any `tag` (case-insensitive). Wheel renders filtered list only. Empty keyword = show all.

### Validation

- `title` and `body` required (non-empty after trim)
- `occurredOn` must be a valid date string
- `tags` optional

## UI / visual design

### Interaction — 3D rolodex (approved)

- One focused center card, face-on
- Above/below cards tilted with `rotateX` perspective
- Snap scroll; tap center card to open full content
- FAB `+` bottom-right for new case

### Visual direction — Daylight paper / 晴空纸笺 (approved)

- Soft blue-gray atmospheric background (gradient / subtle depth, not flat fill)
- White cards, ink-blue typography
- Brand **pep talk** as a hero-level signal on the first viewport (not nav-only)
- FAB in sea-blue (`~#2f6f8f` range; finalize in CSS variables)
- Expressive serif for brand/titles; clear sans for body (not Inter / Roboto / Arial / system default stacks)
- Avoid: purple gradients, cream+terracotta cliché, broadsheet newspaper chrome, neon glows

### Motion (ship ≥2–3)

1. Rolodex snap with light spring follow
2. Save → subtle card enter into wheel
3. Detail open fade / soft expand

### Empty & edge UI

- Empty library: centered guide card — “写下第一个成功 — 感受 for 事件”
- No search hits: short message to try another word or record a new case

## Error handling

| Situation | Behavior |
|-----------|----------|
| IndexedDB unavailable | Show blocking message; disable write actions |
| Save validation fail | Inline field errors; do not persist |
| Import parse fail | Toast / alert; library unchanged |
| Delete | Confirm dialog before remove |
| Clear all | Typed confirmation required |

## Testing (lightweight v1)

- Unit: merge-import logic (new id, overwrite id, bad JSON)
- Unit: keyword filter matching
- Manual: mobile Safari/Chrome — scroll snap, create/edit/delete, export/import round-trip

## Success criteria

1. User can add a case in under a minute with the “feeling for event” pattern obvious from placeholder copy
2. On a phone, browsing feels like flipping a rolodex of personal cards
3. Export → clear (or new browser) → import restores cases without data loss for valid backups
4. Code leaves a clean seam for a future API-backed repository

## Non-goals reminder

Do not build AI recommendation, auth, or shared feeds in this iteration.
