# UI Components

## HomeCard

**File:** `app/src/components/ui/HomeCard.tsx`

### Purpose

Large tap-target hub card used on the Home screen to navigate to a section.

### Props

| Prop       | Type               | Description                                   |
| ---------- | ------------------ | --------------------------------------------- |
| `icon`     | `React.ReactNode`  | SVG icon element (~80px) centered in the card |
| `label`    | `string`           | Primary section name                          |
| `subtitle` | `string?`          | Optional one-line description below the label |
| `color`    | `'brown' \| 'red'` | Palette variant (default `'brown'`)           |
| `onClick`  | `() => void`       | Navigation callback                           |

### Design decisions (Task 5)

- **Icons:** Inline SVG passed as `React.ReactNode` so each call site controls the artwork. Icons are defined as constants in `Home.tsx` (book-with-note for Kirkkosävellajit, violin for Harjoittelu).
- **Solid gradient background** replaces the previous dashed border / transparent background to give the card visual weight.
- **Shadow:** `shadow-[0_4px_16px_...]` creates depth; active state halves shadow and scales card to 95% for clear tap feedback via `active:scale-95`.
- **No `max-h-40` cap** — cards grow to fill the flex container, so adding a 3rd or 4th card in the future requires no layout changes.
- **Subtitle** rendered with `opacity-80` and smaller font size to maintain clear typographic hierarchy without extra components.

### Usage example

```tsx
<HomeCard
  icon={<MyIcon />}
  label='Section Name'
  subtitle='Short description'
  color='brown'
  onClick={() => setScreen('section')}
/>
```

---

## AccordionSection

**File:** `app/src/components/ui/AccordionSection.tsx`

### Purpose

Section wrapper that collapses/expands on mobile and stays always-open on desktop.

### Props

| Prop          | Type              | Description                                                                                          |
| ------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `title`       | `string`          | Section heading                                                                                      |
| `children`    | `React.ReactNode` | Section content                                                                                      |
| `defaultOpen` | `boolean?`        | Whether the section starts open on mobile (default `false`)                                          |
| `isMobile`    | `boolean`         | When `true`, renders as collapsible accordion; when `false`, renders as a plain section with heading |

### Design decisions (Task 10)

- **Mobile:** collapsible `<button>` header with parchment bg (`#f5e9cc`) and ▲/▼ indicator. Min-height 44px for touch target. Content hidden/shown by local `useState`.
- **Desktop:** no toggle — renders an `<h2>` heading with a brown border-bottom and always-visible content.
- **`isMobile` prop** (not `isDesktop`) makes the condition read naturally at the call site: `isMobile={!isDesktop}`.

### Usage example

```tsx
const { isDesktop } = useViewport()
<AccordionSection title="Lähteet" isMobile={!isDesktop}>
  <p>...</p>
</AccordionSection>
```

---

## ScreenHeader

**File:** `app/src/components/ui/ScreenHeader.tsx`

### Purpose

App bar shown at the top of non-hub screens. Provides a back button and the screen title.

### Props

| Prop       | Type                                                       | Description                                                                                                          |
| ---------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `title`    | `string`                                                   | Screen title displayed next to the back button                                                                       |
| `subtitle` | `string?`                                                  | Optional smaller text below the title                                                                                |
| `onBack`   | `() => void`                                               | Called when the back button is tapped                                                                                |
| `color`    | `'brown' \| 'red'`                                         | Background palette (default `'brown'`)                                                                               |
| `action`   | `{ icon: ReactNode; label: string; onClick: () => void }?` | Optional trailing action button on the right edge (e.g. info link). 44×44px touch target, `aria-label` from `label`. |

### Design decisions (Task 6)

- **Chevron icon:** inline SVG `<polyline points="15 18 9 12 15 6">` replaces the `←` text character — standard thin-stroke chevron-left used on iOS/Android.
- **44×44px touch target:** the `<button>` is sized `w-11 h-11` (44px) with `flex items-center justify-center` so the tap area meets Apple/Android accessibility minimums without enlarging the visible icon.
- **Left-aligned title:** placed immediately to the right of the chevron (Android convention); no centered title.
- **Header height:** `min-h-[52px]` keeps the bar in the 48–56px range across all content lengths.
- **Hub screen:** the root "Home" screen has no `ScreenHeader` — it shows its own branding title instead.
- **Trailing action:** kept to a single optional icon button so the header stays scannable. Use it for navigation to a sibling/sub screen (e.g. Harjoittelu → Tietoa harjoittelusta), not for primary actions on the current screen.

