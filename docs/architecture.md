# Architecture & Development Reference

## Music Theory Implementation

**Scale generation (`getScale()`):**
1. Takes mode intervals (e.g., Dorian: `[0, 2, 3, 5, 7, 9, 10]`)
2. Applies intervals to the root note pitch class
3. Spells each note using the correct letter sequence (C–D–E–F–G–A–B)
4. Resolves accidentals (natural, sharp, flat, double-sharp, double-flat) to match target pitch class with minimal accidentals
5. Returns 7 notes + octave (8 total)

**Note positioning:**
- Notes are positioned by absolute pitch via `getAbsoluteNoteY()` (`noteOctave.ts`), keyed off `E4 = bottom staff line`
- Every scale and arpeggio starts from `SCALE_START_OCTAVE[key]` (octave 4 for all currently-defined roots), so a scale's root note lands on the same staff line as its arpeggio's root
- Upper staff = notes ascending, lower staff = notes descending
- Drawing is hard-bounded to `DRAWING_RANGE` = [G3, G6]. `drawNoteAt()` skips and `console.error`s any out-of-range note

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
- `computeLayout(options)` — returns a `StaveLayout` config from the canvas's measured CSS size (`width`, `height`, `staves: 1 | 2`). All geometry (line spacing, clef size, note-head radius, stem length, accidental size) scales with the measured size — no `mobile`/`compact` flags
- `drawStaffLines(ctx, layout)` — draws 5 staff lines for 1 or 2 staves; uses `Math.round(y) + 0.5` for crisp 1px strokes
- `drawTrebleClef(ctx, layout)` — draws 𝄞 clef at configured size/position
- `drawLedgerLines(ctx, x, y, staffLineYs, halfWidth)` — ledger lines for notes above/below staff
- `drawAccidental(ctx, x, y, accidental, fontSize)` — ♯, ♭, 𝄪, 𝄫 symbols
- `drawNoteAt(ctx, x, note, staffLineYs, layout)` — complete note (head, stem, ledger lines, accidental) at absolute pitch; enforces the `DRAWING_RANGE` [G3, G6] bound
- `renderScale(ctx, key, mode, layout)` — orchestrates full scale render using `SCALE_START_OCTAVE` + `assignAscendingOctaves`
- `renderArpeggio(ctx, notes, layout)` — renders arpeggio notes spaced across the staff

**Design principle:** All geometry derives from the canvas's actual CSS-pixel size, scaled by `lineSpacing` (`= height / 20` for two staves, centered for one). The same code renders cleanly at any size from a 260×65 compact panel to a 1200×600 desktop canvas — there are no fixed pixel constants tied to a 1000×500 layout.

## Canvas Bitmap Sizing (`MusicCanvas.tsx`)

`MusicCanvas` observes its wrapper with a `ResizeObserver` and renders the canvas at its **true on-screen size**:

1. The caller gives the wrapper a definite size via CSS (e.g. `w-full aspect-[2/1]`).
2. On every measurement, the component sets `canvas.style.width/height` to the measured CSS pixels, and `canvas.width/height` (the bitmap) to `cssSize × window.devicePixelRatio`.
3. `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` lets all drawing code keep using CSS-pixel coordinates.
4. `computeLayout({ width: cssW, height: cssH, staves })` derives all geometry from the measured size, then `renderScale` / `renderArpeggio` draws.

This avoids two pitfalls of the old fixed-bitmap + CSS-scale approach: fading 1px staff lines at fractional scale factors, and blurry strokes on HiDPI displays.

## Octave-Aware Note System (`noteOctave.ts`)

`noteOctave.ts` provides absolute pitch representation and Finnish/Helmholtz/SPN formatting for all octaves 0–8. The drawing system supports only the violin range **G3–G6** (one octave below middle C up to the G a minor third above the 3rd-finger G on the E string).

**Key types and functions:**
- `NoteWithOctave` — `{ letter, accidental, octave }` for absolute pitch
- `DIATONIC_INDEX` — maps note letter to diatonic step (C=0 … B=6)
- `OCTAVE_NAMES_FI` — Finnish octave names for all octaves 0–8 (Helmholtz-based)
- `getAbsoluteNoteY(note, staffLineYs)` — computes canvas Y from absolute pitch. Reference: E4 = bottom staff line (staffLineYs[4])
- `formatNoteFi()`, `formatNoteHelmholtz()`, `formatNoteSPN()` — note name formatting
- `VIOLIN_OPEN_STRING_OCTAVES`, `DRAWING_RANGE` — violin-specific constants
- `SCALE_START_OCTAVE` — single source of truth for the starting octave of each scale root; consumed by both `renderScale` and `buildArpeggioNotesWithOctave`
- `isInDrawingRange(note)` — returns true if note is within [G3, G6]
- `assignAscendingOctaves(noteStrings, startOctave)` — assigns octaves to a sequence of letter-only note strings, incrementing the octave whenever the letter wraps past B → C

**Scale and arpeggio rendering:**
- `buildArpeggioNotesWithOctave(scaleNotes, rootKey)` in `practiceMethod.ts` — builds `NoteWithOctave[]` from scale degrees 1, 3, 5, 8, anchored on `SCALE_START_OCTAVE[rootKey]`
- `renderScale(ctx, key, mode, layout)` — builds octave-aware `NoteWithOctave[]` via `assignAscendingOctaves`, then draws each via `drawNoteAt`
- `renderArpeggio(ctx, notes, layout)` — draws arpeggio notes at absolute Y positions using `drawNoteAt`
- `MusicCanvas` accepts `arpeggioNotes?: NoteWithOctave[]` — when provided, renders arpeggio instead of scale

## Canvas Layout

Layout is fully proportional to the measured CSS size; see `computeLayout` in `musicStave.ts` for the exact formulas. For reference, at the canonical desktop size (1000×500, two staves):
- Line spacing: 25 px (= `height / 20`)
- Upper staff lines: y ≈ 95, 120, 145, 170, 195; staff gap 220 px
- Note start x ≈ 115 (= `width × 0.115`), with `(width − noteStartX − endPad) / 7` spacing
- Treble clef ≈ 125 px serif; accidentals ≈ 36 px

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
