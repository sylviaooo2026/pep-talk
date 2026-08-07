# Pep Talk v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-first pep talk web app where the user records success cases (`感受 for 事件` + how they overcame them) and browses them in a 3D rolodex, with IndexedDB persistence and JSON export/import.

**Architecture:** Vite + React + TypeScript SPA. UI talks only to a `useCases` hook; persistence goes through a `CaseRepository` interface implemented by `IndexedDbCaseRepository`. Pure helpers (filter, sort, merge-import) are unit-tested with Vitest.

**Tech Stack:** Vite 6, React 19, TypeScript 5, Vitest, `idb` (IndexedDB wrapper), React Router 7 (optional lightweight hash/browser routes), CSS variables (no UI kit), Google Fonts via `@fontsource` or link tags (Fraunces + Source Sans 3).

## Global Constraints

- Product name branding: **pep talk** (lowercase as hero signal on home)
- Case title pattern: **感受 for 事件** (placeholder must teach this)
- Storage v1: browser IndexedDB only; export/import JSON `version: 1`
- Import is **merge** (same `id` overwrite, new `id` append); bad file must not mutate data
- Clear-all requires typing exact confirm word: `清空`
- Sort: `occurredOn` desc, then `updatedAt` desc
- Search: case-insensitive match on `title`, `body`, any `tag`
- Mobile-first; visual direction **晴空纸笺** (soft blue-gray atmosphere, white cards, ink-blue text, sea-blue FAB ~`#2f6f8f`)
- No AI, no auth, no multi-user runtime in v1
- UI must not call IndexedDB directly — only via repository
- Fonts: expressive serif for brand/titles + clear sans for body; **do not** use Inter / Roboto / Arial / system-ui stacks as primary
- Spec reference: `docs/superpowers/specs/2026-08-07-pep-talk-design.md`

---

## File Structure

```
pep-talk/
  index.html
  package.json
  vite.config.ts
  vitest.config.ts
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  public/vite.svg                    # replace or remove later
  src/
    main.tsx
    App.tsx
    styles/
      tokens.css                    # CSS variables, fonts
      global.css                    # reset + atmosphere background
    domain/
      types.ts                      # Case, ExportPayload
      caseLogic.ts                  # filterCases, sortCases, mergeImport
      caseLogic.test.ts
    data/
      CaseRepository.ts             # interface
      indexedDbCaseRepository.ts    # idb implementation
      indexedDbCaseRepository.test.ts  # merge/export paths via logic + thin repo mocks where needed
    hooks/
      useCases.ts
    components/
      SearchBar.tsx
      CaseCard.tsx
      CardWheel.tsx
      EmptyGuideCard.tsx
      CaseForm.tsx
      CaseDetail.tsx
      SettingsPanel.tsx
    pages/
      HomePage.tsx
      EditorPage.tsx
      SettingsPage.tsx
    lib/
      dates.ts                      # todayYmd, isValidYmd
      dates.test.ts
      id.ts                         # createId()
  docs/superpowers/specs/2026-08-07-pep-talk-design.md  # already exists
```

---

### Task 1: Scaffold Vite React TypeScript + Vitest

**Files:**
- Create: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/global.css`, `src/styles/tokens.css`
- Create: `src/vite-env.d.ts`

**Interfaces:**
- Consumes: none
- Produces: runnable `npm run dev` / `npm test` tooling

- [ ] **Step 1: Scaffold the app**

Run from `/Users/fff/cursor/pep-talk` (use current directory; do **not** nest another folder):

```bash
npm create vite@latest . -- --template react-ts
```

If the tool refuses non-empty dir (docs/.gitignore exist), create files manually equivalent to Vite React-TS template, then:

```bash
npm install
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install idb react-router-dom
npm install @fontsource/fraunces @fontsource/source-sans-3
```

- [ ] **Step 2: Configure Vitest in `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 3: Add `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Add scripts to `package.json`**

Ensure:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: Smoke-check**

Run: `npm test`  
Expected: Vitest starts with 0 tests (or passes empty suite) without config errors.

Run: `npm run build`  
Expected: success (default App still fine).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TypeScript app with Vitest"
```

