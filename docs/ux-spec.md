# UX Specification

Read this file before implementing any screen or UI change. It is the source of truth for layout, interaction, and visual rules.

---

## Global Rules

- **Palette:** warm parchment background `#fffbe9`, browns `#5a2d0c` / `#8B4513`, reds `#a0563f` / `#8B2500`. No greys, blues, or cool tones. **Exception** (Task 25): the Soittohetki sound row uses olive `#5a6b3d` as its background — an earth-tone complement to the red-brown timer row above it, chosen to read as a separate functional band ("sound" vs "timer") while staying inside the warm earth-tone family.
- **Touch targets:** minimum 44x44px on all interactive elements (Apple/Android guideline).
- **Typography:** Finnish for all user-facing text. English for code only. Musical terms in Finnish when a clear translation exists.
- **Viewport breakpoint:** 769px. Below = mobile, above = desktop. Use `useViewport()` hook.
- **No scroll on hub screens.** Content screens (Kirkkosavellajit, Harjoittelu info) may scroll vertically.
- **Desktop content containment:** On desktop, only app-level chrome (the top navigation bar) spans full viewport width. All content — including sub-navigation like tabs, toggles, and filters — must live inside the screen's max-width content container (e.g., `max-w-[700px]`). Tabs that stretch edge-to-edge on a wide monitor look disconnected from the content they control. On mobile, full-width tabs are fine because the viewport _is_ the container.

---

## Desktop chrome — top navigation bar (Task 23)

**Component:** `DesktopNavBar` (see `docs/ui-components.md`). Rendered once in `App.tsx`, above the route content, on desktop only.

```
+----------------------------------------------------------------------+
| max-w-[1200px] inner container                                       |
| Sävellajit   [ Moodit ]  [ Harjoittelu ]            [Tietoa…]        |
+----------------------------------------------------------------------+
```

- The bar spans full viewport width (brown `#5a2d0c`); its inner content is clamped to `max-w-[1200px]`, so brand/links stay aligned with the screen body.
- Brand "Sävellajit" (`font-medieval`) on the left links to `/`.
- Primary links: **Moodit** → `/moodit`, **Harjoittelu** → `/harjoittelu`, **Virittäminen** → `/virittaminen`. 44px tap targets, visible focus ring, `aria-current="page"` on the active link. Active style: filled red chip + underline.
- Sub-routes highlight their parent: `/harjoittelu/tietoa` keeps **Harjoittelu** active.
- Right side reserved for optional screen-local secondary actions (passed in via the `rightActions` prop). These stay inside the `max-w` container — never flush with the viewport edge.
- **Soittohetki** is a leaf screen and has no entry in the nav.

**Per-screen header on desktop (decision (b)):** Screens skip `ScreenHeader` entirely on desktop. The top bar carries brand + section nav; screen-local titles (e.g. "Tietoa harjoittelusta") and secondary actions (e.g. the info link on Harjoittelu) are rendered inside the content container instead. Mobile keeps the existing `ScreenHeader` with back arrow.

**Mobile header height:** the mobile `ScreenHeader` was shrunk from `min-h-[52px]` / 44px buttons to `min-h-[40px]` / 40px buttons (Task 23) — same brown bar, tighter vertical footprint.

---

## Screen: Virittäminen (production tuner, Task 29)

**Purpose:** Zero-config violin tuner. Route `/virittaminen`, nav/menu title
"Virittäminen", red Home card (gauge icon). Shows only start/stop, the
`TunerDial` (which carries the note + cents readout), and one 5-step
"calmness" slider (`SimpleTunerControls`); **no debug info**. Mobile renders the
red `ScreenHeader`; desktop relies on the nav bar. Full spec, the slider
step→settings mapping, and persistence: `docs/virittaminen.md`.

## Screen: Home (hub)

**Purpose:** Navigation hub. Three cards (Moodit, Harjoittelu, Virittäminen), no header bar.

```
Mobile (<=768px)               Desktop (>768px)
+---------------------------+  +---------------------------------------+
| Sävellajit (title)  |  |        Sävellajit (title)       |
|                           |  |                                       |
| +-------+                 |  |   +-------+          +-------+        |
| | icon  |                 |  |   | icon  |          | icon  |        |
| | Moodit|                 |  |   | Moodit|          | Harj. |        |
| +-------+                 |  |   +-------+          +-------+        |
| +-------+                 |  |                                       |
| | icon  |                 |  +---------------------------------------+
| | Harj. |                 |
| +-------+                 |
+---------------------------+
```

- Mobile: vertical card stack, cards fill available height
- Desktop: horizontal card row, centered
- Cards: `HomeCard` component. Gradient bg, 80px SVG icon, label + subtitle, `active:scale-95` tap feedback
- No `ScreenHeader`. App title "Kirkkosävellajit" as `h1` is sufficient branding.
- Must scale to 3-4 cards without layout redesign

---

## Screen: Kirkkosavellajit (scale viewer)

**Purpose:** Pick a root key and mode, view the scale on a music staff canvas.

