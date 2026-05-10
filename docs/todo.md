# Todo

## Task 1: Scaffold React 19 + TypeScript + Tailwind project

**Status:** done

Set up a new React 19 application using **Vite + SWC** as the build toolchain (SWC is 20-70x faster than Babel; `@vitejs/plugin-react-swc` replaces the default Babel plugin). Use TypeScript and Tailwind CSS v4.

Requirements:
- Init with `npm create vite@latest -- --template react-swc-ts` or equivalent
- Install and configure Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- Application is **mobile-first and mobile-only**: on desktop it must render as a centered mobile viewport (max-width ~390px, full viewport height)
- Add a simple **Home screen** that lets the user choose between two modes:
  - **Kirkkosävellajit** — the current scale visualizer (moved here from `index.html`)
  - **Harjoittelu** — a placeholder section to be designed later
- Wire up React Router (or simple state-based routing) for navigation between Home, Kirkkosävellajit, and Harjoittelu
- Preserve all existing music theory logic from `script.js` (port to TypeScript module)

Toolchain summary:
- Runtime: Node.js (or Bun as package manager for speed)
- Bundler: Vite
- Transpiler: SWC (`@vitejs/plugin-react-swc`)
- Styling: Tailwind CSS v4
- Language: TypeScript 5.x
- Framework: React 19

---

## Task 2: Build a shared component library with Tailwind

**Status:** done
**Blocked by:** Task 1

Create a set of reusable UI components that are visually unique to this application (medieval/parchment aesthetic, warm browns and reds). Place them in `src/components/ui/`.

Components to build (minimum):
- `Button` — note selector and mode selector variants (brown / red tones)
- `MobileShell` — the centered mobile wrapper shown on all screens
- `ScreenHeader` — app bar with back button, title, optional subtitle
- `SectionCard` — card container for grouping controls
- `ModeChip` — small labeled chip showing a mode name with optional alteration badge
- `HomeCard` — large tap-target card used on the Home screen to pick a mode (Kirkkosävellajit / Harjoittelu)

Each component must:
- Be written in TypeScript with explicit prop types
- Use only Tailwind utility classes (no inline styles, no separate CSS files per component)
- Include a brief JSDoc comment describing its purpose

---

## Task 3: Migrate application logic into React 19 components

**Status:** done
**Blocked by:** Task 1, Task 2

Port the current `script.js` / `events.js` / `index.html` functionality into the React component tree.

Requirements:
- `MusicScale` class logic → TypeScript module `src/lib/musicScale.ts` (pure functions, no DOM)
- Canvas rendering stays on an HTML5 `<canvas>` element, managed via `useRef` + `useEffect`
- State managed with React 19 hooks (`useState`, `useEffect`, `useCallback`)
- Kirkkosävellajit screen (`src/screens/Kirkkosavellajit.tsx`) — full scale visualizer
- Harjoittelu screen (`src/screens/Harjoittelu.tsx`) — placeholder with coming-soon message
- Home screen (`src/screens/Home.tsx`) — two `HomeCard` components for navigation
- All UI controls (key buttons, mode buttons, prev/next arrows, selection summary) use components from Task 2
- Responsive behavior: desktop shows the app inside `MobileShell` (centered, ~390px wide)
- Remove `script.js`, `events.js`, and original `index.html` after migration (keep `index.html` as Vite entry)

---

## Task 4: Update CI/CD to build and deploy the React app to Azure

**Status:** done
**Blocked by:** Task 3

Build is done **locally** before committing. CI only deploys — it never runs `npm install` or `npm run build`.

Requirements:

1. **Build output folder** — configure `vite.config.ts` to output the build to `dist/` at the repo root (not inside `app/`). This folder is committed to git and is what gets deployed.
2. **Build script** — add an npm script (e.g., `"deploy:build"`) in `app/package.json` that runs `npm run build` and places output in `../dist/`. Developer runs this locally before pushing.
3. **Workflow** — update `.github/workflows/deploy-to-azure.yml` to remove all build steps and simply upload the `dist/` folder to the Azure Storage `$web` container using `az storage blob upload-batch --source dist`. Handle MIME types per extension (`.html`, `.css`, `.js`, and assets).
4. **Secrets** — reuse existing `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY`; no new secrets needed.
5. **Docs** — create `docs/deployment.md` documenting the local build step, the `dist/` folder convention, and how the workflow deploys it. Add a reference to it in `CLAUDE.md`.

---

## Task 5: Redesign Home screen cards

**Status:** done
**Blocked by:** Task 3

The Home screen navigation cards look like placeholders — dashed borders, tiny icons, and flat appearance. Redesign them into polished, inviting hub cards.

Requirements:

1. **Icons** — large SVG icons centered in each card:
   - **Kirkkosävellajit** (Sävellajit / basic knowledge): a book with a music note — conveys learning/theory
   - **Harjoittelu** (practice): a violin icon — conveys playing/practice
   - Icons should be ~64–80px, prominent, and be the visual anchor of each card
2. **Layout** — cards should fill available space comfortably (no `max-h-40` cap). Two cards in a vertical stack with generous padding. Must scale to 3–4 cards in the future without redesign.
3. **Visual polish** — replace dashed borders with solid styling. Use subtle gradients or layered shadows to give depth. Warm parchment palette (browns/reds) stays, but cards should feel solid and tappable, not wireframe-like.
4. **Typography** — card label below or beside the icon, clear hierarchy. Optional one-line subtitle describing the section (e.g., "Kirkkosävellajien perusteet", "Harjoittele soittamista").
5. **Tap feedback** — visible active/pressed state (scale transform or color shift) so taps feel responsive.
6. **Consistency** — update `HomeCard` component in `src/components/ui/HomeCard.tsx`; the Home screen should only compose, not override styles.

---

## Task 6: Fix ScreenHeader back navigation

**Status:** done
**Blocked by:** Task 3

The current `ScreenHeader` uses a raw `←` text character as the back button, which looks ugly and amateurish. Redesign the header bar to follow standard mobile UX conventions.

Requirements:

1. **Back icon** — replace the `←` text with a proper left-chevron SVG icon (`‹` style, not an arrow). The chevron-left is the industry standard (iOS, Android, most web apps). Keep it clean, thin stroke, white on the colored header background.
2. **Touch target** — the back button must be at least 44×44px tap area per Apple/Android accessibility guidelines. Use padding to enlarge the hit area without making the icon itself oversized.
3. **Placement** — top-left corner, which is the conventional location users instinctively look for back navigation (F-pattern reading).
4. **Screen title** — keep the title descriptive of the current screen content (e.g., "Kirkkosävellajit", "Harjoittelu"), not generic labels like "Home". The title should be next to the back chevron, left-aligned (Android convention fits this app better than iOS centered titles).
5. **Hub screen naming** — the root screen (currently called "Home" internally) should not show a header bar at all since it is the top-level hub. The app name/branding in the hub title area is sufficient. The `screen` type `'home'` in the store is fine as an internal name.
6. **Visual consistency** — the header should feel like a proper app bar: consistent height (~48–56px), proper vertical centering, and the colored background (brown for Kirkkosävellajit, red for Harjoittelu) should remain.
7. **Update `ScreenHeader`** in `src/components/ui/ScreenHeader.tsx` — the fix lives in the component, not in individual screens.

