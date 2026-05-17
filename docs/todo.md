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

---

## Task 24: Polyphonic sample-based audio engine + chord drone test page

**Status:** pending
**Reference:** `docs/audio-research.md` — initial options, pitch math at A=442, chord interval table, open questions. Read it before designing the service.

Three one-note sample files currently sit in `app/public/` (`major-pad.mp3`, `major-space.mp3`, `minor-space.mp3`). Build the foundation that turns them into a small polyphonic drone engine: one decoded sample, pitch-shifted into 3–4 simultaneous voices that together spell a named chord. Anchor tuning to **A = 442 Hz**. This engine is the basis for a future "drone background" in Soittohetki, but this task only delivers the engine + a hidden test page — no Soittohetki integration yet.

The task is intentionally broad. Implementation is expected to make architecture choices (Web Audio direct vs. a tiny wrapper, envelope shape, filename-encoded vs. manifest-only metadata, etc.) — `audio-research.md` lists the open questions and constraints. The final architecture doc is a deliverable (see Requirement 5).

### Requirements

1. **Phase 0 — Pitch detector + sample organization.** Build the detection tool first; use it to identify the existing samples; then rename and move them.
   - **Portable pitch-detection algorithm** in `app/src/lib/audio/pitchDetect.ts`. Pure function over a `Float32Array` of mono PCM samples + a `sampleRate` — returns at minimum `{ hz, midi, noteName, cents, confidence }`. **No browser-only or Node-only imports inside this file** — same code must run in both. Algorithm choice is open (YIN is the obvious candidate for sustained monophonic samples; autocorrelation and FFT peak picking are simpler fallbacks — pick one, document why in the final architecture doc).
   - **Tuning anchor** uses the same A = 442 Hz constant from `lib/audio/tuning.ts` (Phase 1) so detected pitch agrees with the playback engine.
   - **Node CLI wrapper** as a script in the repo (e.g. `scripts/detect-pitch.mjs`, runnable via `node scripts/detect-pitch.mjs <file>` or an npm script). The wrapper handles file I/O + decoding (mp3 / ogg / wav) into a `Float32Array`, then delegates to `pitchDetect.ts`. Output is human-readable AND machine-readable (e.g. JSON with `--json`). Decoding library / approach is open — choose one that handles the formats already present in `public/samples/`.
   - **Test it against the existing samples** (`major-pad.mp3`, `major-space.mp3`, `minor-space.mp3`) and any other reference files with known pitches. Confirm the detector returns the right notes before trusting it. Commit one tiny test or a small Markdown note in `docs/` recording the detected pitch + confidence for each shipped sample.
   - **Then** move samples into a dedicated subfolder (e.g. `app/public/samples/`) and rename to a clear, future-proof convention that makes the sample's character + pitch obvious from the filename. Pick one convention and stick to it.
   - Update any existing references (none expected today, but check).
   - The in-app tuner UI is **out of scope for this task** — but `pitchDetect.ts` must be written so a future tuner can drop it into an `AnalyserNode` / `AudioWorklet` pipeline without modification. Keep the browser-specific wiring (mic input, frame buffering) out of `pitchDetect.ts`.

2. **Phase 1 — Audio service** (`app/src/lib/audio/`, internal API). Pure logic, no React inside the service itself.
   - One module owns a lazily-created `AudioContext` and a sample cache keyed by sample id. Samples are fetched + decoded once, then reused.
   - Exposes a typed API along the lines of `playChord({ sampleId, rootNote, intervals })` and `stopAll()`. The service does **not** know chord names — it takes a list of MIDI offsets and plays N pitch-shifted voices simultaneously from the cached `AudioBuffer`. Naming of chord types lives in a separate small table.
   - Each voice goes through its own gain node so the service can apply a short attack/release envelope (no clicks on start/stop). Choose the curve; document the choice.
   - **A = 442 Hz** is the single tuning constant, defined in one place. Pitch-ratio math uses it consistently.
   - The service initialises on the first user gesture (browser autoplay policy). Subsequent calls reuse the same context.
   - A small `useAudio` (or equivalent) React hook in `app/src/hooks/` wraps the service for components, but the service itself must be usable without React (so the engine can be unit-tested with plain functions where useful).