```
Mobile (<=768px)                Desktop (>768px)
+---------------------------+   +------------------------------------------+
| < Kirkkosävellajit        |   | < Kirkkosävellajit                       |
|---------------------------|   |------------------------------------------|
| [toggle menu v]           |   | Sidebar(272px) |  Canvas area             |
| [< prev] [next >]        |   | Key buttons    |  +------------------+    |
|                           |   | Mode buttons   |  | 1000x500 canvas  |    |
| +---------------------+  |   | Mode info      |  +------------------+    |
| |   canvas (110% w)   |  |   |                |  Mode alterations text   |
| |   neg left margin   |  |   |                |                          |
| +---------------------+  |   +------------------------------------------+
| Mode alterations text     |
+---------------------------+
```

### Mobile
- `ScreenHeader` with chevron-left back button, brown bg
- Collapsible dropdown for key/mode selection (toggle button)
- Prev/next arrow buttons for quick key/mode cycling
- Canvas: computed from container width, 110% width with negative left margin
- Accidentals: large font sizes (48px bold)
- Mode alterations text below canvas

### Desktop
- `ScreenHeader` full-width, brown bg
- Left sidebar (272px): all key buttons + mode buttons always visible, no toggle
- Canvas: 1000x500px centered in right area
- Accidentals: standard font sizes (36px bold)
- Mode alterations + selection summary next to controls or below canvas

---

## Screen: Harjoittelu (practice)

**Purpose:** Interactive practice routine. Reference material lives on a sibling screen at `/harjoittelu/tietoa`, reached via an info icon in the header.

```
Mobile (<=768px)                Desktop (>768px)
+---------------------------+   +------------------------------------------+
| < Harjoittelu        [i] |   | < Harjoittelu                       [i] |
|---------------------------|   |------------------------------------------|
|                           |   |     +-- max 900px, centered ----------+  |
| (practice list,           |   |     | (practice list + sticky side    |  |
|  scrollable)              |   |     |  panel, scrollable)             |  |
|                           |   |     |                                 |  |
+---------------------------+   |     +---------------------------------+  |
                                +------------------------------------------+
```

- **No tabs.** The practice list is the screen's only content; the info icon in the `ScreenHeader` `action` slot navigates to `/harjoittelu/tietoa`.
- **Mobile:** content below the header with `px-4 pt-3 pb-4`.
- **Desktop:** content sits inside a `max-w-[900px]` centered container so the two-column practice list + side panel fit comfortably.

### Practice routine (the screen body)
- Skill level selector at top (when no session is active)
- Scrollable checklist of randomized scales
- Each item >=44px height, tap to mark done, three launch buttons on the trailing edge: a **diamond** (Jalokiviasteikko gem game), a **star** (Skaalaviritin), and a **person** (Soittohetki) — all pass the same scale params (`root`, `mode`, `octaves`, `level`)
- Progress indicator: "7 / 24 harjoiteltu"
- Done items: visually muted (strikethrough or checkmark)
- Completion: congratulations message + two buttons (repeat same order / roll new)
- State persisted in `practiceStore` (Zustand + localStorage)

#### Per-row info button and detail view
- Each practice item has a circled "i" icon button (44px touch target) at the trailing edge
- **Desktop:** tapping opens a sticky side panel to the right of the list (two-column layout, max-w 900px). Panel shows notes, shift exercise, practice routine, and arpeggio. Empty state: "Valitse asteikko nähdäksesi tiedot"
- **Mobile:** tapping opens a fullscreen modal overlay with close button and browser-back support. Modal header shows scale name and positions.

---

## Screen: HarjoitteluTietoa (practice info)

**Purpose:** Reference material backing the practice routine — the Flesch/Galamian method, level breakdowns, position/shift technique, arpeggios, sources. Reached from the `[i]` action in the Harjoittelu header.

- Title: "Tietoa harjoittelusta", red `ScreenHeader`. Back navigates to `/harjoittelu`.
- Content rendered as `AccordionSection`s; first section (`Harjoitusmenetelmä`) defaults open.
- Mobile: full-width sections, >=16px body text, accordions collapsed by default below the first.
- Desktop: `max-w-[700px]` centered content container.

---

## Screen: Soittohetki (timed practice moment)

**Purpose:** Kid-friendly countdown timer for practicing a single scale. Opened from a row in Harjoittelu's practice list.

```
Mobile (<=768px)                  Desktop (>768px)
+----------------------------+    +------------------------------------------+
| < D-duuri, 2 oktaavia      |    | < D-duuri, 2 oktaavia                    |
|----------------------------|    |------------------------------------------|
| [Asteikko] [Arpeggio]      |    |     +-- max 520px, centered ---------+   |
| +------------------------+ |    |     | [Asteikko] [Arpeggio]         |   |
| |  music canvas 4:1      | |    |     | +-------------------------+   |   |
| +------------------------+ |    |     | |  music canvas 4:1       |   |   |
| D - E - F# - G - A - B    |    |     | +-------------------------+   |   |
| +------------------------+ |    |     | +-------------------------+   |   |
| | pelican animation      | |    |     | | pelican animation       |   |   |
| +------------------------+ |    |     | +-------------------------+   |   |
| [1][3][5][10] 3:00 [▶]    |    |     | [1][3][5][10] 3:00 [▶]       |   |
| [🔊===●===] [Sample ▾]    |    |     | [🔊===●===] [Sample ▾]       |   |
| [ D ][DMaj][DMaj7]         |    |     | [ D ][DMaj][DMaj7]           |   |
+----------------------------+    +------------------------------------------+
```

