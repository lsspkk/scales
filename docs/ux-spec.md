# UX Specification

Read this file before implementing any screen or UI change. It is the source of truth for layout, interaction, and visual rules.

---

## Global Rules

- **Palette:** warm parchment background `#fffbe9`, browns `#5a2d0c` / `#8B4513`, reds `#a0563f` / `#8B2500`. No greys, blues, or cool tones.
- **Touch targets:** minimum 44x44px on all interactive elements (Apple/Android guideline).
- **Typography:** Finnish for all user-facing text. English for code only. Musical terms in Finnish when a clear translation exists.
- **Viewport breakpoint:** 769px. Below = mobile, above = desktop. Use `useViewport()` hook.
- **No scroll on hub screens.** Content screens (Kirkkosavellajit, Harjoittelu info) may scroll vertically.
- **Desktop content containment:** On desktop, only app-level chrome (ScreenHeader) spans full viewport width. All content — including sub-navigation like tabs, toggles, and filters — must live inside the screen's max-width content container (e.g., `max-w-[700px]`). Tabs that stretch edge-to-edge on a wide monitor look disconnected from the content they control. On mobile, full-width tabs are fine because the viewport _is_ the container.

---

## Screen: Home (hub)

**Purpose:** Navigation hub. Two cards, no header bar.

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

**Purpose:** Violin scale practice guide and interactive routine with two sub-views.

```
Mobile (<=768px)                Desktop (>768px)
+---------------------------+   +------------------------------------------+
| < Harjoittelu             |   | < Harjoittelu                            |
|---------------------------|   |------------------------------------------|
| [Tietoa] [Harjoittele]   |   |                                          |
|                           |   |     +-- max 700px, centered ----------+  |
| (tab content, scrollable) |   |     | [Tietoa] [Harjoittele]         |  |
|                           |   |     |                                 |  |
+---------------------------+   |     | (tab content, scrollable)       |  |
                                |     |                                 |  |
                                |     +---------------------------------+  |
                                +------------------------------------------+
```

- **Mobile:** tabs span full width (viewport _is_ the container), content below with `px-4 py-4`
- **Desktop:** tabs sit inside the `max-w-[700px]` centered content container, not at full viewport width. This keeps tabs visually connected to the content they control.

### Sub-view: Tietoa (info page)
- Scrollable content from `docs/scale-practice-method.md`, in Finnish
- Mobile: collapsible accordion sections, >=16px body text
- Desktop: max-width 700px centered, sections default expanded
- Uses `AccordionSection` for grouping

### Sub-view: Harjoittele (practice routine)
- Skill level selector at top
- Scrollable checklist of randomized scales
- Each item >=44px height, tap to mark done, info button on trailing edge
- Progress indicator: "7 / 24 harjoiteltu"
- Done items: visually muted (strikethrough or checkmark)
- Completion: congratulations message + two buttons (repeat same order / roll new)
- State persisted in `practiceStore` (Zustand + localStorage)

#### Info button and detail view
- Each practice item has a circled "i" icon button (44px touch target) at the trailing edge
- **Desktop:** tapping opens a sticky side panel to the right of the list (two-column layout, max-w 900px). Panel shows notes, shift exercise, practice routine, and arpeggio. Empty state: "Valitse asteikko nähdäksesi tiedot"
- **Mobile:** tapping opens a fullscreen modal overlay with close button and browser-back support. Modal header shows scale name and positions.

---

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