---

## Task 7: Fix canvas layout for mobile portrait mode

**Status:** done
**Blocked by:** Task 3

The scale canvas wastes too much horizontal space on mobile portrait. The staves have large empty margins on left and right, and the last note ends far from the end of the stave. The treble clef (G clef) is also too small and positioned too low.

Requirements:

1. **Reduce left/right margins** — the staff lines currently start at x=80 and end at `canvas.width - 30`. Shrink these so there is only ~5px of empty space on each side of the canvas viewport in mobile portrait. Adjust `startX` and `endX` in `drawStaff()` accordingly.
2. **Last note closer to stave end** — currently the 8th note (octave) leaves a large gap before the end of the stave. Reduce this gap to roughly 25% of the current empty space after the last note. Adjust note `startX` and/or `noteSpacing` in `renderScale()` so notes spread closer to the stave end while keeping even spacing.
3. **Treble clef (G clef) fix** — make the clef ~20% taller (increase font size from 105px to ~126px) and shift it ~10px upward. Apply to both upper and lower staff clefs in `drawTrebleClef()`. The clef x-position should also adjust to stay visually aligned with the new staff left margin.
4. **Keep inter-note spacing even** — the spacing between notes should remain uniform; only the overall start position and spacing value change to fill the available width better.
5. **All changes** are in the canvas drawing functions inside `src/screens/Kirkkosavellajit.tsx` (the `drawStaff`, `drawTrebleClef`, and `renderScale` helpers).

---

## Task 8: Add desktop view mode alongside mobile view

**Status:** done
**Blocked by:** Task 7

The original app (see `main` branch `CLAUDE.md`) had two distinct layouts separated at 768px. The React rewrite currently renders exclusively as a centered ~390px mobile shell on all screen sizes. Restore the desktop layout as a first-class experience.

### Desktop layout (viewport > 768px)

- **No `MobileShell` wrapper** — the app fills the full browser width and height.
- **`selectionMenuDesktop`** — all key buttons and mode buttons are always visible in a sidebar or top panel (never hidden behind a toggle).
- **Inline mode explanation** — the mode alteration text / selection summary renders next to the controls, not below the canvas.
- **Canvas** — renders at a larger fixed size appropriate for desktop (the original used 1000×500px). Do not apply the 110%-width / negative-margin mobile trick.
- The `ScreenHeader` back button remains; the header can be wider/full-width.

### Mobile layout (viewport ≤ 768px)

- Keeps the current behavior: `MobileShell` centered ~390px, dropdown menu toggle, prev/next arrow buttons for quick navigation, larger accidental symbols on the canvas.
- Canvas: 110% width with negative left margin to trim edges (already implemented).

### Implementation requirements

1. **Viewport detection** — use a single `useMediaQuery` hook (or `window.matchMedia`) that returns `isDesktop: boolean` (true when `min-width: 769px`). Place the hook in `src/lib/useViewport.ts`.
2. **Kirkkosavellajit screen** — branch the JSX on `isDesktop`:
   - Desktop: render a two-column layout (controls left, canvas right) or controls-above-canvas layout with all buttons visible.
   - Mobile: existing layout unchanged.
3. **Canvas dimensions** — pass canvas width/height as props or derive from `isDesktop`. Desktop: 1000×500. Mobile: current dimensions (computed from container width).
4. **Accidental font sizes** — desktop can use the standard sizes; mobile keeps the current larger sizes.
5. **Home screen** — the home screen hub (`src/screens/Home.tsx`) should also drop `MobileShell` on desktop and fill the viewport, centering the two `HomeCard`s in a wider layout (e.g. side-by-side row instead of vertical stack).
6. **Harjoittelu screen** — same pattern: no `MobileShell` on desktop, full-width placeholder.
7. **Do not break mobile** — all existing mobile behaviour (dropdown toggle, arrows, touch targets ≥44px) must still work.

### Files to change

- `src/lib/useViewport.ts` — new file, viewport hook
- `src/screens/Kirkkosavellajit.tsx` — branch layout on `isDesktop`
- `src/screens/Home.tsx` — desktop layout for hub
- `src/screens/Harjoittelu.tsx` — desktop layout for placeholder
- `src/components/ui/MobileShell.tsx` — keep as-is; just stop rendering it on desktop paths

---

## Task 9: Research violin scale practice methodology

**Status:** done
**Blocked by:** —

Research well-established violin pedagogy for adult learners (~3 years of practice) to determine a structured scale practice routine. The research should cover:

1. **Key progression method** — find a pedagogically sound order for practising scales (not simply adding sharps/flats one at a time). Prefer a method from a recognised violin school or method book (e.g., Suzuki, Galamian, Flesch, Sassmannshaus, or similar). The goal is a sensible sequence that builds technique progressively, not an exhaustive list of all 24 keys.
2. **Position work** — scales should cover 1st through 3rd position. Include guidance on when and how to introduce shifts (1st→2nd, 1st→3rd, 2nd→3rd).
3. **Shift practice** — specific exercises or patterns for practising shifts within scales (e.g., shift on which finger, preparatory slides, intonation checks).
4. **Chords / arpeggios** — whether to practise arpeggios or broken chords in the same key alongside the scale, and if so, which patterns.
5. **Sources** — document which method books, pedagogy sources, or online references the recommendations come from. Include author, title, and edition/year where possible.

**Deliverable:** a technical document `docs/scale-practice-method.md` that serves as both the content source for Task 10 (Finnish UI text) and the data source for Task 11 (practice routine logic). The document must include structured data: skill levels, scale lists per level, position requirements, shift patterns, and arpeggio patterns — written clearly enough that a developer can translate it directly into a TypeScript data file.

**Post-delivery:** add `docs/scale-practice-method.md` to the **Reference Docs** table in `CLAUDE.md` so it is easy to find in future conversations (e.g., `| docs/scale-practice-method.md | Violin scale practice method: skill levels, key progression, shifts, arpeggios — data source for Harjoittelu |`).

---

## Task 10: Build Harjoittelu practice guide page

**Status:** done
**Blocked by:** Task 9