- `ScreenHeader` (red), title = scale label (e.g. "D-duuri, 2 oktaavia"). Back navigates to `/harjoittelu`.
- URL: `#/soittohetki?root=D&mode=ionian&octaves=2&min=3` — see `docs/soittohetki.md` for the param spec.
- **Asteikko / Arpeggio toggle:** local state, swaps the canvas between scale notes (`getScale()`) and tonic arpeggio (`buildArpeggioNotesWithOctave()`).
- **Note text** under the canvas: scale notes joined with " – ", or arpeggio note letters + accidentals (octave dropped).
- **Duration chips:** circular buttons (~44px), numeric only (1 / 3 / 5 / 10). Disabled while running.
- **Play / Pause / Reset:** icon-only round buttons in the same row as the chips. Play swaps to Pause while running. Reset appears once the timer has moved off its initial state.
- **Pelican animation:** procedural CSS pelican (timer variants) / celebration (time-up variants). Sits between the canvas note row and the timer-controls row.
- **Sound row (Task 25):** olive background `#5a6b3d` to distinguish it from the red-brown timer row above. Holds the volume slider, sample picker, and tonic-drone + diatonic chord suggestions. Details + full selection-to-playback wiring in `docs/soittohetki.md`.

---

## Screen: Jalokiviasteikko (gem-necklace scale game, Task 34)

**Purpose:** Play the scale up-and-down in tune; the gem necklace records how well each note was played (better intonation = a more vivid, better-polished gem). Opened from a diamond button in the Harjoittelu practice list. Full spec: `docs/jalokiviasteikko.md` + `docs/game-necklace-in-tune-step.md`.

```
Mobile (<=768px) / Desktop — dark (#05060f), no scroll
+----------------------------------+
| < C-duuri · 8 nuottia       [i]  |  slim fixed header
|----------------------------------|
|              4                   |  count-in number (focal centre)
|            C                     |  note identifier (above active gem)
|        (  ( o )  )                |  necklace ring — the hero; active gem
|        gem  gem  gem              |  spun to front + breathing focus ring
|----------------------------------|
| -12 |░░░▓▓▓▓▓░░░|        2.1s     |  tuning bar (active in the window)
+----------------------------------+
```

- **Dark theme**, mobile-first, fills the viewport with no scroll (mirrors the `NecklaceCanvas` hero from `#/test/necklace`).
- **Slim header:** scale name + note count (static) and an info `[i]` button. The info dialog **pauses the whole round** and resumes from the same phase on close.
- **Necklace** (`NecklaceCanvas` + game `overlay`): the active socket spins to the front with a **breathing focus ring**; a soft, low-contrast **note letter** mists in above it once the evaluation window opens; the round starts with a `4 3 2 1` count-in in the ring centre.
- **Tuning bar** (`TuningBar`): full-width bottom strip — live cents readout (left), sliding needle over a shaded good zone, phase timer (right). Disabled between notes; on a poor result it yields its space to a neutral message (`En kuullut kunnolla nuottia C.`) for ~1 s.
- **Idle prompt:** instruction text over a decorative full necklace with an **Aloita** button. **End of round:** the finished necklace plus a 20 s auto-replay countdown, a **Jää ihailemaan** button to cancel it, and an auto-replay toggle.
- URL params match Soittohetki/Skaalaviritin: `?root=C&mode=ionian&octaves=1&level=1`. Sensitivity is inherited from the persisted `tunerStore` (no on-screen slider in MVP).

## Shared Components

| Component | When to use | Key rules |
|-----------|------------|-----------|
| `ScreenHeader` | Top of every non-hub screen | Chevron-left back, 44px touch target, left-aligned title, 52px min height |
| `HomeCard` | Hub screen navigation only | Gradient bg, 80px icon, label+subtitle, scale-95 active state |
| `SectionCard` | Grouping related controls or content | Brown border, parchment bg |
| `Button` | Key/mode selection | `variant="note"` for keys, `variant="mode"` for modes |
| `Chip` / `ModeChip` | Compact info display | Mode names, alteration badges |
| `MobileShell` | Mobile only wrapper | 390px centered column. **Never render on desktop.** |

---

## Adding a New Screen

1. Add entry to this file with ASCII layout for both mobile and desktop
2. Create screen in `app/src/screens/`, named export, lazy-loaded in `App.tsx`
3. Use `ScreenHeader` (unless it's a hub screen)
4. Branch layout on `isDesktop` from `useViewport()`
5. Update `docs/ui-components.md` if new shared components are created
