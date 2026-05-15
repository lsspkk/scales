# Soittohetki Animations

Procedural SVG/CSS animations used on the Soittohetki screen. Design concepts and the shared pelican rig blueprint live in [`animation-ideas.md`](animation-ideas.md); this document covers the actual implementation.

## Files

- `app/src/components/animations/PelicanTimer.tsx` — the timer animation (Task 21). Exports `PelicanTimer`, the `PelicanTimerVariant` union, and the `WalkingPelicanSvg` / `FlyingPelicanSvg` rigs (reused by the celebration).
- `app/src/components/animations/PelicanCelebration.tsx` — the time-up celebration (Task 22). Exports `PelicanCelebration` and the `PelicanCelebrationVariant` union.
- `app/src/index.css` — all pelican keyframes and scene styles (timer + celebration). Custom `@keyframes` cannot be expressed as Tailwind utilities, so they live in the global stylesheet.
- `app/src/screens/AnimationTest.tsx` — hidden debug screen at `#/dev/animation/timer`.
- `app/src/screens/CelebrationAnimationTest.tsx` — hidden debug screen at `#/dev/animation/celebration`.

## PelicanTimer component

```tsx
<PelicanTimer
  variant='walking' // or "flying"
  durationMs={180_000} // full-cycle duration
  isRunning={true} // false → animation-play-state: paused
/>
```

The component renders one of two pelican scenes, both built from the same SVG rig (body / head / neck / bill / pouch / wing / legs) but in different poses.

### Driving progress

Each scene exposes `--duration` as a CSS variable. The one-shot progress animations (`pelican-walk-across`, `pelican-fly-arc`, `ground-scroll`, `cloud-drift`, `sun-arc`) read `var(--duration)` for their `animation-duration` and use `animation-fill-mode: forwards` to hold the final frame. Looping sub-animations (waddle, leg swing, wing flap, pouch swing) run independently at fixed periods.

Both timer variants also expose staged shade timings. A brown tint matching the app's text/navigation brown (`#5a2d0c`) sits over the scene at the start, then fades slowly for most of the countdown and noticeably faster during the final 20 seconds so the full color arrives near the end.

Ground and water surface textures are intentionally decoupled from the full countdown pace so they read as fast local procedural motion. Their speed is now fixed and does not scale with the chosen timer duration.

### Pause / resume

`isRunning === false` adds an `is-paused` class to the scene root. CSS sets `animation-play-state: paused !important` on the root and all descendants, freezing every animation at its current frame. Going back to `isRunning === true` resumes from the same frame — no JS state needed.

### Reset / duration change

CSS animations cannot be rewound declaratively. The parent (`Soittohetki.tsx`) tracks a `runId` counter that increments when the user clicks reset or picks a new duration, and uses `<PelicanTimer key={`${variant}-${durationMs}-${runId}`} ... />` so React unmounts and remounts the scene. The fresh instance starts every keyframe at 0.

### Transform-origin (anatomical pivots)

The pelican rig uses SVG groups with `transform-box: fill-box` so CSS `transform-origin` percentages refer to each group's own bounding box. Anatomical pivots are set as overrides (`app/src/index.css`):

| Part                  | `transform-origin` | Pivots around                       |
| --------------------- | ------------------ | ----------------------------------- |
| `.pelican-leg`        | `50% 0%`           | Hip (top-centre of the leg group)   |
| `.pelican-pouch`      | `50% 0%`           | Where the pouch meets the bill      |
| `.pelican-bill`       | `0% 50%`           | Where the bill attaches to the head |
| `.pelican-wing`       | `100% 50%`         | Shoulder (right edge in glide pose) |
| `.pelican-body-group` | default (`center`) | Centre of body for the waddle       |

For positioning, each rotatable part is wrapped in an **outer** `<g transform="translate(...)">` that places its local origin at the anatomical pivot in viewBox units, and an **inner** `<g>` that carries the CSS animation. This separates static placement (SVG `transform` attribute) from animated rotation (CSS `transform` property) — neither overrides the other.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` disables every pelican animation. The bird is still visible, just static — the timer countdown text in `Soittohetki.tsx` continues to convey progress.

## Variants

### Walking pelican (default)

Pelican waddles from left to right while a textured ground strip scrolls beneath. Sun sits in the top-right. Sub-loops: body waddle (0.6 s), opposing leg swings (0.6 s, phase-offset), pouch pendulum (0.6 s), bill bob (1.2 s), full-body bob (0.6 s).

### Flying pelican

Pelican glides across the sky on a gentle arc (`translate` keyframes) above a visible sea band that matches the flying celebration scene. The sea now shimmers continuously, and the sun rises out of the sea toward the same upper-right position used by the flying celebration. Three clouds drift past at different vertical bands and phase offsets. Sub-loop: wing flap (1.4 s) pivoting at the shoulder, with a slow body soar (2.2 s).

## Hidden debug route

`#/dev/animation/timer` — explicitly marked `DEBUG / TEST ROUTE` in `App.tsx` and `AnimationTest.tsx`. Not linked from anywhere in the UI. Lets you:

- Toggle between walking / flying variants.
- Pick short durations (10 s, 30 s, …) for fast visual iteration.
- Pause/resume and restart without leaving the page.

Deep-link via query params: `#/dev/animation/timer?variant=flying&ms=15000`.

## PelicanCelebration component

```tsx
<PelicanCelebration
  variant='walking' // or "flying"
  durationMs={3000} // optional, default 3000
/>
```

Plays once when the timer reaches zero. The Soittohetki screen renders it in place of `PelicanTimer` while `showCelebration === true`. The state is set by the `onComplete` callback passed to `useCountdownTimer`, and cleared by Start, Reset, or a duration change.

### Variants

- **Walking celebration** — pairs with the walking timer. Pelican stays centred on the ground strip and does a fast proud bounce (`pelican-proud-bounce`, 0.5 s loop) while the pouch swings and the bill bobs. Twelve confetti pieces fall from the top with staggered delays. A pulsing sun and a static "Valmis!" heading appear above the bird.
- **Flying celebration** — pairs with the flying timer. Pelican glides in, tilts down, dives along a one-shot `pelican-dive-sequence` keyframe (translate + rotate), wings fold via `pelican-wing-fold`, a `splash-burst` ring expands at impact, and the bird rises back up with a tiny procedural fish visible in its beak.

### Static end state

Each celebration's one-shot keyframes use `animation-fill-mode: forwards`, so the final frame (pouch inflated, bird settled, "Valmis!" text visible) stays visible until the user interacts. Reset, duration changes, view-toggle buttons, and navigation away clear it immediately.

### Reduced motion

The shared `@media (prefers-reduced-motion: reduce)` rule disables every pelican animation. The `Valmis!` heading is laid out with non-animated default styles (translate, full opacity, full scale), so it remains visible as a static success message.

### Hidden debug route

`#/dev/animation/celebration` — explicitly marked `DEBUG / TEST ROUTE` in `App.tsx` and `CelebrationAnimationTest.tsx`. Not linked from anywhere in the UI. Lets you toggle variant, change duration, and replay the animation. Deep-link via query params: `#/dev/animation/celebration?variant=flying&ms=5000`.