### Usage example

```tsx
<ScreenHeader
  title="Sävellajit"
  color="brown"
  onBack={() => setScreen('home')}
/>

<ScreenHeader
  title="Harjoittelu"
  color="red"
  onBack={() => navigate('/')}
  action={{ icon: InfoIcon, label: 'Tietoa harjoittelusta', onClick: () => navigate('/harjoittelu/tietoa') }}
/>
```

---

## ScaleDetailPanel

**File:** `app/src/components/ui/ScaleDetailPanel.tsx`

### Purpose

Renders detailed practice guidance for a single scale. The Nuotit section shows a compact `MusicCanvas` (260×130, single stave) with note names as small helper text below. Also displays shift exercise, 4-step practice routine, and arpeggio info. Used in both the desktop side panel and mobile modal.

### Props

| Prop          | Type                     | Description                                                                                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `detail`      | `ScaleDetail`            | Detail data generated by `getScaleDetail()` from `practiceMethod.ts`                                                                                         |
| `hiddenNotes` | `ReadonlyArray<string>?` | Optional pitch-class strings (e.g. `["F#", "B"]`) to draw at 10% opacity in both the scale and arpeggio canvases when a caller wants note-dimming behaviour. |

---

## ScaleDetailModal

**File:** `app/src/components/ui/ScaleDetailModal.tsx`

### Purpose

Fullscreen modal overlay for mobile that shows scale detail content. Closes via X button or browser back navigation (pushes a history entry on mount).

### Props

| Prop       | Type         | Description                                      |
| ---------- | ------------ | ------------------------------------------------ |
| `title`    | `string`     | Modal header text (scale name + positions)       |
| `children` | `ReactNode`  | Content to render (typically `ScaleDetailPanel`) |
| `onClose`  | `() => void` | Called when modal is dismissed                   |

---

## DesktopNavBar

**File:** `app/src/components/ui/DesktopNavBar.tsx`

### Purpose

Persistent top navigation bar shown on desktop (≥769px) only. Replaces the per-screen `ScreenHeader` as the chrome carrying the brand and top-level navigation. Rendered once in `App.tsx`, above `<Routes>`.

### Props

| Prop           | Type         | Description                                                                                                                       |
| -------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `rightActions` | `ReactNode?` | Optional screen-local secondary actions (rarely used — most screens render their own actions inline in the content area instead). |

### Behaviour

- Brand "Sävellajit" (`font-medieval`, links to `/`).
- Two primary links — **Moodit** (`/moodit`) and **Harjoittelu** (`/harjoittelu`) — rendered as `<Link>` with `min-h-[44px]`, visible focus rings, and `aria-current="page"` on the active route.
- Active matching: exact path or `pathname.startsWith(to + '/')`, so `/harjoittelu/tietoa` highlights "Harjoittelu".
- Full-bleed brown bar; inner content clamped to `max-w-[1200px]` so brand/links don't drift to the corners on wide monitors.
- Not rendered on mobile. Soittohetki is a leaf screen and has no nav entry.

### Design decisions (Task 23)

- **Decision (b)** for per-screen headers: screens omit `ScreenHeader` on desktop and render their own title/actions inside the content container. The nav bar is the only piece of chrome with viewport-spanning background.
- **Mobile chrome unchanged** apart from `ScreenHeader` shrinking from `min-h-[52px]`/44px buttons to `min-h-[40px]`/40px buttons (user feedback: navbar was too tall on mobile).

---

## VolumeSlider

**File:** `app/src/components/ui/VolumeSlider.tsx`

### Purpose

YouTube-style horizontal volume control. Used in the Soittohetki sound row to drive the audio engine's master gain.

### Props

| Prop        | Type                      | Description                                         |
| ----------- | ------------------------- | --------------------------------------------------- |
| `value`     | `number`                  | Current volume, `0..1`.                             |
| `onChange`  | `(value: number) => void` | Fires on every drag tick and on mute-toggle clicks. |
| `className` | `string?`                 | Outer wrapper className (e.g. `flex-1`).            |

