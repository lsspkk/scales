# Architecture & Development Reference

## Music Theory Implementation

**Scale generation (`getScale()`):**
1. Takes mode intervals (e.g., Dorian: `[0, 2, 3, 5, 7, 9, 10]`)
2. Applies intervals to the root note pitch class
3. Spells each note using the correct letter sequence (C–D–E–F–G–A–B)
4. Resolves accidentals (natural, sharp, flat, double-sharp, double-flat) to match target pitch class with minimal accidentals
5. Returns 7 notes + octave (8 total)

**Note positioning:**
- Each note letter has a fixed staff position relative to the root
- `getNoteY()` calculates Y-coordinate from staff position offset and ledger line logic
- Upper staff = notes ascending, lower staff = notes descending

**Accidentals:**
- Sizes adapt to screen width (larger on mobile)
- Double accidentals use Unicode glyphs with fallback to two symbols
- Positioned 32px left of the note head

**Mode naming:**
- Button `data-mode` values: lowercase, no spaces (`ionian`, `dorian`, …)
- Display names include Finnish translations: `'ionian (Duuri)'`, `'aeolian (Molli)'`
- Internal code splits on space to get base mode name

## React Application Architecture

**State management:** Zustand store (`src/stores/musicStore.ts`) with `persist` middleware saves key/mode to localStorage. Screen navigation is also managed via the store.

**Screen routing:** State-based routing in `App.tsx`. Screens are lazy-loaded via `React.lazy()` + `Suspense`.

**Key files:**

| File | Role |
|------|------|
| `src/lib/musicScale.ts` | Pure music theory functions (scale generation, note info, staff positioning) |
| `src/lib/musicStave.ts` | Pure canvas drawing library (staff lines, clef, notes, accidentals) — no React |
| `src/lib/useViewport.ts` | `useViewport()` hook — returns `{ isDesktop }` for responsive layout branching |
| `src/stores/musicStore.ts` | Zustand store — key, mode, screen navigation |
| `src/components/ui/MusicCanvas.tsx` | Reusable canvas component wrapping musicStave library |
| `src/screens/Kirkkosavellajit.tsx` | Scale visualizer with UI controls, uses MusicCanvas for rendering |
| `src/lib/practiceMethod.ts` | Practice method data: 36 scales across 3 levels, shuffle/format helpers |
| `src/stores/practiceStore.ts` | Zustand store for practice session (selected levels, practice set, progress) |
| `src/screens/Harjoittelu.tsx` | Practice screen with Tietoa/Harjoittele tabs, info page + interactive routine |
| `src/screens/Home.tsx` | Navigation hub with HomeCard components |
| `src/components/ui/` | Reusable UI primitives (Button, Chip, ScreenHeader, SectionCard, etc.) |

**Data flow:**
```
User interacts with UI (Kirkkosavellajit screen)
  → Zustand store updates key/mode (persisted to localStorage)
  → MusicCanvas re-renders via useEffect dependency on key/mode
  → computeLayout() derives geometry from canvas size and mobile flag
  → renderScale() draws staff, clefs, and notes on HTML5 canvas
```

## Canvas Drawing Library (`musicStave.ts`)

The drawing logic is extracted into a pure TypeScript module with no React dependencies:

**Key functions:**
- `computeLayout(options)` — returns a `StaveLayout` config from high-level inputs (`width`, `height`, `staves: 1 | 2`, `mobile`)
- `drawStaffLines(ctx, layout)` — draws 5 staff lines for 1 or 2 staves
- `drawTrebleClef(ctx, layout)` — draws 𝄞 clef at configured size/position
- `drawLedgerLines(ctx, x, y, staffLineYs)` — ledger lines for notes above/below staff
- `drawAccidental(ctx, x, y, accidental, fontSize)` — ♯, ♭, 𝄪, 𝄫 symbols
- `drawNote(ctx, x, note, staff, ...)` — complete note with head, stem, ledger lines, accidental
- `renderScale(ctx, key, mode, layout)` — orchestrates full scale render

**Design principle:** All geometry is passed via the `StaveLayout` object — no module-level constants. This allows the same code to render both:
- Full 1000×500 two-stave canvas (Kirkkosavellajit)
- Compact single-stave preview canvases (Harjoittelu detail panels)

## Octave-Aware Note System (`noteOctave.ts`)

`noteOctave.ts` provides absolute pitch representation and Finnish/Helmholtz/SPN formatting for all octaves 0–8. The drawing system supports only the violin range G3–B5.

**Key types and functions:**
- `NoteWithOctave` — `{ letter, accidental, octave }` for absolute pitch
- `DIATONIC_INDEX` — maps note letter to diatonic step (C=0 … B=6)
- `OCTAVE_NAMES_FI` — Finnish octave names for all octaves 0–8 (Helmholtz-based)
- `getAbsoluteNoteY(note, staffLineYs)` — computes canvas Y from absolute pitch. Reference: E4 = bottom staff line (staffLineYs[4])
- `formatNoteFi()`, `formatNoteHelmholtz()`, `formatNoteSPN()` — note name formatting
- `VIOLIN_OPEN_STRING_OCTAVES`, `DRAWING_RANGE` — violin-specific constants

**Arpeggio rendering:**
- `buildArpeggioNotesWithOctave(scaleNotes, rootKey)` in `practiceMethod.ts` — builds `NoteWithOctave[]` from scale degrees 1, 3, 5, 8
- `renderArpeggio(ctx, notes, layout)` in `musicStave.ts` — draws arpeggio notes at absolute Y positions using `getAbsoluteNoteY()`
- `drawNoteAt(ctx, x, y, accidental, fontSize, staffLineYs)` — low-level note drawing at an absolute position (extracted from `drawNote()`)
- `MusicCanvas` accepts `arpeggioNotes?: NoteWithOctave[]` — when provided, renders arpeggio instead of scale

## Canvas Layout

- Size: 1000×500 px
- Two staves separated by `STAFF_GAP` (220 px)
- Staff lines: 5 per staff at 25 px intervals; drawn from x=5 to x=995 (5px margins)
- Treble clef: 126px serif font, centered at x=25, y=153 (upper) and y=153+STAFF_GAP (lower)
- Notes start at x=115 with 123 px spacing; last note lands at x=976, ~19px from staff end

## Responsive Design

**Viewport detection:** `useViewport()` hook in `src/lib/useViewport.ts` uses `useSyncExternalStore` + `window.matchMedia('(min-width: 769px)')` to return `{ isDesktop: boolean }`.

**Desktop layout (>768px):**
- `App.tsx` skips `MobileShell`; screens fill the full browser viewport
- `Kirkkosavellajit`: two-column layout — left sidebar (272px) with all key/mode selection controls always visible, right area with 1000×500 canvas centered; no dropdown toggle or arrow buttons
- `Home`: cards displayed side-by-side in a row, centered on the page
- `Harjoittelu`: full-width placeholder
- Canvas accidentals use standard (smaller) font sizes

**Mobile layout (≤768px):**
- `App.tsx` wraps content in `MobileShell` (centered ~390px column with grey letterbox)
- Dropdown menu toggle for key/mode selection, arrow navigation buttons for quick cycling
- Canvas accidentals use larger font sizes for readability

## Deployment

Push to `main` → GitHub Actions (`.github/workflows/deploy-to-azure.yml`) uploads HTML/CSS/JS to Azure Static Storage.
Secrets needed: `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_ACCOUNT_KEY`.
