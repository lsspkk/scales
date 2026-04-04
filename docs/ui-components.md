# UI Components

## HomeCard

**File:** `app/src/components/ui/HomeCard.tsx`

### Purpose
Large tap-target hub card used on the Home screen to navigate to a section.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `icon` | `React.ReactNode` | SVG icon element (~80px) centered in the card |
| `label` | `string` | Primary section name |
| `subtitle` | `string?` | Optional one-line description below the label |
| `color` | `'brown' \| 'red'` | Palette variant (default `'brown'`) |
| `onClick` | `() => void` | Navigation callback |

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
  label="Section Name"
  subtitle="Short description"
  color="brown"
  onClick={() => setScreen('section')}
/>
```

---

## ScreenHeader

**File:** `app/src/components/ui/ScreenHeader.tsx`

### Purpose
App bar shown at the top of non-hub screens. Provides a back button and the screen title.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Screen title displayed next to the back button |
| `subtitle` | `string?` | Optional smaller text below the title |
| `onBack` | `() => void` | Called when the back button is tapped |
| `color` | `'brown' \| 'red'` | Background palette (default `'brown'`) |

### Design decisions (Task 6)
- **Chevron icon:** inline SVG `<polyline points="15 18 9 12 15 6">` replaces the `←` text character — standard thin-stroke chevron-left used on iOS/Android.
- **44×44px touch target:** the `<button>` is sized `w-11 h-11` (44px) with `flex items-center justify-center` so the tap area meets Apple/Android accessibility minimums without enlarging the visible icon.
- **Left-aligned title:** placed immediately to the right of the chevron (Android convention); no centered title.
- **Header height:** `min-h-[52px]` keeps the bar in the 48–56px range across all content lengths.
- **Hub screen:** the root "Home" screen has no `ScreenHeader` — it shows its own branding title instead.

### Usage example
```tsx
<ScreenHeader
  title="Kirkkosävellajit"
  color="brown"
  onBack={() => setScreen('home')}
/>
```