3. **Phase 2 — Chord vocabulary.** A small data module mapping chord type → interval list. Required chord types, exactly:
   - `major` (0, 4, 7)
   - `minor` (0, 3, 7)
   - `diminished` (0, 3, 6)
   - `augmented` (0, 4, 8)
   - `maj7` (0, 4, 7, 11)
   - `dom7` / "normal 7" (0, 4, 7, 10)
   - `dim7` (0, 3, 6, 9)
   No other chord types in this task. New ones added later by extending this table only.

4. **Phase 3 — Hidden test page** at `/test/audio` (matches the existing `/test/...` convention in `App.tsx`; also link it from `TestMenu`). Marked in code with the standard `DEBUG / TEST ROUTE` comment. UX can be utilitarian — this is a developer/test surface, not user-facing.
   - **Sample picker** — radio/buttons to choose which of the available samples is currently "armed".
   - **Chord-root picker** — twelve buttons or chips, one per chromatic note (C, C♯, D, …). Single selected at a time. Reasonable default (C or A).
   - **Chord buttons** — one button per chord type from Phase 2. Tapping a chord button plays the chord on the currently selected root using the currently selected sample. Tapping a chord button while another chord is sounding stops the previous chord (simplest behaviour for v1).
   - **Stop button** — explicit "Hiljaa" / Stop button that releases all voices.
   - **Now-playing readout** — small text showing which sample, root, chord, and the resulting note list (e.g. "C major → C4 E4 G4"). Useful for verifying pitch math by ear and by eye.
   - Should work on mobile and desktop, but no design polish beyond legibility.

5. **Phase 4 — Architecture doc** (`docs/audio-architecture.md`, new). Written **after** the implementation is working, not before. Covers:
   - The architecture that shipped (Web Audio nodes used, how voices share one decoded buffer, where the context lives, voice lifecycle).
   - **Why** this approach over the alternatives in `audio-research.md` (HTMLAudio, Tone.js, etc.). Include any approach attempted and discarded.
   - How pitch shifting is computed and how A = 442 enters the picture.
   - How to add a new sample. How to add a new chord type.
   - Known limitations (no seamless looping for very long sustain, single-zone pitch-shift quality, etc.).
   - Update `CLAUDE.md` reference table to point at the new doc.

### Out of scope

- Wiring the drone into Soittohetki (separate future task).
- Seamless looping / crossfade for indefinite sustain.
- Per-voice volume control, panning, reverb, filters, master volume slider.
- Multi-zone sampling (more than one source sample per "color").
- Recording new samples or sourcing additional ones beyond the three already present.
- **In-app tuner UI** — mic capture, real-time meter, on-screen needle. (The detection algorithm itself IS in scope per Phase 0; only the UI/integration is deferred.)

### Files (likely)

- `app/public/samples/` (new folder) — renamed sample files
- `app/src/lib/audio/pitchDetect.ts` (new) — portable pitch-detection algorithm, no env-specific imports
- `app/src/lib/audio/audioService.ts` (new) — context + buffer cache + voice playback
- `app/src/lib/audio/chords.ts` (new) — chord-type → interval table
- `app/src/lib/audio/samples.ts` (new) — sample manifest (id, src, rootPitch, label)
- `app/src/lib/audio/tuning.ts` (new) — A = 442 constant + note↔frequency helpers (used by both engine and detector)
- `app/src/hooks/useAudio.ts` (new) — thin React wrapper
- `app/src/screens/AudioTest.tsx` (new) — the hidden test page
- `app/src/App.tsx` — register `/test/audio` route
- `app/src/screens/TestMenu.tsx` — add link to the audio test
- `scripts/detect-pitch.mjs` (new) — Node CLI wrapping `pitchDetect.ts` with file decoding
- `app/package.json` — npm script for the CLI; any new dev-dependency for decoding (if needed)
- `docs/audio-architecture.md` (new) — final architecture doc
- `docs/audio-research.md` — may receive minor follow-up notes after implementation, but is not the deliverable
- `CLAUDE.md` — reference table entry for the new architecture doc
