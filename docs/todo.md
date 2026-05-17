# Todo

Active task list. Completed tasks are archived in `completed-tasks.md`; a one-line summary of each is in `log.md`. Unprioritised future ideas live in `ideas.md`.

---

## Task 20: Soittohetki screen — entry point, routing, and timer controls

**Status:** done

Create a new screen `Soittohetki` ("playing moment") that opens from the practice list in Harjoittelu. The kid sits down with the violin, picks a duration, hits start, and plays the scale until the timer runs out.

Requirements:

1. **Entry point** — next to the existing info button on each practice-list row in `Harjoittelu.tsx` (see `app/src/screens/Harjoittelu.tsx:498-515`), add a second round button that opens Soittohetki for that scale. Use a **human-figure icon** (e.g. a simple stick figure / standing person SVG drawn inline in the same style as the existing `i` button — no icon-font dependency, no new asset). Same 40×40 target, same colour tokens.
2. **Route / link shape** — opening Soittohetki updates the URL so it can be deep-linked and survives back-navigation. Hash-style is fine, e.g. `#/soittohetki?root=D&mode=2&octaves=2` where:
   - `root` — root note letter (with optional `#`/`b`)
   - `mode` — mode number **or** name (decide one and stick with it — keep it readable for a human reading the URL)
   - `octaves` — integer octave count (1, 2, or 3)
     Add this screen to the router/screen-switch the same way `Kirkkosavellajit` and `Harjoittelu` are wired.
3. **Screen layout** — mobile-first, kid-friendly:
   - Top: `ScreenHeader` with back button and the scale label (e.g. "D-duuri, 2 oktaavia")
   - Middle: large central area reserved for the timer animation (Task 21 will fill this — leave a clearly sized placeholder box)
   - Below the timer: **duration picker** with big tap targets — 3–5 preset chips (e.g. 1 min / 3 min / 5 min / 10 min). One chip selected at a time. No free-text input, no tiny number stepper.
   - Big **Start / Pause / Reset** button below the picker. One primary button at a time (Start → swaps to Pause when running → Reset shown alongside when paused/finished). Use the existing `Button` component and brown/red palette.
4. **Timer logic** — pure `setInterval`/`requestAnimationFrame` countdown in component state (no Zustand needed yet). Exposes `remainingMs`, `isRunning`, and a callback fired once when it hits zero (so Task 22 can hook the time-up animation in). Keep it in `app/src/lib/` if it grows past ~30 lines, otherwise inline.
5. **Out of scope for this task** — the animations themselves (Tasks 21 and 22), drone/metronome audio, variations, persisting completed sessions.

### Files

- `app/src/screens/Soittohetki.tsx` (new)
- `app/src/screens/Harjoittelu.tsx` — add the second icon button
- `app/src/App.tsx` (or wherever the screen-switch lives) — register the route
- One small SVG human-figure icon, inline in the button (no new file)

---

## Task 21: Procedural timer animation for Soittohetki

**Status:** done
**Blocked by:** Task 20
**Reference:** `docs/animation-ideas.md` — contains the agreed pelican-theme structure: two timer variants and two celebration variants, implemented in sequence from walking-based motion first to flying/fishing-based motion second.

Fill the timer placeholder in Soittohetki with a procedurally generated, kid-friendly animation that visualises the countdown. No image/video/audio assets, no heavy CPU.

Requirements:

- **Pure CSS animation** (or CSS + a couple of inline SVG shapes) — no canvas redraws per frame, no JS animation loop. Drive progress with a CSS custom property updated from the timer state, or with `animation-duration` set once at start.
- **Two timer variants, same theme** — implement two distinct pelican-themed timer animations, not one-off unrelated ideas:
  1.  **Walking / waddling timer** — this is the first variant and must be completed first.
  2.  **Flying / gliding timer** — this is the second variant and must reuse the same pelican design language.
- **Separate implementation file** — the timer animation must live in its own clearly named file/component instead of being embedded directly in `Soittohetki.tsx`. Keep the animation logic/styles isolated so it can be iterated on independently.
- The two timer variants should reuse the same pelican rig/theme where practical, differing mainly in motion profile and scene treatment.
- Must work for any chosen duration (1–10 min). Pausing the timer pauses the animation; resetting rewinds it.
- Must look fine inside the centred mobile viewport at ~390 px wide and also on desktop.
- **Hidden test URL** — add a direct route/URL for previewing this animation alone in a correctly sized demo container that matches the Soittohetki timer area. This route must be intentionally not linked from the UI, but clearly marked in code with an obvious comment such as `DEBUG / TEST ROUTE`. Example shape: `#/dev/animation/timer`.
- The hidden test route should make it easy to preview **both timer variants**, for example by a clearly marked query param / route segment / local switch in code.

Out of scope: the time-up celebration (Task 22).

### Files

- `app/src/...` one dedicated file for the timer animation component
- Router / screen-switch registration for the hidden test URL

---

## Task 22: Time-up celebration animation

**Status:** done
**Blocked by:** Task 20, Task 21
**Reference:** `docs/animation-ideas.md` — the pelican theme now defines two ending variants that pair with the two timer variants: a walking-theme finish first, then a flying/fishing success sequence second.

When the Soittohetki timer reaches zero, play a short (~2–4 s) celebratory animation that signals "you did it!" — again procedurally generated, no assets.