---

### Task 2: Domain types + date/id helpers

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/lib/dates.ts`
- Create: `src/lib/dates.test.ts`
- Create: `src/lib/id.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `Case`, `ExportPayload` types
  - `todayYmd(): string`
  - `isValidYmd(value: string): boolean`
  - `createId(): string`

- [ ] **Step 1: Write failing date tests**

```ts
// src/lib/dates.test.ts
import { describe, expect, it } from 'vitest'
import { isValidYmd } from './dates'

describe('isValidYmd', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(isValidYmd('2026-08-07')).toBe(true)
  })
  it('rejects garbage', () => {
    expect(isValidYmd('08/07/2026')).toBe(false)
    expect(isValidYmd('2026-13-01')).toBe(false)
    expect(isValidYmd('')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/lib/dates.test.ts`  
Expected: FAIL (module/function missing)

- [ ] **Step 3: Implement helpers + types**

```ts
// src/domain/types.ts
export type Case = {
  id: string
  title: string
  body: string
  tags: string[]
  occurredOn: string
  createdAt: string
  updatedAt: string
}

export type ExportPayload = {
  version: 1
  exportedAt: string
  cases: Case[]
}
```

```ts
// src/lib/dates.ts
export function todayYmd(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isValidYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}
```

```ts
// src/lib/id.ts
export function createId(): string {
  return crypto.randomUUID()
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- src/lib/dates.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/lib/dates.ts src/lib/dates.test.ts src/lib/id.ts
git commit -m "feat: add Case types and date/id helpers"
```

---

### Task 3: Pure case logic (filter, sort, merge-import)

**Files:**
- Create: `src/domain/caseLogic.ts`
- Create: `src/domain/caseLogic.test.ts`

**Interfaces:**
- Consumes: `Case`, `ExportPayload` from `src/domain/types.ts`
- Produces:
  - `filterCases(cases: Case[], keyword: string): Case[]`
  - `sortCases(cases: Case[]): Case[]`
  - `parseExportPayload(raw: unknown): ExportPayload` (throws on invalid)
  - `mergeCases(existing: Case[], incoming: Case[]): Case[]`

- [ ] **Step 1: Write failing tests**

```ts
// src/domain/caseLogic.test.ts
import { describe, expect, it } from 'vitest'
import { filterCases, mergeCases, parseExportPayload, sortCases } from './caseLogic'
import type { Case } from './types'

const base = (over: Partial<Case> & Pick<Case, 'id' | 'title'>): Case => ({
  body: 'body',
  tags: [],
  occurredOn: '2026-01-01',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
})

describe('filterCases', () => {
  const cases = [
    base({ id: '1', title: '焦虑 for 演讲', body: '写提纲', tags: ['工作'] }),
    base({ id: '2', title: '尴尬 for 会议', body: '复盘', tags: ['人际'] }),
  ]
  it('matches title/body/tags case-insensitively', () => {
    expect(filterCases(cases, '焦虑').map((c) => c.id)).toEqual(['1'])
    expect(filterCases(cases, '复盘').map((c) => c.id)).toEqual(['2'])
    expect(filterCases(cases, '人际').map((c) => c.id)).toEqual(['2'])
  })
  it('empty keyword returns all', () => {
    expect(filterCases(cases, '   ')).toHaveLength(2)
  })
})

describe('sortCases', () => {
  it('sorts by occurredOn desc then updatedAt desc', () => {
    const cases = [
      base({ id: 'a', title: 'a', occurredOn: '2026-01-01', updatedAt: '2026-01-02T00:00:00.000Z' }),
      base({ id: 'b', title: 'b', occurredOn: '2026-02-01', updatedAt: '2026-01-01T00:00:00.000Z' }),
      base({ id: 'c', title: 'c', occurredOn: '2026-02-01', updatedAt: '2026-03-01T00:00:00.000Z' }),
    ]
    expect(sortCases(cases).map((c) => c.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('mergeCases + parseExportPayload', () => {
  it('overwrites same id and appends new', () => {
    const existing = [base({ id: '1', title: 'old' })]
    const incoming = [base({ id: '1', title: 'new' }), base({ id: '2', title: 'extra' })]
    const merged = mergeCases(existing, incoming)
    expect(merged.find((c) => c.id === '1')?.title).toBe('new')
    expect(merged.map((c) => c.id).sort()).toEqual(['1', '2'])
  })
  it('rejects bad payload', () => {
    expect(() => parseExportPayload({ version: 2, cases: [] })).toThrow()
    expect(() => parseExportPayload(null)).toThrow()
  })
  it('accepts version 1 payload', () => {
    const payload = parseExportPayload({
      version: 1,
      exportedAt: '2026-08-07T00:00:00.000Z',
      cases: [base({ id: '1', title: '焦虑 for 演讲' })],
    })
    expect(payload.cases).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- src/domain/caseLogic.test.ts`  
