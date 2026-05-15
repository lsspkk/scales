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

**Status:** pending
**Blocked by:** Task 20

Fill the timer placeholder in Soittohetki with a procedurally generated, kid-friendly animation that visualises the countdown. No image/video/audio assets, no heavy CPU.

Requirements:

- **Pure CSS animation** (or CSS + a couple of inline SVG shapes) — no canvas redraws per frame, no JS animation loop. Drive progress with a CSS custom property updated from the timer state, or with `animation-duration` set once at start.
- One animation, simple enough that an 8-year-old enjoys watching it: e.g. a flower opening petal-by-petal, a sun rising, a balloon inflating, a path filling around a circle. Pick whichever is easiest to do procedurally — no external assets.
- Must work for any chosen duration (1–10 min). Pausing the timer pauses the animation; resetting rewinds it.
- Must look fine inside the centred mobile viewport at ~390 px wide and also on desktop.

Out of scope: the time-up celebration (Task 22).

---

## Task 22: Time-up celebration animation

**Status:** pending
**Blocked by:** Task 20, Task 21

When the Soittohetki timer reaches zero, play a short (~2–4 s) celebratory animation that signals "you did it!" — again procedurally generated, no assets.

Requirements:

- Triggered by the `onComplete` callback exposed in Task 20.
- Procedurally generated CSS / SVG (e.g. confetti burst from CSS keyframes, expanding rings, a smiley, fireworks made of `radial-gradient` + transforms). No audio for now.
- After the celebration ends, the screen returns to a calm state where the user can pick another duration or hit back.
- Reduced-motion users: respect `prefers-reduced-motion: reduce` and fall back to a static "Valmis!" message.