### Behaviour

- Left: a 36×36 round button with a speaker icon (`Volume2` when audible, `VolumeX` when muted). Tap to mute/unmute. The component remembers the last non-zero value, so unmute restores it.
- Right: a native `<input type="range">` (0–100) styled with `accent-color: white` so the filled portion reads on a coloured background (Soittohetki sound row is olive).
- Stateless: the parent owns the value. The component only tracks the "last non-zero" reference internally for unmute.
- ARIA: speaker button has `aria-label='Mykistä'/'Avaa ääni'`; slider has `aria-label='Äänenvoimakkuus'`.

### Design decisions (Task 25)

- **Native `<input type="range">` over a custom drag handler:** built-in keyboard support, touch-friendly thumb, no rAF loop. The visual styling we need (track + filled portion) is delivered by `accent-color`.
- **Parent owns value:** the volume number lives where the audio engine call lives. The component is a pure controlled input — easier to wire into `setMasterVolume` and to initialise from `getMasterVolume()`.
- **Speaker icon button separate from the track:** explicit tap target (36×36) larger than a slider thumb, so quick mute/unmute is reliable on mobile.

---

## MarqueeText

**File:** `app/src/components/ui/MarqueeText.tsx`

### Purpose

Calm "digital display" right-to-left marquee for inline text that may or may not overflow its container. The animation only engages when the rendered span is wider than the wrapper — otherwise the text sits still. Used by the Soittohetki scale-note row (Task 26) so a long Finnish instruction like "Neljäsosa + kaksi kahdeksasosaa" can scroll inside the narrow row below the scale canvas.

### Props

| Prop            | Type      | Description                                                              |
| --------------- | --------- | ------------------------------------------------------------------------ |
| `text`          | `string`  | The text to display.                                                     |
| `className`     | `string?` | Additional classes for the outer wrapper (typically font size + colour). |
| `speedPxPerSec` | `number?` | Scroll speed once engaged. Default `30` (≈ "slow and readable").         |

### Behaviour

- A `ResizeObserver` watches both the wrapper and inner span. When `inner.scrollWidth > wrapper.clientWidth`, the component sets `--marquee-distance` (in px) on the wrapper and adds `marquee-on`, which triggers the `marquee-scroll` keyframe defined in `app/src/index.css`.
- The keyframe holds at the start and the end for ~8% of the duration each so the user can read both edges without it racing back instantly.
- Direction is right-to-left only (`translateX(-distance)`); duration is computed from `distance / speedPxPerSec` and floors at 6 s.

### Design decisions (Task 26)

- **CSS keyframe + observed overflow, not a JS rAF loop.** Cheap, runs only when needed, and pauses cleanly on `prefers-reduced-motion` if we extend the rule later.
- **Wrapper is `overflow-hidden whitespace-nowrap`**, the inner span is `inline-block`. That isolates the marquee from line-wrap behaviour of the surrounding flex/grid container.
- **One CSS custom property carries the distance** (`--marquee-distance`) so the keyframe is generic and reusable; no per-string tweaking.

## SimpleTunerControls (Task 29)

**File:** `app/src/components/ui/SimpleTunerControls.tsx`

The production tuner's only control — a single 5-step "calmness" slider. Distinct
from the four-knob `TunerControls`, which stays test-page-only.

### Props

| Prop       | Type                     | Description                                                          |
| ---------- | ------------------------ | -------------------------------------------------------------------- |
| `calmness` | `number`                 | Current step, 1 (Nopea) .. 5 (Hidas).                                |
| `onChange` | `(step: number) => void` | Set a new step (wired to `tunerStore`).                              |
| `onReset`  | `() => void`             | Restore the default step (button disabled while already at default). |

### Design decisions

- **One slider, calming-only.** It drives just the smoothing stage
  (`smoothingFrames` / `confirmFrames`); gating is pinned permissive. Higher =
  calmer, never pickier. Step→settings mapping + rationale live in
  `docs/virittaminen.md` and `docs/tuner-pitch-detection.md`.
- **Finnish labels:** title **Herkkyys**, ends **Nopea** / **Hidas**,
  reset button **Oletus**. Value persists via `tunerStore`.