Expected: FAIL (missing module)

- [ ] **Step 3: Implement `caseLogic.ts`**

```ts
import type { Case, ExportPayload } from './types'

export function filterCases(cases: Case[], keyword: string): Case[] {
  const q = keyword.trim().toLowerCase()
  if (!q) return cases
  return cases.filter((c) => {
    if (c.title.toLowerCase().includes(q)) return true
    if (c.body.toLowerCase().includes(q)) return true
    return c.tags.some((t) => t.toLowerCase().includes(q))
  })
}

export function sortCases(cases: Case[]): Case[] {
  return [...cases].sort((a, b) => {
    if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? 1 : -1
    if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1
    return 0
  })
}

function isCase(value: unknown): value is Case {
  if (!value || typeof value !== 'object') return false
  const c = value as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    typeof c.body === 'string' &&
    Array.isArray(c.tags) &&
    c.tags.every((t) => typeof t === 'string') &&
    typeof c.occurredOn === 'string' &&
    typeof c.createdAt === 'string' &&
    typeof c.updatedAt === 'string'
  )
}

export function parseExportPayload(raw: unknown): ExportPayload {
  if (!raw || typeof raw !== 'object') throw new Error('备份文件无效')
  const obj = raw as Record<string, unknown>
  if (obj.version !== 1) throw new Error('不支持的备份版本')
  if (typeof obj.exportedAt !== 'string') throw new Error('备份文件无效')
  if (!Array.isArray(obj.cases) || !obj.cases.every(isCase)) throw new Error('备份文件无效')
  return { version: 1, exportedAt: obj.exportedAt, cases: obj.cases }
}

export function mergeCases(existing: Case[], incoming: Case[]): Case[] {
  const map = new Map(existing.map((c) => [c.id, c]))
  for (const c of incoming) map.set(c.id, c)
  return [...map.values()]
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- src/domain/caseLogic.test.ts`  
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/caseLogic.ts src/domain/caseLogic.test.ts
git commit -m "feat: add filter, sort, and merge-import case logic"
```

---

### Task 4: CaseRepository interface + IndexedDB implementation

**Files:**
- Create: `src/data/CaseRepository.ts`
- Create: `src/data/indexedDbCaseRepository.ts`
- Create: `src/data/memoryCaseRepository.ts` (test double used by hook tests later)
- Create: `src/data/indexedDbCaseRepository.test.ts`

**Interfaces:**
- Consumes: `Case`, `ExportPayload`, `parseExportPayload`, `mergeCases`, `createId`, `todayYmd`
- Produces:

```ts
export interface CaseRepository {
  list(): Promise<Case[]>
  get(id: string): Promise<Case | undefined>
  create(input: { title: string; body: string; tags: string[]; occurredOn: string }): Promise<Case>
  update(id: string, input: { title: string; body: string; tags: string[]; occurredOn: string }): Promise<Case>
  remove(id: string): Promise<void>
  clearAll(): Promise<void>
  exportAll(): Promise<ExportPayload>
  importMerge(raw: unknown): Promise<Case[]>
}
```

- [ ] **Step 1: Write repository contract tests against memory double + IndexedDB where possible**

Use `fake-indexeddb/auto` for node tests:

```bash
npm install -D fake-indexeddb
```

```ts
// src/data/indexedDbCaseRepository.test.ts
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { IndexedDbCaseRepository } from './indexedDbCaseRepository'

