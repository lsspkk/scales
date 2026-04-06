---
applyTo: "app/src/**"
---

# GitHub Copilot Code Review Instructions

> **Model:** Reviews should use **GPT-5.2** — configure via VS Code setting `github.copilot.chat.codeReview.model: "gpt-5.2"` (see `.vscode/settings.json`).

This project is a **mobile-first music scale visualiser** built in React 19 + Vite + TypeScript + Tailwind CSS.
Before reviewing any file under `app/src/`, use **CLAUDE.md** (workspace root) as the primary reference — it lists all project docs and the expected folder layout.

---

## 1. React 19 Conventions

- **Function components only** — reject any class component.
- **Named exports only** — `export function Foo`, never `export default`. Flag any default export.
- **One component per file** — file name must match the exported component name (e.g., `Button.tsx` → `export function Button`).
- Prefer `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef` from React 19 hooks. Allow `use()` for context/promise consumption.
- Flag premature memoisation: `useMemo` / `useCallback` without a measurable perf reason is unnecessary noise.
- Do **not** use `useEffect` for synchronous derived state — compute it inline.
- Do **not** use `useEffect` for event subscriptions that standard React event props can handle.

### Canvas / imperative DOM
- `useRef<HTMLCanvasElement>` + `useEffect` for all canvas drawing (see `MusicCanvas.tsx`).
- The `useEffect` dependency array **must** include every store value that affects the rendered output.
- Flag missing dependencies.

### Lazy loading (screens only)
- Every screen in `src/screens/` must be lazy-loaded via `React.lazy()` + `.then(m => ({ default: m.ScreenName }))` in `App.tsx`.
- The `LoadingSpinner` (or equivalent fallback) must **not** itself be lazy.

---

## 2. TypeScript

- **No `any`** — flag all `any` usages and suggest proper types.
- Every component must have an explicit `interface` or `type` for its props.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Enums are discouraged — prefer `'sharp' | 'flat'`-style union types.

---

## 3. Tailwind CSS

- **Tailwind utility classes only** — no inline `style={{}}`, no per-component CSS files. Flag either.
- All colour values must come from the project palette (see **UX palette** below). Flag arbitrary hex values like `bg-[#abc123]` that deviate from palette colours.
- Touch targets: interactive elements must be at least `44×44 px` (`min-h-[44px] min-w-[44px]` or equivalent).
- Do **not** hard-code widths on desktop-only content outside the `max-w-[700px]` content container.

---

## 4. Language Policy

| Context | Language |
|---------|----------|
| Variable names, function names, type names, file names, code comments | **English** |
| User-facing text (button labels, headings, placeholder text, error messages, URLs) | **Finnish** |
| Musical terms | Finnish if a clear translation exists; otherwise the English term (avoid ambiguous translations) |

Flag user-facing strings written in English (outside of `console.*` and code comments).

---

## 5. Zustand Stores

Stores live in `src/stores/` — one file per domain (`musicStore.ts`, `practiceStore.ts`).

- Use Zustand's `persist` middleware for state that must survive page reload.
- `partialize` **must** be used: only plain data (no action functions) should be written to `localStorage`.
- The `name` key in `persist` config must be unique and descriptive.
- In components, always **select only what is needed** from the store:
  ```ts
  const key = useMusicStore((s) => s.key)   // ✅ selector
  const store = useMusicStore()              // ❌ subscribes to all changes
  ```
  Flag whole-store subscriptions.

---

## 6. File & Folder Conventions

```
src/screens/          # Full-page views only — one file per route
src/components/ui/    # Reusable primitives
src/stores/           # Zustand stores
src/lib/              # Pure logic with no React imports
src/hooks/            # Custom React hooks
```

- `src/lib/` files must have **no React imports**. Flag any React usage in `lib/`.
- `src/hooks/` is for custom hooks. They must start with `use` and must be in their own file.
- Do not place business logic directly inside screen components — extract to `lib/` or a custom hook.

---

## 7. UX & Visual Rules

Reference: `docs/ux-spec.md`

**Colour palette (warm parchment theme):**
- Background: `#fffbe9`
- Primary browns: `#5a2d0c`, `#8B4513`
- Accent reds: `#a0563f`, `#8B2500`
- No grey, blue, or cool-tone colours. Flag any deviation.

**Responsive layout:**
- Breakpoint: `769 px` — use the `useViewport()` hook (`src/lib/useViewport.ts`), not raw `window.innerWidth` or CSS media query hacks.
- Hub screens (Home): **no scroll allowed**.
- Content screens (Kirkkosavellajit, Harjoittelu): vertical scroll is acceptable.
- On desktop, content must be constrained inside a `max-w-[700px]` (or similar) container. Tab bars and filters must not span the full viewport width on desktop.

---

## 8. Reusable UI Components

Reference: `docs/ui-components.md`

When a screen needs a header, card, or accordion, use the shared components:

| Need | Component |
|------|-----------|
| Screen header with back button | `ScreenHeader` |
| Navigation card (home hub) | `HomeCard` |
| Collapsible section | `AccordionSection` |

Flag any screen that re-implements these patterns instead of importing the shared component.

---

## 9. Security Checklist

- No `dangerouslySetInnerHTML` without sanitisation.
- No dynamic `eval()` or `Function()` constructor usage.
- No hardcoded credentials, tokens, or API keys.
- External URLs in anchor tags must use `rel="noopener noreferrer"` with `target="_blank"`.

---

## 10. Testing (Vitest)

Reference: `docs/react-instructions.md` (section on testing)

- Test files must be co-located with the module under test or in `src/test/`.
- No `any` in test files either.
- Mocks should be typed; use `vi.mocked()` not raw casts.
- Flag tests that test implementation details (internal state) instead of observable behaviour.
