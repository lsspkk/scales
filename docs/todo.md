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

**Status:** pending
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