describe('IndexedDbCaseRepository', () => {
  let repo: IndexedDbCaseRepository
  beforeEach(async () => {
    // use unique db name per test to isolate
    repo = new IndexedDbCaseRepository(`pep-talk-test-${crypto.randomUUID()}`)
    await repo.clearAll()
  })

  it('creates and lists cases', async () => {
    await repo.create({
      title: '焦虑 for 演讲',
      body: '写提纲',
      tags: ['工作'],
      occurredOn: '2026-08-07',
    })
    const list = await repo.list()
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('焦虑 for 演讲')
  })

  it('export/import merges by id', async () => {
    const created = await repo.create({
      title: 'old',
      body: 'b',
      tags: [],
      occurredOn: '2026-08-01',
    })
    const payload = {
      version: 1 as const,
      exportedAt: '2026-08-07T00:00:00.000Z',
      cases: [
        { ...created, title: 'new' },
        {
          id: 'other',
          title: '无力 for 延期',
          body: '拆步骤',
          tags: [],
          occurredOn: '2026-08-02',
          createdAt: '2026-08-02T00:00:00.000Z',
          updatedAt: '2026-08-02T00:00:00.000Z',
        },
      ],
    }
    await repo.importMerge(payload)
    const list = await repo.list()
    expect(list).toHaveLength(2)
    expect(list.find((c) => c.id === created.id)?.title).toBe('new')
  })

  it('does not mutate on bad import', async () => {
    await repo.create({ title: 'keep', body: 'b', tags: [], occurredOn: '2026-08-01' })
    await expect(repo.importMerge({ version: 9 })).rejects.toThrow()
    expect(await repo.list()).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- src/data/indexedDbCaseRepository.test.ts`  
Expected: FAIL (missing implementation)

- [ ] **Step 3: Implement interface + IndexedDB + memory repos**

```ts
// src/data/CaseRepository.ts
import type { Case, ExportPayload } from '../domain/types'

export type CaseInput = {
  title: string
  body: string
  tags: string[]
  occurredOn: string
}

export interface CaseRepository {
  list(): Promise<Case[]>
  get(id: string): Promise<Case | undefined>
  create(input: CaseInput): Promise<Case>
  update(id: string, input: CaseInput): Promise<Case>
  remove(id: string): Promise<void>
  clearAll(): Promise<void>
  exportAll(): Promise<ExportPayload>
  importMerge(raw: unknown): Promise<Case[]>
}
```

Implement `IndexedDbCaseRepository` with `idb` openDB:

- DB name default: `pep-talk`
- Store: `cases`, keyPath `id`
- `exportAll`: `{ version: 1, exportedAt: new Date().toISOString(), cases: await list() }`
- `importMerge`: `parseExportPayload` first; on throw, rethrow without writes; on success `mergeCases` then put all

Also implement `MemoryCaseRepository` with an in-memory `Map` for hook/UI tests (same interface).

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- src/data/indexedDbCaseRepository.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data package.json package-lock.json
git commit -m "feat: add CaseRepository with IndexedDB implementation"
```

---

### Task 5: Design tokens + app shell routing

**Files:**
- Modify: `src/styles/tokens.css`, `src/styles/global.css`, `src/main.tsx`, `src/App.tsx`, `index.html`
- Create: `src/pages/HomePage.tsx`, `src/pages/EditorPage.tsx`, `src/pages/SettingsPage.tsx` (stubs OK)

**Interfaces:**
- Consumes: react-router-dom
- Produces: routes `/`, `/new`, `/edit/:id`, `/settings`

- [ ] **Step 1: Add CSS variables (晴空纸笺)**

```css
/* src/styles/tokens.css */
:root {
  --bg0: #d5e3ea;
  --bg1: #edf3f6;
  --bg2: #f7fafb;
  --ink: #1c3340;
  --ink-muted: #5a7382;
  --card: #ffffff;
  --line: #d0dde5;
  --brand: #3d5a6c;
  --accent: #2f6f8f;
  --danger: #b42318;
  --shadow: 0 10px 24px rgba(45, 74, 90, 0.18);
  --font-display: 'Fraunces', 'Iowan Old Style', 'Palatino Linotype', Palatino, serif;
  --font-body: 'Source Sans 3', 'Source Sans Pro', 'Segoe UI', sans-serif;
  --radius-card: 16px;
}
```

Import fonts in `main.tsx`:

```ts
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/700.css'
import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/600.css'
import './styles/tokens.css'
import './styles/global.css'
```

`global.css`: full-viewport gradient atmosphere (`linear-gradient` using `--bg0/1/2`), body font `--font-body`, color `--ink`, no flat single fill.

- [ ] **Step 2: Wire router stubs**

```tsx
// src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { EditorPage } from './pages/EditorPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<EditorPage />} />
        <Route path="/edit/:id" element={<EditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Stub pages return simple headings for now (`pep talk`, `编辑`, `设置`).

- [ ] **Step 3: Manual check**

Run: `npm run dev`  
Expected: open on phone width; soft blue-gray background; routes change without crash.

- [ ] **Step 4: Commit**

```bash
git add src index.html
git commit -m "feat: add daylight theme tokens and app routes"
```

---

### Task 6: `useCases` hook

**Files:**
- Create: `src/hooks/useCases.ts`
- Create: `src/hooks/useCases.test.ts`
- Create: `src/data/repoContext.tsx` (provides repository singleton)

**Interfaces:**
- Consumes: `CaseRepository`, `filterCases`, `sortCases`
- Produces:

```ts
function useCases(): {
  cases: Case[]              // filtered + sorted for UI
  allCount: number
  keyword: string
  setKeyword: (k: string) => void
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: CaseInput) => Promise<Case>
  update: (id: string, input: CaseInput) => Promise<Case>
  remove: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  exportAll: () => Promise<ExportPayload>
  importMerge: (raw: unknown) => Promise<void>
}
```

- [ ] **Step 1: Write failing hook test with MemoryCaseRepository**

```ts
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryCaseRepository } from '../data/memoryCaseRepository'
import { RepoProvider } from '../data/repoContext'
import { useCases } from './useCases'

function wrap(repo: MemoryCaseRepository) {
  return ({ children }: { children: React.ReactNode }) => (
    <RepoProvider repo={repo}>{children}</RepoProvider>
  )
}

describe('useCases', () => {
  it('filters by keyword', async () => {
    const repo = new MemoryCaseRepository([
      {
        id: '1',
        title: '焦虑 for 演讲',
        body: '提纲',
        tags: [],
        occurredOn: '2026-08-07',
        createdAt: '2026-08-07T00:00:00.000Z',
        updatedAt: '2026-08-07T00:00:00.000Z',
      },
      {
        id: '2',
        title: '尴尬 for 会议',
        body: '复盘',
        tags: [],
        occurredOn: '2026-08-06',
        createdAt: '2026-08-06T00:00:00.000Z',
        updatedAt: '2026-08-06T00:00:00.000Z',
      },
    ])
    const { result } = renderHook(() => useCases(), { wrapper: wrap(repo) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cases).toHaveLength(2)
    act(() => result.current.setKeyword('焦虑'))
    expect(result.current.cases.map((c) => c.id)).toEqual(['1'])
  })
})
```

- [ ] **Step 2: Run — FAIL, then implement `RepoProvider` + `useCases`**

`RepoProvider` default = `new IndexedDbCaseRepository()` for production.

`useCases`: load on mount; keep `all` in state; derive `cases = sortCases(filterCases(all, keyword))`.

- [ ] **Step 3: Run — PASS**

Run: `npm test -- src/hooks/useCases.test.ts`  
Expected: PASS

- [ ] **Step 4: Wrap App with RepoProvider in `main.tsx`**

- [ ] **Step 5: Commit**

```bash
git add src/hooks src/data/repoContext.tsx src/data/memoryCaseRepository.ts src/main.tsx
git commit -m "feat: add useCases hook and repository provider"
```

---

### Task 7: CaseForm + EditorPage (create/edit/delete)

**Files:**
- Create: `src/components/CaseForm.tsx`
- Modify: `src/pages/EditorPage.tsx`

**Interfaces:**
- Consumes: `useCases`, `isValidYmd`, `todayYmd`
- Produces: working `/new` and `/edit/:id`

- [ ] **Step 1: Build `CaseForm`**

Props:

```ts
type CaseFormProps = {
  initial?: { title: string; body: string; tags: string[]; occurredOn: string }
  submitLabel: string
  onSubmit: (input: CaseInput) => Promise<void>
  onDelete?: () => Promise<void>
}
```

UI fields:
- title input, placeholder `焦虑 for 明天演讲`
- body textarea, placeholder `我当时是怎么一步步走出来的…`
- tags: comma or chip input → `string[]` (trim, drop empties)
- date: `<input type="date">` default `todayYmd()`
- validate: title/body required; date via `isValidYmd`; show inline errors in Chinese

- [ ] **Step 2: Wire `EditorPage`**

- `/new`: empty form → `create` → navigate `/`
- `/edit/:id`: load via repo/`useCases`, populate form → `update` → `/`
- Show delete button only when editing; `window.confirm('确定删除这条成功案例？')` then `remove`

- [ ] **Step 3: Manual test**

Create a case, refresh page, case still listed (after Task 8 home list; until then verify via temporary debug list or Settings count later). For this task: after save, `await repo.list()` in console or temporary `<pre>` on Home is OK — remove debug UI in Task 8.

Minimum for this task: create + edit + delete without console errors; data survives refresh (check Application → IndexedDB).

- [ ] **Step 4: Commit**

```bash
git add src/components/CaseForm.tsx src/pages/EditorPage.tsx
git commit -m "feat: add case editor with validation and delete confirm"
```

---

### Task 8: CardWheel + CaseCard + HomePage

**Files:**
- Create: `src/components/CaseCard.tsx`
- Create: `src/components/CardWheel.tsx`
- Create: `src/components/EmptyGuideCard.tsx`
- Create: `src/components/SearchBar.tsx`
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: `useCases().cases`, router navigate
- Produces: 3D rolodex home experience

- [ ] **Step 1: Implement `CaseCard`**

Show `title`, truncated `body` (≈3 lines), tags chips, optional `occurredOn`.

- [ ] **Step 2: Implement `CardWheel`**

Requirements from spec:
- Vertical snap scroll OR scroll-driven transform of a fixed stack
- Center card face-on; neighbors `rotateX(±50deg)`-ish with perspective
- Track active index via IntersectionObserver or scroll position
- Tap center card → open detail (`onSelect(case)`)
- CSS: `perspective` on container; avoid heavy dependencies

Recommended approach:
- Outer scroll container `height: 100dvh`, `scroll-snap-type: y mandatory`
- Each slide full viewport height, centers a card
- Non-active cards get reduced opacity + rotate via data-active class updated on scroll

- [ ] **Step 3: `EmptyGuideCard`**

When `allCount === 0` and no keyword: show centered card copy `写下第一个成功 — 感受 for 事件` and button → `/new`.

When keyword active and `cases.length === 0`: show `换个词，或先记下来`.

- [ ] **Step 4: `SearchBar` + Home chrome**

- Top: brand **pep talk** (display font, large enough to read as hero), gear → `/settings`, search expand
- FAB `+` fixed bottom-right, `--accent`, → `/new`
- Pass filtered `cases` into `CardWheel`

- [ ] **Step 5: Manual mobile check**

Chrome device mode 390×844: create 3 sample cases, verify snap + 3D tilt feel; search filters wheel.

- [ ] **Step 6: Commit**

```bash
git add src/components src/pages/HomePage.tsx
git commit -m "feat: add 3D rolodex home with search and empty states"
```

---

### Task 9: Case detail overlay

**Files:**
- Create: `src/components/CaseDetail.tsx`
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: selected `Case`
- Produces: full-screen overlay; back/dismiss; Edit → `/edit/:id`

- [ ] **Step 1: Implement overlay**

- Full viewport, white/near-white panel over dimmed atmosphere
- Show full title, date, tags, body
- Buttons: 关闭, 编辑
- Fade-in animation (~200ms opacity)

- [ ] **Step 2: Wire from CardWheel `onSelect`**

- [ ] **Step 3: Manual check** — open/close/edit path works

- [ ] **Step 4: Commit**

```bash
git add src/components/CaseDetail.tsx src/pages/HomePage.tsx
git commit -m "feat: add case detail overlay with fade-in"
```

---

### Task 10: Settings — export / import / clear / count

**Files:**
- Create: `src/components/SettingsPanel.tsx`
- Modify: `src/pages/SettingsPage.tsx`

**Interfaces:**
- Consumes: `useCases` export/import/clear/allCount
- Produces: backup UX per spec

- [ ] **Step 1: Implement export**

```ts
const payload = await exportAll()
const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `pep-talk-backup-${todayYmd()}.json`
a.click()
URL.revokeObjectURL(url)
```

- [ ] **Step 2: Implement import**

`<input type="file" accept="application/json,.json">` → `JSON.parse` → `importMerge` → alert success or show error message from thrown Error; on failure library unchanged.

- [ ] **Step 3: Clear all**

Input must equal `清空` before enabling destructive button; then `clearAll()` and navigate home.

- [ ] **Step 4: Copy**

Short product blurb: 记录你的成功案例。下一次那种感觉来时，它们会告诉你：你曾经成功过。

Show `案例总数：N`.

- [ ] **Step 5: Manual round-trip**

Export → clear → import → cases restored.

- [ ] **Step 6: Commit**

```bash
git add src/components/SettingsPanel.tsx src/pages/SettingsPage.tsx
git commit -m "feat: add settings export, merge-import, and clear-all"
```

---

### Task 11: Motion polish + PWA lite

**Files:**
- Modify: `src/components/CardWheel.tsx`, `src/styles/global.css`
- Create: `public/manifest.webmanifest`, `public/icon-192.png` (simple solid/glyph), `public/icon-512.png`
- Modify: `index.html` (manifest link, theme-color `#d5e3ea`)

**Interfaces:**
- Consumes: existing UI
- Produces: ≥2–3 intentional motions; installable metadata

- [ ] **Step 1: Motions**

1. Wheel active card transition: `transform` + `opacity` 220ms ease
2. After create: Home focuses newest case (scrollIntoView on matching id)
3. Detail overlay fade already from Task 9 — ensure present

- [ ] **Step 2: Manifest**

```json
{
  "name": "pep talk",
  "short_name": "pep talk",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#edf3f6",
  "theme_color": "#d5e3ea",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Service worker optional — **skip** for v1 (YAGNI); manifest + icons enough for “PWA-ready”.

- [ ] **Step 3: Commit**

```bash
git add src public index.html
git commit -m "feat: polish rolodex motion and add web app manifest"
```

---

### Task 12: Final verification

**Files:** none required (fixes only if bugs found)

- [ ] **Step 1: Run automated suite**

```bash
npm test
npm run build
```

Expected: all tests pass; production build succeeds.

- [ ] **Step 2: Manual checklist (phone or device mode)**

1. Empty state CTA works  
2. Create case with title pattern placeholder clarity  
3. Rolodex 3D browse with 3+ cards  
4. Search filters; empty-search message works  
5. Detail → edit → save  
6. Delete with confirm  
7. Export / import merge / clear with `清空`  
8. Refresh persistence  
9. Brand **pep talk** reads as hero on first viewport  

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address final verification issues"
```

(Skip empty commit if nothing to fix.)

---

## Spec Coverage Checklist

| Spec requirement | Task |
|------------------|------|
| Record cases (title/body/tags/date) | 7 |
| 3D rolodex browse | 8 |
| Keyword filter | 3, 6, 8 |
| IndexedDB + repository seam | 4, 6 |
| Export / merge-import | 3, 4, 10 |
| Clear with `清空` | 10 |
| Sort order | 3, 6 |
| Daylight visual + brand hero | 5, 8 |
| Motions ≥2–3 | 9, 11 |
| Empty / no-hit states | 8 |
| Detail overlay | 9 |
| Delete confirm | 7 |
| PWA-ready | 11 |
| No AI/auth | all (omitted) |
| Unit tests filter/merge | 3, 4 |

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-07-pep-talk-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with executing-plans checkpoints  

Which approach?
