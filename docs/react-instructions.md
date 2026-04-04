# React 19 Development Instructions

These rules apply to every task that touches `app/src/`. Read this file before implementing any React work.

---

## 1. General Conventions

- **Function components only** — no class components.
- **TypeScript everywhere** — explicit prop types for every component, no `any`.
- **Tailwind utility classes only** — no inline `style={{}}`, no per-component CSS files.
- **No default exports** — use named exports (`export function Foo`) so imports are refactor-safe.
- **One component per file** — file name matches the exported name (`Button.tsx` exports `Button`).
- **Language policy:**
  - **Code** (variable names, function names, comments, type names, file names) — always in **English**.
  - **User-facing text** (buttons, labels, headings, URLs, error messages, placeholder text) — always in **Finnish**.
  - **Musical terms** — use Finnish when a clear translation exists. If a musical term is ambiguous or has no well-known Finnish equivalent, use the **English** term to avoid confusion.

---

## 2. File Structure

```
src/
  screens/          # Full-page views (one file per route/screen)
  components/
    ui/             # Reusable primitives (Button, MobileShell, etc.)
  stores/           # Zustand stores — one file per domain
  lib/              # Pure logic with no React dependencies (musicScale.ts, etc.)
  hooks/            # Custom React hooks (useDebounce, useLocalStorage shims, etc.)
```

---

## 3. State Management — Zustand

Install: `npm install zustand`

**One store per domain**, placed in `src/stores/`. Keep stores small and focused.

```ts
// src/stores/musicStore.ts
import { create } from 'zustand'

interface MusicState {
  key: string
  mode: string
  accidentalPreference: 'sharp' | 'flat'
  setKey: (key: string) => void
  setMode: (mode: string) => void
  setAccidentalPreference: (pref: 'sharp' | 'flat') => void
}

export const useMusicStore = create<MusicState>((set) => ({
  key: 'C',
  mode: 'ionian',
  accidentalPreference: 'sharp',
  setKey: (key) => set({ key }),
  setMode: (mode) => set({ mode }),
  setAccidentalPreference: (accidentalPreference) => set({ accidentalPreference }),
}))
```

Use in components:

```ts
const key = useMusicStore((s) => s.key)
const setKey = useMusicStore((s) => s.setKey)
```

Always select only what the component needs (avoids unnecessary re-renders).

---

## 4. Local Storage — Zustand `persist` Middleware

Use Zustand's built-in `persist` middleware. No custom wrapper needed.

```ts
// src/stores/musicStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      key: 'C',
      mode: 'ionian',
      accidentalPreference: 'sharp',
      setKey: (key) => set({ key }),
      setMode: (mode) => set({ mode }),
      setAccidentalPreference: (pref) => set({ accidentalPreference: pref }),
    }),
    {
      name: 'music-store',          // localStorage key
      partialize: (s) => ({         // only persist data, not action functions
        key: s.key,
        mode: s.mode,
        accidentalPreference: s.accidentalPreference,
      }),
    }
  )
)
```

Rules:
- Always use `partialize` to persist only plain data, never functions/setters.
- `name` must be unique per store — use a clear descriptive key.
- The store hydrates automatically on first mount; no `useEffect` needed for loading.

---

## 5. Screen Lazy Loading

Each screen must be lazy-loaded to keep the initial bundle small.

In `App.tsx`:

```tsx
import { lazy, Suspense } from 'react'

const Home = lazy(() => import('./screens/Home').then(m => ({ default: m.Home })))
const Kirkkosavellajit = lazy(() => import('./screens/Kirkkosavellajit').then(m => ({ default: m.Kirkkosavellajit })))
const Harjoittelu = lazy(() => import('./screens/Harjoittelu').then(m => ({ default: m.Harjoittelu })))

// Wrap the rendered screen in <Suspense>:
<Suspense fallback={<LoadingSpinner />}>
  {screen === 'home' && <Home navigate={setScreen} />}
  ...
</Suspense>
```

- Each screen file becomes its own Vite chunk automatically.
- `LoadingSpinner` (or equivalent) must be defined before the lazy imports — it cannot itself be lazy.
- The `then(m => ({ default: m.Foo }))` pattern bridges named exports with `React.lazy` (which requires a default export from the dynamic import).

---

## 6. React 19 Specifics

### Do use
- `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef` — standard hooks.
- `use()` hook for reading context or promises inside components (React 19).
- `useTransition` / `startTransition` for non-urgent state updates (e.g., switching screens).

### Avoid
- Wrapping everything in `useMemo`/`useCallback` prematurely — only add when profiling shows a problem.
- `useEffect` for synchronous derived state — compute it inline instead.
- `useEffect` for event subscriptions that can be handled with native React events.

### Canvas / imperative DOM
For the music canvas, use `useRef<HTMLCanvasElement>` + `useEffect` to draw. The effect dependency array must include every store value that affects the canvas output.

---

## 7. Component Props Pattern

```tsx
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'note' | 'mode'
  active?: boolean
}

/** Tappable button for note or mode selection. */
export function Button({ label, onClick, variant = 'note', active = false }: ButtonProps) {
  ...
}
```

- Props interface directly above the component, same file.
- Optional props always have a default value in destructuring.
- JSDoc on the function, not the interface.

---

## 8. Screens Pattern

Each screen receives only navigation callbacks — all persistent state lives in Zustand stores.

```tsx
interface KirkkosavellajitProps {
  onBack: () => void
}

export function Kirkkosavellajit({ onBack }: KirkkosavellajitProps) {
  const key = useMusicStore((s) => s.key)
  const setKey = useMusicStore((s) => s.setKey)
  // ...
}
```

Screens are never imported directly in `App.tsx` — always via `lazy()`.

---

## 9. Testing — Vitest

Install: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom`

Configure in `vite.config.ts`:

```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.ts',
}
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

**What to test:**
- One smoke test per screen — renders without crashing, key text is visible.
- One test per `src/lib/` module — pure logic, no DOM, no mocks needed.

**What not to test:** individual UI components (Button, MobileShell, etc.), Zustand store internals, canvas rendering.

**Screen test example:**

```ts
// src/screens/Home.test.tsx
import { render, screen } from '@testing-library/react'
import { Home } from './Home'

it('renders navigation options', () => {
  render(<Home navigate={vi.fn()} />)
  expect(screen.getByText(/kirkkosävellajit/i)).toBeInTheDocument()
  expect(screen.getByText(/harjoittelu/i)).toBeInTheDocument()
})
```

Run tests with `npx vitest`.