Present the content from `docs/scale-practice-method.md` (Task 9) as a visually polished, readable info page on the Harjoittelu screen, written in **Finnish**. This is a read-only reference page — no interactive practice logic (that's Task 11).

### Content requirements

- Take all content from `docs/scale-practice-method.md` and present it in Finnish
- Practice method overview: which violin school / method the key sequence is based on, and why
- Ordered list of scales to practise, grouped by skill level and position
- Shift exercises and tips for each position transition
- Arpeggio / chord practice guidance per key
- Sources section listing the method books and references used

### UX / UI requirements

1. **Mobile (≤ 768px)** — content renders inside the existing mobile shell, scrollable, with clear section headings, collapsible/expandable sections (accordion) so the user is not overwhelmed by a wall of text. Typography must be comfortable to read on a phone (≥16px body text, generous line height).
2. **Desktop (> 768px)** — wider reading layout (max-width ~700px, centered), same content, sections can default to expanded. Optional sticky table-of-contents sidebar if content is long enough to warrant it.
3. **Visual style** — consistent with the app's parchment/brown/red palette. Use existing UI components (`SectionCard`, etc.) where appropriate.
4. **Navigation** — the ScreenHeader with back button remains at the top. The Harjoittelu screen will later (Task 11) have two sub-views (info page + practice routine), but for now this task only builds the info page.

### Files to change

- `app/src/screens/Harjoittelu.tsx` — main implementation
- Possibly new sub-components in `app/src/components/` if the page is complex enough to warrant splitting

---

## Task 11: Build interactive scale practice routine (draft version)

**Status:** done
**Blocked by:** Task 9, Task 10

Build the interactive practice routine on the Harjoittelu screen. This is the core "app" part — it generates a randomised practice set from the method defined in Task 9, tracks progress with local storage, and lets the user work through scales one by one.

### Practice method data

- Encode the scale practice method from `docs/scale-practice-method.md` into a well-structured TypeScript file `app/src/lib/practiceMethod.ts` (or a JSON file imported by it).
- The file must have **clear comments** explaining how the method works, what each skill level contains, and how to customise it (add/remove scales, adjust levels).
- Structure: skill levels → each level has a list of scales (key + scale type + position + any shift patterns + optional arpeggio).
- This is the single source of truth for what scales exist in the practice system.

### Randomisation and practice sets

- When the user starts a new practice session, the app generates a **practice set**: a randomised ordering of all scales for the selected skill level(s).
- The user selects which skill level(s) to include before rolling.
- The randomised list is stored in **local storage** (Zustand with persist, consistent with existing patterns).
- The list is displayed as a scrollable checklist.

### Progress tracking

- Each scale in the list has a simple **done** state — the user taps/clicks it to mark it as practised.
- Progress (which scales are done) persists in local storage so the user can close the app and resume later.
- A progress indicator (e.g., "7 / 24 harjoiteltu") is visible at the top.

### Completion flow

- When all scales in the set are marked done, show a simple **congratulations screen** (nothing fancy — a message and maybe a small visual flourish).
- Two options after completion:
  1. **Sama järjestys** — repeat the same practice set in the same order (reset all done-marks).
  2. **Arvo uusi järjestys** — roll a new randomised order for the same skill level selection.
- Optionally: allow changing skill level selection and rolling a new set.

### No note display (yet)

- This task does **not** render any musical notation or canvas. The practice list is text-based (scale name, key, position info).
- A future task will add the ability to tap a scale and navigate to the Kirkkosävellajit screen to see the notes.

### UX / UI requirements

1. **Harjoittelu screen sub-navigation** — the Harjoittelu screen now has two views: the info page (Task 10) and the practice routine (this task). Add a simple tab or toggle to switch between them (e.g., "Tietoa" / "Harjoittele" tabs at the top, below the header).
2. **Mobile** — the practice list must be easy to tap through on a phone. Each scale item should be a large-ish tap target (≥44px height). Completed items should look visually distinct (e.g., muted colour, strikethrough, or checkmark).
3. **Desktop** — wider layout, same functionality.
4. **Visual style** — parchment/brown/red palette, consistent with the rest of the app.

### Files to create / change

- `app/src/lib/practiceMethod.ts` — practice method data with comments (new)
- `app/src/stores/practiceStore.ts` — Zustand store for practice session state with local storage persist (new)
- `app/src/screens/Harjoittelu.tsx` — add tab navigation, practice routine view
- New sub-components as needed (e.g., `PracticeList`, `PracticeItem`, `CompletionScreen`)

---

## Task 12: Add scale info panel to practice routine

**Status:** done
**Blocked by:** Task 11

Each scale in the Harjoittele practice list currently shows only a checkbox, the scale name, position, and shift pattern text. Add an info button to each practice item that shows detailed practice guidance for that scale — notes, shift exercises, arpeggio pattern, and practice tips — sourced from `docs/scale-practice-method.md`.

### Data layer

- Extend `app/src/lib/practiceMethod.ts` (or create a companion file `app/src/lib/scaleDetails.ts`) with structured detail data for each scale entry:
  - **Scale notes** — the full sequence of notes for the scale in the given position(s) with fingerings, e.g., `G(open) – A(1) – B(2) – C(3) – D(open) – E(1) – F#(2) – G(3)`.
  - **Shift exercise** — for Level 2+ scales, the specific shift note pair and exercise description (last note before shift → first note after shift, which finger guides, which string). Use the closest matching exercise from `docs/scale-practice-method.md` § "Shift Exercises" if an exact per-scale exercise is not documented.
  - **Shift practice routine** — the 4-step routine (slow slide × 5, at-tempo × 5, full scale slow, full scale at tempo) from the method doc.
  - **Arpeggio pattern** — tonic triad notes for the scale's key/mode at the appropriate level (1-octave for Level 1, 2-octave for Level 2–3).
- This data must be in TypeScript (not hardcoded in JSX) so it is maintainable and testable.

### Info button in practice list

- Add a small **info icon button** to each practice list item, placed to the right of the scale label (before the checkbox area, or at the trailing edge of the row — whichever gives a cleaner layout).
- The button must meet the 44×44px minimum touch target.
- Use an inline SVG icon — a circled "i" (ⓘ) or similar. Keep it visually light so it does not compete with the checkbox for attention. The checkbox remains the primary action; the info button is secondary.
- Tapping the info button opens the detail view (see below). Tapping the checkbox still toggles done state — the two actions must not conflict.

### Desktop: side panel

- On desktop, tapping the info button opens a **detail panel to the right** of the practice list.
- Update the Harjoittele tab's desktop layout from a single centered column to a two-area layout:
  - **Left:** the existing practice list (narrower, e.g. ~400px).
  - **Right:** the detail panel (~300px), shown only when a scale is selected for info. When no scale is selected, the right area is empty or shows a short placeholder ("Valitse asteikko nähdäksesi tiedot").
- The detail panel shows the scale's notes, shift exercise, shift routine, and arpeggio. It stays open until the user selects a different scale (replaces content) or closes it.
- Both areas sit inside the existing `max-w-[700px]` content container — or widen the container to `max-w-[900px]` if 700px is too tight for two columns. Follow the desktop content containment rule from `docs/ux-spec.md` (sub-navigation and content panels must not span full viewport width).

### Mobile: fullscreen modal dialog

- On mobile, tapping the info button opens a **fullscreen modal dialog** that overlays the practice list.
- The modal must be easy to dismiss:
  1. **Close button** — an "✕" icon button in the top-right corner, 44×44px touch target.
  2. **Back navigation** — pressing the browser/OS back button (or the Android back gesture) closes the modal. Use `history.pushState` / `popstate` listener (or React Router equivalent) so that back navigation closes the modal instead of leaving the Harjoittelu screen.
- The modal content scrolls if it overflows. Use the parchment/brown/red palette, consistent with the rest of the app.
- The modal header shows the scale name (e.g., "G-duuri — 1.–3. asema").

### Content displayed in detail view (both mobile and desktop)

All text in **Finnish**, consistent with the app's language policy.

1. **Nuotit** (Notes) — full note sequence with fingerings and string names.
2. **Asemavaihto** (Shift) — shift note pair, guide finger, target note, string. Only shown for Level 2+ scales.
3. **Harjoitusrutiini** (Practice routine) — the 4-step shift routine. Only shown for Level 2+ scales.
4. **Arpeggio** — tonic triad notes, octave count, note values (quarter/eighth).

### Files to create / change

- `app/src/lib/practiceMethod.ts` (or new `app/src/lib/scaleDetails.ts`) — extended scale detail data
- `app/src/screens/Harjoittelu.tsx` — info button in practice items, desktop two-column layout, mobile modal
- New sub-components as needed (e.g., `ScaleDetailPanel`, `ScaleDetailModal`)
- `docs/ux-spec.md` — update Harjoittelu desktop layout ASCII diagram to show two-column practice view

---

## Task 13: Extract canvas drawing into reusable music stave library and component

**Status:** done
**Blocked by:** —

`Kirkkosavellajit.tsx` currently contains ~100 lines of canvas drawing code (staff lines, treble clef, ledger lines, accidentals, note heads, stems) mixed into the screen file. Extract this into a pure TypeScript drawing library and a reusable React canvas component so the same rendering can power both the full Kirkkosavellajit view and smaller single-stave canvases in Harjoittelu (Task 12 detail panels).

### Drawing library: `app/src/lib/musicStave.ts`

Extract all canvas drawing functions from `Kirkkosavellajit.tsx` into a pure TypeScript module with **no React dependencies**:

- `drawStaffLines(ctx, options)` — draw 5 staff lines for one staff system. Currently hardcoded to two staves (upper + lower) with `STAFF_GAP = 220`. Must support drawing a configurable number of staves (1 or 2) at configurable Y positions.
- `drawTrebleClef(ctx, options)` — draw the 𝄞 clef. Must accept Y position and font size so it works for both the full 500px canvas and a smaller single-stave canvas.
- `drawLedgerLines(ctx, x, y, staffLines)` — draw ledger lines above/below a staff. Currently takes a `'upper' | 'lower'` string and looks up hardcoded arrays. Instead, accept the staff line Y-positions directly so it works for any staff placement.
- `drawAccidental(ctx, x, y, accidental, fontSize)` — draw ♯, ♭, 𝄪, 𝄫. Replace the `large: boolean` flag with an explicit font size so callers control sizing.
- `drawNote(ctx, x, note, staffLines, options)` — draw a note head, stem, ledger lines, and accidental. Currently depends on the hardcoded `UPPER_STAFF_LINES` / `LOWER_STAFF_LINES` arrays and calls `getNoteY` with a `'upper' | 'lower'` parameter. Refactor to accept staff line positions directly.
- `renderScale(ctx, key, mode, layout)` — orchestrate a full scale render. The `layout` parameter describes canvas dimensions, number of staves, note start/end X, spacing, and accidental font size. This replaces the current `renderScale` function which hardcodes two staves and derives spacing from canvas width.

**Key design rules:**
- Every function receives its geometry via parameters — no module-level constants for positions or sizes. The current hardcoded `STAFF_GAP`, `UPPER_STAFF_LINES`, `LOWER_STAFF_LINES` must become caller-provided configuration.
- The module must remain pure (no DOM access beyond the `CanvasRenderingContext2D` it receives, no React, no Zustand).
- Provide a `computeLayout(options)` helper that returns a complete layout config (staff positions, clef position, note start/spacing) given high-level inputs like `{ width, height, staves: 1 | 2, mobile: boolean }`. This is the convenience function that replaces all the scattered arithmetic.

### React component: `app/src/components/ui/MusicCanvas.tsx`

A reusable React component that wraps an HTML5 `<canvas>` and calls the drawing library:

```tsx
interface MusicCanvasProps {
  scaleKey: string
  mode: string
  width: number
  height: number
  staves?: 1 | 2          // default 2 (ascending + descending)
  mobile?: boolean         // default false — controls accidental size, clef size
}
```

- Uses `useRef<HTMLCanvasElement>` + `useEffect` to draw, exactly like the current code in Kirkkosavellajit.
- Calls `computeLayout()` to derive geometry, then `renderScale()` to draw.
- **Single-stave mode** (`staves: 1`): draws only one staff with notes ascending (no descending mirror). Uses a shorter canvas height (e.g., ~150px instead of 500px). This is the variant that Harjoittelu detail panels (Task 12) will use to show a compact scale preview.
- **Two-stave mode** (`staves: 2`): the current full Kirkkosavellajit behaviour — ascending on upper staff, descending on lower staff, 500px height.

### Refactor Kirkkosavellajit.tsx

- Remove all drawing functions (`drawStaff`, `drawTrebleClef`, `drawLedgerLines`, `drawAccidental`, `drawNote`, `renderScale`) and the hardcoded constants (`STAFF_GAP`, `UPPER_STAFF_LINES`, `LOWER_STAFF_LINES`).
- Replace the inline `<canvas>` + `useRef` + `useEffect` draw logic with `<MusicCanvas>`.
- The screen file should only contain UI/layout logic (buttons, sidebar, dropdown, navigation) — no canvas drawing code.
- Both desktop (1000×500) and mobile canvas must produce **identical visual output** to what they do today. This is a pure refactor — no visual changes.

### Files to create / change

- `app/src/lib/musicStave.ts` — new, pure drawing library
- `app/src/components/ui/MusicCanvas.tsx` — new, reusable canvas component
- `app/src/screens/Kirkkosavellajit.tsx` — remove drawing code, use `<MusicCanvas>`
- Existing tests must still pass; add a smoke test for `MusicCanvas` if practical

---

## Task 14: Tighten practice session state and Kirkkosavellajit layout hygiene

**Status:** done
**Blocked by:** —

Address three code-quality issues found in review without changing the product scope.

Focus areas:
- **Practice session reset flow** — the screen currently mutates the Zustand store directly when starting over. Move this into a store action so session state is reset in one place and persisted fields stay consistent.
- **Stable list identity** — the practice list uses array indexes as React keys even though the list can be reshuffled. Replace them with a stable identity derived from the scale entry.
- **Kirkkosavellajit layout cleanup** — reduce or remove inline `style` usage used for sizing/positioning and express the same layout with Tailwind utilities or component-level API where practical.

Questions the implementer must answer:
- What is the canonical "clear session" state in the practice store: which fields must be reset, and should any values intentionally survive?
- What unique key shape best represents a practice item if the same key/mode could appear in different positions or levels later?
- Which inline styles in Kirkkosavellajit are truly unavoidable, and which should become Tailwind classes or props on `MusicCanvas`?

Implementation hints:
- Add an explicit store action for clearing/resetting a session instead of calling `usePracticeStore.setState(...)` from the screen.
- Prefer a deterministic key such as `key + mode + level + positions` over the row index.
- Keep the visual result unchanged; this task is about maintainability and state correctness, not redesign.
- Add or extend tests around session reset / reshuffle behaviour if the refactor changes state handling.

---

## Task 15: Show scale as MusicCanvas in the info panel (Nuotit-osio)

**Status:** done
**Blocked by:** Task 13

The scale info panel (opened via the ⓘ button in the Harjoittele practice list) currently shows the scale notes as a text string (`G – A – B – C – D – E – F# – G`). Replace this with a compact single-stave `MusicCanvas` rendering of the one-octave ascending scale, keeping the note names as small helper text below, and leaving the Arpeggio section unchanged.

### What changes

1. **Extend `ScaleDetail`** — add `scaleKey: string` and `scaleMode: string` fields to the `ScaleDetail` interface in `app/src/lib/practiceMethod.ts` so the panel knows what to pass to `MusicCanvas`. Populate them in `getScaleDetail()` from the `ScaleEntry`.

2. **Update `ScaleDetailPanel.tsx`** — replace the Nuotit section:
   - **Before:** `<p className="font-mono ...">{detail.notes.join(' – ')}</p>`
   - **After:**
     1. `<MusicCanvas scaleKey={detail.scaleKey} mode={detail.scaleMode} width={panelWidth} height={130} staves={1} />` — compact single-stave canvas showing the ascending scale.
     2. `<p className="text-xs text-[#8B4513] mt-1">{detail.notes.join(' – ')}</p>` — same note names in small text below the canvas.
   - Import `MusicCanvas` from `../../components/ui/MusicCanvas`.

3. **Canvas sizing** — the panel width differs between desktop (268px usable inside 300px panel with padding) and mobile (full modal width minus padding ~340px). Two approaches:
   - **Option A (simpler):** Use a fixed width like `260` that fits both contexts. The canvas will be slightly narrower than the mobile modal but consistent.
   - **Option B (responsive):** Accept `panelWidth` as a prop on `ScaleDetailPanel` and compute it from the parent. More work but pixel-perfect.
   - **Recommendation:** Start with Option A (fixed 260px width). The 8-note scale renders fine at this width in staves=1 mode. If it looks cramped, the implementer can switch to Option B.

4. **`computeLayout` tuning for narrow single-stave** — verify that `computeLayout({ width: 260, height: 130, staves: 1, mobile: false })` produces sensible note spacing and clef sizing. The current formula: `noteSpacing = (260 - 115 - 60) / 7 ≈ 12px` — this is too narrow. The implementer should either:
   - Reduce `noteStartX` and `endPad` for the compact case (e.g., `noteStartX: 50, endPad: 15` → spacing ≈ 28px), or
   - Add a `compact` option to `computeLayout` that uses tighter geometry for small canvases.
   - **Recommendation:** Add a `compact?: boolean` flag to `computeLayout` options. When `compact` is true: `noteStartX = 50`, `endPad = 10`, `clefFontSize = 80`, `clefX = 15`. This keeps the library generic.

5. **Arpeggio section** — keep completely unchanged. It stays as text (`detail.arpeggioNotes` and `detail.arpeggioDescription`).

### Files to change

- `app/src/lib/practiceMethod.ts` — add `scaleKey` and `scaleMode` to `ScaleDetail`, populate in `getScaleDetail()`
- `app/src/lib/musicStave.ts` — add `compact` flag to `computeLayout` with tighter geometry
- `app/src/components/ui/ScaleDetailPanel.tsx` — replace Nuotit text with `MusicCanvas` + small text

### Verification

- Open Harjoittele tab, tap ⓘ on a scale → the Nuotit section shows a drawn staff with notes, not just text
- Note names still visible as small text below the canvas
- Arpeggio section unchanged
- Desktop side panel: canvas fits within 300px panel
- Mobile modal: canvas fits within the modal width
- Compare the drawn notes visually against the text to confirm correctness

---

## Task 16: Add octave-aware note system and arpeggio drawing to musicStave library

**Status:** done
**Blocked by:** Task 13

The current drawing system positions notes **relative to the scale root** — it doesn't know about absolute pitch or octaves. This task adds an octave-aware note representation and a `renderArpeggio()` function to `musicStave.ts` so that arpeggio notes (and later, arbitrary note sequences) can be drawn at their correct staff positions.

**Scope limitation:** Support only the standard violin range: G3 (pieni/pikku g, avoin G-kieli) to B5 (kaksiviivainen h). Do not implement octaves outside this range yet.

### Part 1: Oktaavijärjestelmän dokumentaatio (Octave system documentation)

Add a JSDoc comment block at the top of `app/src/lib/musicStave.ts` (or in a new companion file `app/src/lib/noteOctave.ts` if cleaner) that documents the octave naming system used by the library:

```
/**
 * Oktaavijärjestelmä / Octave system
 *
 * Tämä kirjasto käyttää SPN-numerointia (Scientific Pitch Notation) sisäisesti.
 * Suomalaiset oktaavinimet perustuvat Helmholtzin merkintätapaan (1863),
 * joka on peräisin saksalaisesta urkujenrakennusperinteestä.
 *
 * Finnish octave names originate from the Helmholtz pitch notation system (1863),
 * itself derived from the German organ builders' pipe-labeling tradition.
 *
 * ┌─────────────────────────────────────┬────────────────┬────────────┬───────────┐
 * │ Suomeksi (fin)                      │ Helmholtz      │ SPN (C..B) │ Viulu     │
 * ├─────────────────────────────────────┼────────────────┼────────────┼───────────┤
 * │ Subkontraoktaavi                    │ C„ – B„        │ C0 – B0    │ —         │
 * │ Kontraoktaavi                       │ C, – B,        │ C1 – B1    │ —         │
 * │ Suuri (iso) oktaavi                 │ C – B          │ C2 – B2    │ —         │
 * │ Pieni (pikku) oktaavi               │ c – b          │ C3 – B3    │ G3 ↑     │
 * │ Yksiviivainen (1-viivainen) oktaavi │ c' – b'        │ C4 – B4    │ koko     │
 * │ Kaksiviivainen (2-viivainen) okt.   │ c'' – b''      │ C5 – B5    │ → B5     │
 * │ Kolmiviivainen (3-viivainen) okt.   │ c''' – b'''    │ C6 – B6    │ —         │
 * │ Neliviivainen (4-viivainen) okt.    │ c'''' – b''''  │ C7 – B7    │ —         │
 * │ Viisiviivainen (5-viivainen) okt.   │ c'''''         │ C8         │ —         │
 * └─────────────────────────────────────┴────────────────┴────────────┴───────────┘
 *
 * Nimeämisjärjestelmä (OCTAVE_NAMES_FI, noteOctave.ts) kattaa kaikki
 * oktaavit 0–8. Piirtojärjestelmä tukee toistaiseksi vain viulun aluetta.
 *
 * Viulun tuettu alue tässä kirjastossa:
 *   G3 (pieni g, avoin G-kieli) – B5 (kaksiviivainen h, E-kieli 3. asemassa)
 *
 * Nuottiviivaston kiinteät paikat (diskanttivain, treble clef):
 *   Viiva 1 (alin)  = E4 (yksiviivainen e)
 *   Viiva 2          = G4
 *   Viiva 3          = B4
 *   Viiva 4          = D5
 *   Viiva 5 (ylin)   = F5
 *   Keski-C (C4)     = apuviiva alapuolella
 */
```

### Part 2: Tietotyypit ja vakiot (Types and constants)

Place in a new file `app/src/lib/noteOctave.ts` — this is pure data/logic with no canvas or React dependency. Re-export from `musicStave.ts` for convenience.

```ts
// ── Tietotyypit (Types) ──

/** A note with explicit octave — used for absolute staff positioning. */
export interface NoteWithOctave {
  /** Note letter: C, D, E, F, G, A, B */
  letter: string
  /** Accidental: '#', 'b', '##', 'bb', or null */
  accidental: string | null
  /** SPN octave number: 0–8. See OCTAVE_NAMES_FI for Finnish equivalents. */
  octave: number
}

/** Diatonic step index for each letter (C=0, D=1, ..., B=6) */
export const DIATONIC_INDEX: Record<string, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
}

// ── Oktaavinimet kaikille oktaaveille (Octave names for ALL octaves) ──
// Nämä kattavat koko pianon alueen ja sen yli. Piirtojärjestelmä
// tukee toistaiseksi vain viulun aluetta (G3–B5), mutta nimeäminen
// toimii kaikille oktaaveille.

/**
 * Suomenkieliset oktaavinimet SPN-numeron mukaan (0–8).
 * Finnish octave names indexed by SPN octave number.
 *
 * Nämä nimet ovat vakiintuneet suomalaisessa musiikkiteoriassa ja
 * perustuvat Helmholtzin järjestelmään. Mukana sekä viralliset
 * (suuri, pieni) että puhekieliset (iso, pikku) muodot.
 */
export const OCTAVE_NAMES_FI: Record<number, {
  /** Virallinen nimi (esim. "Pieni oktaavi") */
  name: string
  /** Puhekielinen / lyhyt nimi (esim. "pikku") */
  shortName: string
  /** Helmholtz-merkintätapa (esim. "c – b") */
  helmholtz: string
  /** Kuvaus englanniksi */
  nameEn: string
}> = {
  0: { name: 'Subkontraoktaavi',            shortName: 'subkontra',      helmholtz: 'C„ – B„',     nameEn: 'Sub-contra octave' },
  1: { name: 'Kontraoktaavi',               shortName: 'kontra',         helmholtz: 'C, – B,',     nameEn: 'Contra octave' },
  2: { name: 'Suuri oktaavi',               shortName: 'iso',            helmholtz: 'C – B',       nameEn: 'Great octave' },
  3: { name: 'Pieni oktaavi',               shortName: 'pikku',          helmholtz: 'c – b',       nameEn: 'Small octave' },
  4: { name: 'Yksiviivainen oktaavi',       shortName: '1-viivainen',    helmholtz: "c' – b'",     nameEn: 'One-line octave' },
  5: { name: 'Kaksiviivainen oktaavi',      shortName: '2-viivainen',    helmholtz: "c'' – b''",   nameEn: 'Two-line octave' },
  6: { name: 'Kolmiviivainen oktaavi',      shortName: '3-viivainen',    helmholtz: "c''' – b'''", nameEn: 'Three-line octave' },
  7: { name: 'Neliviivainen oktaavi',       shortName: '4-viivainen',    helmholtz: "c'''' – b''''", nameEn: 'Four-line octave' },
  8: { name: 'Viisiviivainen oktaavi',      shortName: '5-viivainen',    helmholtz: "c'''''",      nameEn: 'Five-line octave' },
}

/**
 * Muodosta nuotin suomenkielinen nimi oktaavin kanssa.
 * Format a note's Finnish name with its octave designation.
 *
 * Esimerkit / Examples:
 *   formatNoteFi({ letter: 'G', accidental: null, octave: 3 })  → "pieni g"
 *   formatNoteFi({ letter: 'A', accidental: null, octave: 4 })  → "yksiviivainen a"
 *   formatNoteFi({ letter: 'F', accidental: '#', octave: 5 })   → "kaksiviivainen fis"
 *   formatNoteFi({ letter: 'B', accidental: 'b', octave: 3 })   → "pieni b"
 *
 * Huom: Suomalaisessa traditiossa H = B-natural ja B = Bb,
 * mutta tämä kirjasto käyttää englanninkielisiä nimiä (B = B-natural)
 * yhdenmukaisuuden vuoksi muun koodikannan kanssa.
 * Jos halutaan saksalais-suomalainen perinne (H/B), lisätään
 * erillinen formatNoteFinTradition() myöhemmin.
 *
 * @param note - NoteWithOctave
 * @param useShortName - Jos true, käyttää lyhyttä muotoa ("pikku g" vs. "Pieni oktaavi: g")
 * @returns Suomenkielinen nuottinimi
 */
export function formatNoteFi(note: NoteWithOctave, useShortName = true): string {
  const octaveInfo = OCTAVE_NAMES_FI[note.octave]
  if (!octaveInfo) return `${note.letter}${note.accidental ?? ''}${note.octave}`

  // Suomeksi nuottikirjain on pienellä (lowercase)
  const letterLower = note.letter.toLowerCase()
  const accidentalSuffix = note.accidental
    ? ({ '#': 'is', '##': 'isis', 'b': 'es', 'bb': 'eses' }[note.accidental] ?? '')
    : ''

  const prefix = useShortName ? octaveInfo.shortName : octaveInfo.name
  return `${prefix} ${letterLower}${accidentalSuffix}`
}

/**
 * Muodosta Helmholtz-merkintä nuotille.
 * Format a note in Helmholtz notation.
 *
 * Esimerkit:
 *   { letter: 'C', octave: 4 } → "c'"
 *   { letter: 'G', octave: 3 } → "g"
 *   { letter: 'A', octave: 2 } → "A"
 *   { letter: 'D', octave: 5 } → "d''"
 */
export function formatNoteHelmholtz(note: NoteWithOctave): string {
  const acc = note.accidental
    ? ({ '#': 'is', '##': 'isis', 'b': 'es', 'bb': 'eses' }[note.accidental] ?? '')
    : ''

  if (note.octave <= 2) {
    // Suuri/iso oktaavi ja alemmat: ISOT kirjaimet
    const letter = note.letter.toUpperCase()
    const subPrimes = note.octave < 2 ? ','.repeat(2 - note.octave) : ''
    return `${letter}${acc}${subPrimes}`
  }

  // Pieni ja ylemmät: pienet kirjaimet + pilkut
  const letter = note.letter.toLowerCase()
  const primes = note.octave > 3 ? "'".repeat(note.octave - 3) : ''
  return `${letter}${acc}${primes}`
}

/**
 * Muodosta SPN-merkintä nuotille (esim. "G3", "F#5").
 * Format a note in Scientific Pitch Notation.
 */
export function formatNoteSPN(note: NoteWithOctave): string {
  return `${note.letter}${note.accidental ?? ''}${note.octave}`
}

// ── Viulun aluevakiot (Violin range constants) ──

/**
 * Viulun avointen kielien aloitusoktaavit 1. asemassa.
 * Open-string starting octaves in 1st position.
 */
export const VIOLIN_OPEN_STRING_OCTAVES: Record<string, number> = {
  G: 3,  // pieni g  (G3)
  D: 4,  // yksiviivainen d (D4)
  A: 4,  // yksiviivainen a (A4)
  E: 5,  // kaksiviivainen e (E5)
}

/** Piirtojärjestelmän tuettu alue (Drawing system supported range). */
export const DRAWING_RANGE = { min: { letter: 'G', octave: 3 }, max: { letter: 'B', octave: 5 } }
```

**Key design decision:** `noteOctave.ts` defines names and formatting for **all** octaves 0–8 (full piano range and beyond), so the naming system is complete and usable for display/logging/testing everywhere. Only the drawing functions in `musicStave.ts` are limited to G3–B5. This separation means future tasks can extend the drawing range without touching the naming layer.

### Part 3: Absoluuttinen nuottipaikka (Absolute note positioning)

Add a function to compute the Y-coordinate of a note from its absolute pitch:

```ts
/**
 * Calculate the Y-coordinate for a note at a specific octave on a treble clef staff.
 * Reference point: E4 (yksiviivainen e) sits on the bottom staff line (staffLineYs[4]).
 * Each diatonic step = half the line spacing (12.5px for standard 25px line spacing).
 *
 * @param note - The note with octave info
 * @param staffLineYs - Y-positions of the 5 staff lines (index 0 = top, index 4 = bottom)
 * @returns Y-coordinate on the canvas
 */
export function getAbsoluteNoteY(
  note: NoteWithOctave,
  staffLineYs: number[]
): number {
  const lineSpacing = staffLineYs[1] - staffLineYs[0]  // 25px
  const stepSize = lineSpacing / 2  // 12.5px

  // E4 diatonic position = 4*7 + 2 = 30
  const e4Position = 4 * 7 + DIATONIC_INDEX['E']  // = 30
  const notePosition = note.octave * 7 + DIATONIC_INDEX[note.letter]

  // Bottom line (staffLineYs[4]) = E4; each step up = -stepSize
  return staffLineYs[4] - (notePosition - e4Position) * stepSize
}
```

**Verification formula** (implementer should add these as unit tests):
- `G3 (3*7+4=25)` → `y = 195 - (25-30)*12.5 = 195 + 62.5 = 257.5` (2 apuviivaa alapuolella)
- `E4 (4*7+2=30)` → `y = 195 - 0 = 195` (alin viiva ✓)
- `G4 (4*7+4=32)` → `y = 195 - 25 = 170` (viiva 2 ✓)
- `B4 (4*7+6=34)` → `y = 195 - 50 = 145` (viiva 3 ✓)
- `F5 (5*7+3=38)` → `y = 195 - 100 = 95` (viiva 5 ✓)
- `B5 (5*7+6=41)` → `y = 195 - 137.5 = 57.5` (2 apuviivaa yläpuolella)

### Part 4: Arpeggion nuottien laskenta (Arpeggio note generation)

Add to `app/src/lib/practiceMethod.ts` (or a new `arpeggioNotes.ts`):

```ts
/**
 * Build arpeggio notes with correct octaves for violin.
 * A 1-octave tonic triad arpeggio = root, 3rd, 5th, octave-root (4 notes).
 *
 * @param scaleNotes - The 8-note scale from getScale() (indices 0-7)
 * @param rootKey - The root key letter (e.g., 'G', 'D')
 * @returns Array of NoteWithOctave for the arpeggio
 */
export function buildArpeggioNotesWithOctave(
  scaleNotes: string[],
  rootKey: string
): NoteWithOctave[]
```

Logic:
1. Determine starting octave from `VIOLIN_OPEN_STRING_OCTAVES` based on root key letter. For keys not starting on an open string (e.g., F, Bb, Eb), find the nearest lower open string and compute: e.g., F starts on D-string → octave 4; Bb starts on A-string but one step up → octave 4; C starts on G-string but up → still octave 3 for C (wait, C in 1st position on G-string: G3, A3, B3, C4 — so C is actually octave 4).
2. Actually, a cleaner approach: define a const map `SCALE_ROOT_OCTAVE` for each key used in the practice method:
   ```ts
   const SCALE_ROOT_OCTAVE: Record<string, number> = {
     'G': 3, 'A': 3, 'Bb': 3,        // G-kieli alue
     'C': 4, 'D': 4, 'E': 4, 'F': 4, // D/A-kieli alue
     'F#': 4, 'Ab': 4, 'Eb': 4, 'B': 3,
   }
   ```
   (The implementer must verify each key's starting octave against standard violin fingering charts.)
3. Parse each arpeggio note letter from `scaleNotes[0]`, `scaleNotes[2]`, `scaleNotes[4]`, `scaleNotes[7]`.
4. Assign octaves: start from root octave, and increment octave when the diatonic index wraps past B→C.
5. Return `NoteWithOctave[]`.

### Part 5: renderArpeggio-piirtofunktio (Arpeggio rendering function)

Add to `app/src/lib/musicStave.ts`:

```ts
/**
 * Render arpeggio notes on a single staff.
 * Draws staff lines, treble clef, and the given notes at their absolute positions.
 *
 * @param ctx - Canvas 2D context
 * @param notes - Array of NoteWithOctave to draw
 * @param layout - StaveLayout (should be staves=1)
 */
export function renderArpeggio(
  ctx: CanvasRenderingContext2D,
  notes: NoteWithOctave[],
  layout: StaveLayout
): void
```

Implementation:
1. Clear canvas, draw staff lines, draw treble clef (reuse existing functions).
2. Compute note X positions: evenly spaced from `layout.noteStartX` to near the end. For 4 notes: `spacing = (endX - noteStartX) / 3`.
3. For each note, call `getAbsoluteNoteY(note, staffLineYs)` to get Y.
4. Draw note head (ellipse), stem, ledger lines, accidental — reuse existing drawing primitives but with absolute Y instead of the relative `getNoteY`.
5. This means extracting the note-head/stem/accidental drawing from the current `drawNote()` into a lower-level `drawNoteAt(ctx, x, y, accidental, accidentalFontSize, staffLineYs)` function, which both `drawNote()` and `renderArpeggio()` can call.

### Part 6: MusicCanvas-komponentin laajennus (MusicCanvas extension)

Extend `MusicCanvas.tsx` props:

```ts
interface MusicCanvasProps {
  // ... existing props ...
  /** If provided, renders an arpeggio instead of a scale */
  arpeggioNotes?: NoteWithOctave[]
}
```

When `arpeggioNotes` is provided, call `renderArpeggio()` instead of `renderScale()`.

### Files to create / change

- `app/src/lib/noteOctave.ts` — **new file**: `NoteWithOctave`, `OCTAVE_NAMES_FI` (all octaves 0–8), `DIATONIC_INDEX`, `VIOLIN_OPEN_STRING_OCTAVES`, `DRAWING_RANGE`, `formatNoteFi()`, `formatNoteHelmholtz()`, `formatNoteSPN()`
- `app/src/lib/musicStave.ts` — add documentation block (Part 1), import and re-export from `noteOctave.ts`, add `getAbsoluteNoteY()`, `drawNoteAt()` (extracted from `drawNote()`), `renderArpeggio()`
- `app/src/lib/practiceMethod.ts` — add `SCALE_ROOT_OCTAVE`, `buildArpeggioNotesWithOctave()`
- `app/src/components/ui/MusicCanvas.tsx` — add `arpeggioNotes` prop, conditional rendering
- Tests: `app/src/__tests__/noteOctave.test.ts` — unit tests for:
  - `getAbsoluteNoteY` (the 6 Y-position verification cases above)
  - `buildArpeggioNotesWithOctave` (G-duuri, A-molli)
  - `formatNoteFi` — verify all octaves produce correct Finnish names:
    - `{ letter: 'C', accidental: null, octave: 0 }` → `"subkontra c"`
    - `{ letter: 'G', accidental: null, octave: 3 }` → `"pikku g"`
    - `{ letter: 'A', accidental: null, octave: 4 }` → `"1-viivainen a"`
    - `{ letter: 'F', accidental: '#', octave: 5 }` → `"2-viivainen fis"`
    - `{ letter: 'C', accidental: null, octave: 8 }` → `"5-viivainen c"`
  - `formatNoteHelmholtz` — verify:
    - `{ letter: 'C', octave: 2 }` → `"C"` (suuri)
    - `{ letter: 'G', octave: 3 }` → `"g"` (pieni)
    - `{ letter: 'A', octave: 4 }` → `"a'"` (yksiviivainen)
    - `{ letter: 'D', octave: 5 }` → `"d''"` (kaksiviivainen)
    - `{ letter: 'C', octave: 1 }` → `"C,"` (kontra)

### Verification

- **Nimeämisjärjestelmä (all octaves):** unit tests pass for `formatNoteFi`, `formatNoteHelmholtz`, `formatNoteSPN` across octaves 0–8
- **Y-position calculations:** unit tests pass for the 6 verification cases
- **Piirtojärjestelmä (violin range):** G-duuri arpeggio (G3, B3, D4, G4) renders: G3 below staff with ledger lines, B3 just below staff, D4 on space below line 1, G4 on line 2
- A-molli arpeggio (A3, C4, E4, A4) renders correctly
- Notes within violin range (G3–B5) position correctly
- Notes outside the drawing range should log a warning (but not crash)
- `OCTAVE_NAMES_FI` has entries for all octaves 0–8 with `name`, `shortName`, `helmholtz`, `nameEn`

---

## Task 17: Show arpeggio as MusicCanvas in the info panel

**Status:** done
**Blocked by:** Task 16

Replace the text-only arpeggio display in the scale info panel with a drawn `MusicCanvas` showing the arpeggio notes on a staff, followed by the note names and description as small text below.

### What changes

1. **Extend `ScaleDetail`** — add `arpeggioNotesWithOctave: NoteWithOctave[]` to the `ScaleDetail` interface. Populate it in `getScaleDetail()` by calling `buildArpeggioNotesWithOctave(notes, scale.key)` from Task 16.

2. **Update `ScaleDetailPanel.tsx`** — replace the Arpeggio section:
   - **Before:** `<p className="font-mono ...">{detail.arpeggioNotes}</p>` + description text
   - **After:**
     1. `<MusicCanvas arpeggioNotes={detail.arpeggioNotesWithOctave} width={260} height={130} staves={1} />` — compact canvas showing the arpeggio notes at correct pitches.
     2. `<p className="text-xs text-[#8B4513] mt-1">{detail.arpeggioNotes}</p>` — note names in small text.
     3. `<p className="text-xs text-[#8B4513]">{detail.arpeggioDescription}</p>` — description text.

3. **Canvas sizing** — same approach as Task 15: fixed 260px width, 130px height. The `compact` layout from Task 15 applies here too. For 4 arpeggio notes the spacing will be wider than for 8 scale notes, which is visually correct (arpeggio notes should feel "spread out").

4. **Arpeggio-specific layout** — `renderArpeggio()` in `musicStave.ts` computes its own note spacing based on the number of notes (typically 4 for a 1-octave triad). The `computeLayout()` compact mode provides the staff geometry; the arpeggio renderer handles horizontal spacing internally.

### Files to change

- `app/src/lib/practiceMethod.ts` — add `arpeggioNotesWithOctave` to `ScaleDetail`, populate in `getScaleDetail()`
- `app/src/components/ui/ScaleDetailPanel.tsx` — replace Arpeggio section with `MusicCanvas` + small text

### Verification

- Open Harjoittele tab, tap ⓘ on G-duuri (taso 1) → Arpeggio section shows drawn notes G3–B3–D4–G4 on a staff
- Tap ⓘ on D-molli (taso 1) → Arpeggio shows D4–F4–A4–D5
- Notes with accidentals render correctly (e.g., F#-molli: F#4–A4–C#5–F#5)
- Note names still visible as small text below the canvas
- Description text ("yhden oktaavin toonika-arpeggio, neljäsosanuoteilla") still visible
- Both desktop side panel and mobile modal display correctly

---

## Task 18: Replace NOTE_TO_STAFF_POSITION with octave-aware note positioning

**Status:** pending
**Blocked by:** —

### The problem

`getNoteY()` in `musicScale.ts` uses `NOTE_TO_STAFF_POSITION` — a hardcoded map of note letter → canvas Y coordinate (e.g. `G: 180`, `A: 168`). This works only for one specific octave. When the same letter appears in a different octave (e.g. G3 vs G4), it still gets the same Y, causing arpeggios and multi-octave scales to place notes on wrong staff lines. The arpeggio currently compensates with a separate `SCALE_ROOT_OCTAVE` map, creating a second source of truth that can drift out of sync with the scale drawing.

### The fix

1. **Reverse-engineer the correct starting octave for every scale** currently in `SCALES` (in `practiceMethod.ts`). The scale canvas already draws all notes at visually correct positions. Read those positions back: `getNoteY` for the root note of each key/mode pair determines which octave maps to `NOTE_TO_STAFF_POSITION[rootLetter]`. Encode this as a constant map `SCALE_START_OCTAVE` (similar to the existing `SCALE_ROOT_OCTAVE` but verified against what is actually drawn).

2. **Migrate `renderScale` to use `getAbsoluteNoteY`**. Replace `drawNote` → `getNoteY` with `drawNoteAt` → `getAbsoluteNoteY`, supplying the correct starting octave and incrementing octave as the scale ascends (same logic already implemented in `buildArpeggioNotesWithOctave`). Delete `NOTE_TO_STAFF_POSITION`, `calculateStaffSteps`, and `getNoteY` once nothing imports them.

3. **Align arpeggio start octave with scale start octave**. Replace `SCALE_ROOT_OCTAVE` in `practiceMethod.ts` with a reference to the new `SCALE_START_OCTAVE` constant so both scale and arpeggio always start from the same note. The arpeggio root note must land on the same staff line as the scale root note.

4. All existing visual output for scales must remain identical. Add unit tests comparing Y values before and after migration for at least G-duuri, D-molli, and A-duuri.