Requirements:

- Triggered by the `onComplete` callback exposed in Task 20.
- Procedurally generated CSS / SVG (e.g. confetti burst from CSS keyframes, expanding rings, a smiley, fireworks made of `radial-gradient` + transforms). No audio for now.
- **Two celebration variants, same theme** — implement two distinct pelican-themed ending animations:
  1.  **Walking-theme happy finish** — the first ending variant, paired with the walking timer.
  2.  **Flying / fishing success ending** — the second ending variant, paired with the gliding/flying timer.
- **Separate implementation file** — the celebration animation must live in its own clearly named file/component, separate from the timer animation file and separate from `Soittohetki.tsx`.
- The two ending variants should feel like part of the same pelican world, reusing the same character rig / colors / scene language wherever possible.
- After the celebration ends, the screen returns to a calm state where the user can pick another duration or hit back.
- Reduced-motion users: respect `prefers-reduced-motion: reduce` and fall back to a static "Valmis!" message.
- **Hidden test URL** — add a second direct route/URL for previewing only the celebration animation inside a Soittohetki-sized demo container. This route must not be discoverable by clicking in the app, but it should be clearly labelled in code with an obvious comment such as `DEBUG / TEST ROUTE`. Example shape: `#/dev/animation/celebration`.
- The hidden test route should make it easy to preview **both celebration variants**, for example by a clearly marked query param / route segment / local switch in code.

### Files

- `app/src/...` one dedicated file for the celebration animation component
- Router / screen-switch registration for the hidden test URL

---

## Task 23: Desktop navigation — proper top bar / menu

**Status:** done

Today the desktop UI reuses the mobile chrome verbatim: a single `ScreenHeader` with a back arrow + title spans the full viewport, content is constrained to 700–900px below it, and the only navigation between top-level screens is "back to Home, then pick another card." The recently added info action (`/harjoittelu/tietoa`) is a 24px icon parked on the far right edge of a 1900px-wide bar — visually disconnected from the title it belongs to and easy to miss. The mobile back-stack metaphor doesn't carry its weight on a wide viewport.

Goal: a persistent desktop navigation that makes the top-level destinations (Kirkkosävellajit, Harjoittelu) visible and one-click reachable from any screen, with screen-local actions (info, back) sitting near the content they relate to instead of pinned to the viewport edges. Mobile chrome stays as-is.

### Requirements

1. **Desktop top bar (≥769px only).** Render above (or replacing) the current per-screen `ScreenHeader`. Contains:
   - App brand on the left (text "Kirkkosävellajit" in `font-medieval`, links to `/`). No logo asset needed.
   - Primary nav links: **Sävellajit** (`/moodit`), **Harjoittelu** (`/harjoittelu`). Active route visually highlighted (underline / brown bar / filled chip — pick one and apply consistently). 44px tap targets.
   - Right side reserved for screen-local secondary actions when relevant (e.g. the "Tietoa harjoittelusta" link for Harjoittelu). These appear/disappear per route, but live inside the `max-w` content container — not flush with the viewport edge.
2. **Per-screen header.** Decide one of:
   - (a) Keep `ScreenHeader` for screen titles but drop its back arrow on desktop (the top bar covers nav), or
   - (b) Move titles into the content area and remove `ScreenHeader` entirely on desktop.
     Pick whichever keeps the visual hierarchy cleanest — document the choice in `ux-spec.md`. Mobile keeps the existing `ScreenHeader` with back arrow.
3. **Containment.** The top bar is the one piece of chrome allowed to span the full viewport (per the existing rule in `ux-spec.md`), but its inner content (brand, links, actions) must align to the same `max-w` container as the screen body — so on a wide monitor the brand and nav don't drift to the corners.
4. **Sub-routes.** `/harjoittelu/tietoa` should highlight "Harjoittelu" as active (it's a child of that section). The Tietoa screen's own header/back can simplify accordingly.
5. **Soittohetki** is a leaf screen reached from the practice list, not a top-level destination — it should not appear in the nav. Its own back behaviour (returning to `/harjoittelu`) stays intact.
6. **Mobile (≤768px) is unchanged.** No top bar, no behavioural regression on the existing mobile screens. Use `useViewport()` to branch.
7. **Keyboard / a11y.** Nav links are `<a>`/`<Link>` elements with visible focus rings. Active link uses `aria-current="page"`.

### Out of scope

- Visual redesign of the screens themselves (colour palette, card layouts, typography). This task is about the chrome only.
- Mobile navigation changes (any "hamburger menu" idea belongs in `ideas.md`, not here).
- Theming / dark mode.

### Files (likely)

- `app/src/components/ui/DesktopNavBar.tsx` (new) — the top bar component
- `app/src/App.tsx` — render the nav bar above `<Routes>` on desktop
- `app/src/screens/Harjoittelu.tsx`, `HarjoitteluTietoa.tsx`, `Kirkkosavellajit.tsx`, `Soittohetki.tsx` — adjust per-screen `ScreenHeader` usage on desktop
- `app/src/components/ui/ScreenHeader.tsx` — possibly accept a "desktop variant" or be skipped on desktop
- `docs/ux-spec.md` — add a "Desktop chrome" section + ASCII diagram, update each screen's desktop layout
- `docs/ui-components.md` — document the new component
