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

**Status:** done
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

---

## Task 25: Scale-aware chord suggestions + Soittohetki drone/chord loop

**Status:** done
**Blocked by:** Task 20 (Soittohetki), Task 24 (audio engine)
**Reference:** `docs/audio-architecture.md` (engine + its known limitations: no looping, no master volume API), `app/src/lib/musicScale.ts` (scale model), `app/src/lib/audio/chords.ts` (chord-type interval table).

Suggest a small set of chords that fit the current scale, then let the kid pick **one** (or the tonic drone, or nothing) and have the audio engine play it on loop while the Soittohetki timer is running. The same control row carries a sample picker and a YouTube-style volume slider.

### Phase 1 — Chord suggestions in the scale library

Add a `ChordSuggestion` type and a function `getScaleChords(root: string, mode: string): ChordSuggestion[]` that returns the chords that fit a given scale. Shape proposal:

```ts
type ChordSuggestion = {
  id: string // e.g. 'C-maj7'
  label: string // e.g. 'CMaj7'  (compact, button-ready)
  rootNote: string // e.g. 'C'      (matches musicScale.ts note strings)
  chordTypeId: ChordTypeId // matches an entry in audio/chords.ts CHORD_TYPES
}
```

Scope for v1: **chords built on the tonic** that match the scale flavour. Only chords whose notes all lie in the scale — no non-diatonic suggestions.

- C major (ionian) → `CMaj` (major triad), `CMaj7` (major 7th).
- A minor (aeolian) → `Am` (minor triad), `Am7` (minor 7th). **No** `A7` (dominant 7th uses C♯, not in A natural minor).

New file: **`app/src/lib/scaleChords.ts`**. Imports from `musicScale.ts` and `audio/chords.ts`. No React, no audio. Unit-testable in isolation.

### Phase 2 — Audio engine: looping + master volume

Lift two of the limitations documented in `docs/audio-architecture.md`:

- **Looping.** Add a looping playback path — either `playChord({ ..., loop: true })` or a new `playLoopedChord(...)`. The returned value (or `stopAll`) must be able to stop just that loop without affecting unrelated voices, if any. Looping uses `AudioBufferSourceNode.loop = true`; for v1 the buffer's natural length is the loop period — note seam audibility per sample in the architecture doc.
- **Master volume.** Add `setMasterVolume(value: 0..1)` to `audioService` that routes through the existing `masterGain` (already shown in the architecture diagram — make sure it's actually wired). Persist the last value in module state so subsequent `playChord` calls inherit it.

Expose both via `useAudio` so React components don't reach into the service directly.

### Phase 3 — Soittohetki sound-control row

Below the existing timer-controls row in `Soittohetki.tsx` (`app/src/screens/Soittohetki.tsx:229`), add a second row with a **distinct background colour** that reads as "sound" rather than "timer" (pick a muted complement to `#8B2500` — note the choice in `docs/ux-spec.md`). Same tight, mobile-first horizontal layout as the timer row.

From left to right on the row:

1. **Volume slider** — YouTube-style: speaker icon + thin horizontal track + filled portion + draggable thumb. Tap the icon to mute/unmute. Touch-friendly hit area but visually minimal. Likely its own component `app/src/components/ui/VolumeSlider.tsx`.
2. **Sample picker** — dropdown over `SAMPLES` from `app/src/lib/audio/samples.ts`. Native `<select>` is acceptable if styled to match; otherwise a tiny popover. Default to the first sample.
3. **Sound buttons** — radio-style group built from `getScaleChords(root, mode)`:
   - **First button is always the tonic drone** (single note: `intervals = [0]`).
   - Following buttons are the suggested chords in the order returned by `getScaleChords`.
   - Labels are compact (`C`, `CMaj`, `CMaj7`); `aria-label` spells them out.
   - Only one button can be active at a time. Tapping the active button again deselects it ("no sound" state — silent timer is the default).
   - Active state visually matches the timer row's primary-brown highlight so "armed" is unambiguous.

### Phase 4 — Wire selection into the timer

- **On start** (`handleStart`, `app/src/screens/Soittohetki.tsx:106`): if a sound is selected, call the looped-playback API with `{ sampleId, rootMidi, intervals }`. Pick a default playback octave for the root (e.g. octave 3 or 4) and document.
- **On pause**: fade out via `stopAll`. On resume, restart the loop.
- **On time-up** (the existing `onComplete` that triggers the celebration): `stopAll`.
- **Selection change while running**: stop the old loop, start the new one.
- **On screen unmount / back navigation**: `stopAll`.
- Volume changes apply live via `setMasterVolume` without restarting the loop.

### Phase 5 — Docs

- `docs/audio-architecture.md` — looping section, master-volume API, removed limitations.
- `docs/soittohetki.md` — new sound row, selection model, drone-vs-chord semantics, volume + sample picker.
- `docs/ux-spec.md` — ASCII for the new row, palette note.

### Out of scope

- Non-tonic chord suggestions (V–I, ii–V–I, secondary dominants, modal characteristic chords, etc.). Tonic only for v1.
- Recording or adding new samples.
- Per-voice volume / panning / reverb / filters.
- Persisting last-used sample/chord/volume across sessions (single-session state is enough).
- Showing the chosen chord on the music canvas.
- Crossfaded seamless looping for samples whose loop points click — note the seam if audible, don't fix it here.

### Files (likely)

- `app/src/lib/scaleChords.ts` (new) — `ChordSuggestion` type + `getScaleChords()`.
- `app/src/lib/audio/audioService.ts` — looping playback + `setMasterVolume`.
- `app/src/hooks/useAudio.ts` — expose new API.
- `app/src/screens/Soittohetki.tsx` — sound row UI + timer wiring.
- `app/src/components/ui/VolumeSlider.tsx` (new, likely).
- `docs/audio-architecture.md`, `docs/soittohetki.md`, `docs/ux-spec.md`.

---

## Task 26: Soittohetki scale-line variations + hidden-note challenge

**Status:** done
**Reference:** `docs/scale-variation-research.md`, `app/src/screens/Soittohetki.tsx`, `app/src/lib/musicStave.ts`

Add two small challenge controls to the scale-note line in Soittohetki so the student can quickly make the current scale less automatic without leaving the timed-practice screen.

### Goal

In Soittohetki scale mode, the note-name line already sits directly below the scale canvas. Extend that same row with two **tiny text-sized buttons** placed after the note text:

1. a **variation roll** button that randomly selects one practice variation and shows the instruction in **Finnish** on that same row
2. a **hide two notes** button that rolls two notes from the scale and makes them almost invisible on the canvas to create a recall challenge

The controls should feel lightweight and playful, not like a second toolbar.

### Variation set for v1

Only these variations are in scope for this task:

- `V02` dotted long-short
- `V03` dotted short-long
- `V05` quarter + two eighths
- `V07` two slurred + two separate
- `V10` staccato or martelé
- `V14` broken thirds
- `V16` tonic arpeggio pass

Each variation needs a short, child-readable **Finnish instruction string** suitable for inline display in a narrow row.

Example intent only; final wording can be adjusted during implementation:

- "Pitkä-lyhyt rytmi"
- "Lyhyt-pitkä rytmi"
- "Neljäsosa + kaksi kahdeksasosaa"
- "2 sidottuna, 2 erikseen"
- "Staccato / martelé"
- "Murretut terssit"
- "Lisää toonika-arpeggio"

### UI requirements

1. **Placement**
   - Add both controls on the same text row that currently presents the scale-note text in Soittohetki.
   - Keep them visually small — closer to inline text actions than standard icon buttons.
   - Each button must include a small icon/symbol so the action is recognizable even before reading the text.

2. **Variation button**
   - Clicking the variation button rolls **one** item from the allowed variation set above.
   - The rolled result is displayed as Finnish instruction text on that same row, replacing the plain note list.
   - Because the row is narrow, the result text must stay inline and use a **slow right-to-left marquee / digital-display style animation** when it overflows.
   - The animation must be calm and readable, not flashy.
   - Re-clicking the variation button rolls a new variation.

3. **Hide-two-notes button**
   - Clicking the button the first time rolls **two notes** from the currently shown scale.
   - The **root note must never be one of the hidden notes**.
   - Those two notes stay in the scale visually, but their rendered opacity on the stave/canvas is reduced to **10%**.
   - Clicking the same button again restores the hidden notes to full visibility.
   - Clicking it a third time rolls a **new pair** of hidden notes and applies the 10% opacity again.
   - The cycle continues: hide pair → reveal → hide new pair → reveal ...

4. **Same-row feedback**
   - The row must remain understandable even when both features are used.
   - The variation text and the note-hiding state should not force the row to grow into a large multi-line control block unless that is required for mobile usability.
   - Prefer a compact inline layout first.

### Behaviour and state

1. **Per-screen state**
   - Variation result and hidden-note state belong to the Soittohetki screen instance, not to Harjoittelu globally.
   - Opening a different scale in Soittohetki resets the challenge state.

2. **Variation rolling**
   - Use uniform random selection for v1.
   - No difficulty weighting yet.
   - No automatic combination of multiple variations yet.

3. **Hidden-note selection**
   - Only notes that actually appear in the rendered scale can be selected.
   - Exclude the tonic/root from the candidate pool.
   - If the same pitch class appears in multiple octaves, implementation should define whether hiding applies by rendered note instance or by pitch class, and keep the behavior consistent. Prefer the option that is simplest with the current stave-rendering architecture.

4. **Canvas integration**
   - The hidden-note state must flow into the existing stave/canvas rendering so the affected notes are drawn at 10% opacity.
   - The notes should still occupy their normal positions; only visibility changes.
   - This applies to the Soittohetki **scale canvas** only. Arpeggio mode keeps its current plain note row and does not show these controls.

### Implementation expectations

- Add a small variation definition table in code rather than hardcoding strings inline in JSX.
- Keep the Finnish instruction text centralized so it is easy to refine later.
- Implement the marquee as a lightweight CSS animation that only activates when the text actually overflows its container.
- Avoid introducing heavy animation logic or timers for the text.
- Preserve the existing Harjoittelu row layout. The new UI belongs in Soittohetki only.

### Out of scope

- Adding the same variation system to Harjoittelu rows
- Combining two simultaneous rolled variations
- Persisting rolled variations or hidden-note state between sessions
- Audio cues, metronome, or spoken instructions
- Advanced weighting / difficulty tags for the variation pool
- Hiding more than two notes or making the root hideable

### Files (likely)

- `app/src/screens/Soittohetki.tsx` — scale-line UI, button actions, per-screen challenge state
- `app/src/components/ui/...` — optional tiny inline control or marquee helper component if extraction improves clarity
- `app/src/lib/musicStave.ts` — support per-note reduced opacity in rendered output
- `app/src/lib/...` — small variation-definition helper and/or hidden-note rolling helper if needed
- `docs/soittohetki.md` / `docs/ux-spec.md` — update the scale-note row if the visual design changes materially

---

## Task 27: Adopt `pitchy` (MPM) for the live tuner + clarity-gated filtering + sensitivity control

**Status:** done
**Reference:** `docs/tuner-pitch-detection.md` (the design decision + `pitchy` audit + integration snippet), `app/src/lib/audio/tuner.ts`, `app/src/hooks/useMicPitch.ts`, `app/src/screens/TunerTest.tsx`, `app/src/screens/ScaleTunerTest.tsx`

> **Rewritten** (was "Tuner filter reliability" built on the hand-rolled YIN). We decided to switch the live path to the **`pitchy`** MPM library — see `docs/tuner-pitch-detection.md`. This both fixes the "real notes rejected" problem and _removes_ the work the old version planned: MPM returns a single **clarity** value, so there is no "real dip vs fallback global-minimum" flag to add — you just gate on clarity.

The live tuner currently behaves badly in the two states that matter most during manual testing:

- with filters **on**, real played notes are often rejected entirely (the old `minConfidence` design)
- with filters **off**, the raw reading is useful for debugging but too unstable for real use

Fix the filtered path by adopting MPM and gating on clarity, and define one clear user-facing **sensitivity** control that means something simple. (Calmer needle motion / smoothing is Task 28; shipping the real tuner screen is Task 29.)

### Agreed direction

1. **Switch the live detector to `pitchy` (MPM).** Clarity replaces every home-grown confidence/fallback heuristic.
2. **Filtered path gates on clarity.** A note is surfaced only when `clarity ≥` an internal default (start ~0.9); otherwise show **no detected note** — never a weak guess.
3. **One user-facing Sensitivity knob** = how quiet a note can be before it's accepted (the volume gate). Clarity threshold becomes an **internal default**, not a second visible concept.

### Requirements

1. **Adopt `pitchy` on the live path**
   - Add the `pitchy` dependency. In `tuner.ts`, create a `PitchDetector.forFloat32Array(fftSize)` once and call `findPitch(buf, sampleRate) → [hz, clarity]` per frame (see the snippet in `docs/tuner-pitch-detection.md`).
   - **Keep `pitchDetect.ts` (YIN) unchanged** — it stays the detector for the offline `scripts/detect-pitch.mjs` sample CLI (Task 24). Only the live tuner path moves to `pitchy`.
   - Preserve the violin frequency bounds (clamp `hz` to ≈180–2800 Hz).

2. **Clarity-gated filtered behaviour** (replaces the old real-dip/fallback machinery)
   - Surface a note only when `clarity ≥` the internal threshold; below it, emit "no note". There is no separate fallback flag to track anymore — clarity _is_ the accept/reject signal.
   - Keep the adaptive noise-floor / volume gate for silence, tuned so sustained violin notes are not dropped.

3. **Raw/debug behaviour**
   - Keep a raw mode on the test page that shows the bare `findPitch` output (`hz` + `clarity`) regardless of the gate, so low-clarity frames can still be inspected.
   - The debug readout must show **clarity** prominently so it's obvious whether a frame would pass the gate.

4. **Controls / UI semantics**
   - The main visible knob on the normal test view is **Sensitivity** (volume gate). Map it to `pitchy`'s built-in `minVolumeDecibels` and/or the existing adaptive RMS floor.
   - A **clarity-threshold** slider may stay on the test page for finding the default empirically, but it is not the primary user-facing concept.
   - Build the controls from reusable UI pieces + state shapes that can later move into the real tuner settings menu (Task 29), not throwaway debug wiring.

5. **Validation**
   - **Manual (required):** with filtering on, sustained violin notes are detected across a practical loudness range; weak/noisy frames produce no stable false note name.
   - **Cheap offline aid (optional, reuses existing infra — not a new test harness):** add a `pitchy` path/flag to `scripts/detect-pitch.mjs` and run it on 2–3 reference violin notes (recorded, or open-string / scale recordings from Wikimedia Commons) to confirm the algorithm returns the right note + high clarity _without the mic_. This shortens the slow manual loop for the algorithm itself; the mic/UI path still needs manual testing.

### Out of scope

- Detector-side smoothing / hysteresis / calmer needle — **Task 28**.
- Production tuner screen + persisted preset/custom settings — **Task 29**.
- Off-main-thread (AudioWorklet / Web Worker) detection — see `docs/tuner-web-workers.md` (verdict: not needed for this workload).
- A full automated audio test harness (the optional CLI check above is deliberately lightweight).

### Files (likely)

- `app/package.json` — add `pitchy` dependency
- `app/src/lib/audio/tuner.ts` — `pitchy` detector + clarity gate + sensitivity semantics
- `app/src/hooks/useMicPitch.ts` — preserve live setting updates; pass `fftSize` through
- `app/src/components/ui/TunerControls.tsx` — Sensitivity-primary controls + clarity readout
- `app/src/screens/TunerTest.tsx`, `app/src/screens/ScaleTunerTest.tsx` — test-page wiring
- `app/src/lib/audio/pitchDetect.ts` — **unchanged** (offline CLI keeps using it)
- `scripts/detect-pitch.mjs` — optional `pitchy` path for offline sample checks

---

## Task 28: Tuner stability — slower detector output with reasonable defaults + test-screen tuning controls

**Status:** done
**Blocked by:** Task 27
**Reference:** `docs/tuner-pitch-detection.md`, `app/src/lib/audio/tuner.ts`, `app/src/hooks/useMicPitch.ts`, `app/src/components/ui/TunerDial.tsx`, `app/src/screens/TunerTest.tsx`, `app/src/screens/ScaleTunerTest.tsx`

> **Unaffected by the `pitchy` switch.** Smoothing / hysteresis is algorithm-agnostic — it sits on top of `pitchy`'s per-frame `[hz, clarity]` output (Task 27) exactly as it would on YIN. This task stays as planned.

After filter reliability is fixed, the next tuner problem is stability: the detected frequency and needle move too fast to be useful for a human player. The goal is **not** merely a visually slower needle — the **detector output itself** should become calmer and easier to understand.

### Product direction

1. **Reasonable default behaviour**
   - The normal tuner path should ship with sensible defaults that feel calm without requiring manual adjustment.
   - A player opening the tuner should not need to understand multiple technical knobs before the display becomes usable.

2. **Detection-side smoothing, not only animation smoothing**
   - Slow down and stabilise the detected note / cents output in the tuning logic itself.
   - Purely visual easing is not enough for this task; the reported reading should also become less jumpy.

3. **Test-screen experimentation controls**
   - The hidden tuner test screens should expose one or more controls so smoothing behaviour can be tuned empirically.
   - Start with **two sliders** on the test screens:
     - smoothing amount
     - note-confirm delay / hysteresis
   - More advanced controls can be added later only if these two are not enough.
   - The production-facing concept should remain simple even if the test page exposes more detail.
   - Prefer reusable controls/components and state shapes that can later be moved into a real tuner configuration menu.

### Requirements

1. **Smoothing / hysteresis in the tuner layer**
   - Add detector-side stability logic such as one or more of:
     - median / moving-average smoothing over recent cents readings
     - note-confirm hysteresis (require N similar frames before committing a note label)
     - hold / decay behaviour so a stable note does not flicker away instantly between adjacent frames
   - Keep the implementation understandable; avoid an overcomplicated state machine unless it is clearly justified.

2. **Reasonable defaults**
   - Choose default smoothing values that work well for sustained violin notes on the current test pages.
   - Defaults should favour readability over maximum instantaneous responsiveness.

3. **Test-page controls**
   - Add tuning controls on the test screens for experimenting with stability.
   - First implementation: expose **two** experimental controls — one for smoothing amount and one for note-confirm delay / hysteresis.
   - The readout should make it possible to tell whether the calmer behaviour comes from actual detector smoothing rather than only CSS animation.

4. **Future settings persistence path**
   - The stability settings explored on the test screens should be designed so they can later become user-configurable settings in the real app.
   - Plan for those future tuner preferences to be saved in local storage, so a user can keep their own preferred tuner behaviour.
   - The future tuner settings UI should support **preset buttons plus user-saved custom values**, including a clear way to reset back to a preset.

5. **UI alignment**
   - Ensure the dial animation timing does not fight the detector smoothing.
   - The visual transition should support the stabilised reading, not reintroduce nervous motion.

6. **Validation**
   - Manually verify that a sustained note produces a noticeably calmer note label, cents value, and needle motion.
   - Confirm that normal pitch changes are still detected within a practical time for tuning.

### Out of scope

- Replacing the detector algorithm entirely (the `pitchy` switch is Task 27)
- Full redesign of the tuner screen (production screen is Task 29)
- AudioWorklet / worker offloading (not needed — see `docs/tuner-web-workers.md`)

### Files (likely)

- `app/src/lib/audio/tuner.ts` — smoothing / hysteresis defaults and experimental parameters
- `app/src/hooks/useMicPitch.ts` — live update cadence if needed to match the new behaviour
- `app/src/components/ui/TunerDial.tsx` — visual transition timing aligned with smoothed readings
- `app/src/components/ui/TunerControls.tsx` — one or more experimental stability controls for test pages
- `app/src/screens/TunerTest.tsx` — test-page experimentation UI and readout
- `app/src/screens/ScaleTunerTest.tsx` — keep the second tuner test page aligned with the same controls/defaults
- `app/src/stores/...` — future persisted tuner settings store if the configuration menu is added

---

## Task 29: Ship the production tuner — lock defaults, simple screen, persisted preset/custom settings

**Status:** planned
**Blocked by:** Task 27, Task 28
**Reference:** `docs/tuner-pitch-detection.md` (the "ship a tuner with zero sliders — just start/stop and the dial" goal), `docs/tuner-web-workers.md`, `app/src/components/ui/TunerDial.tsx`, `app/src/components/ui/TunerControls.tsx`, `app/src/screens/TunerTest.tsx`, `docs/react-instructions.md` (Zustand + localStorage persist), `docs/ux-spec.md`

Tasks 27–28 find good detection + stability defaults on the **hidden test pages**. This task turns that into the actual user-facing tuner — the **"fast, easy to use"** half of the goal: calm, zero-config by default, with an optional settings menu that remembers each player's preferences. Both earlier tasks explicitly deferred this (production UI + settings persistence were out of scope), so it needs its own task.

### Product direction

- Opening the tuner just works: **no sliders**, start/stop + the dial + a note/cents readout.
- The detection + smoothing knobs from Tasks 27–28 are baked in as defaults; tweaking them is an _optional_ menu, not the default surface.
- Per-player preferences survive reloads.

### Requirements

1. **Lock the empirical defaults.** Bake the values chosen on the test pages (clarity threshold, sensitivity / volume gate, window size, smoothing amount, note-confirm hysteresis) into the default tuner settings so the default experience needs no adjustment.

2. **Production tuner screen.** A real (non-`/test`) route showing only: start/stop, the `TunerDial`, and the note + cents readout. Mobile-first inside the centred ~390 px viewport; fine on desktop. No debug controls visible by default. Reuse `TunerDial` / `TunerControls` rather than rebuilding.

3. **Optional settings menu** (behind a gear / "Asetukset" control): **resettable presets + user-saved custom values**, with a clear "reset to preset" action. This is the architecture Tasks 27–28 kept deferring — build it here, reusing the control/state shapes they prepared.

4. **Persistence.** Save the player's tuner preferences in local storage via a Zustand `persist` store (follow `docs/react-instructions.md` and the existing `stores/` pattern — e.g. `tunerStore.ts`).

5. **Entry point.** Decide where the tuner is reached from (Home card and/or Harjoittelu) and wire it into the router + `DesktopNavBar` as appropriate. The hidden `/test/...` pages stay for future tuning work.

6. **Validation.** Manual: default tuner is calm and accurate on sustained violin notes with zero configuration; a changed preset/custom value persists across reload; "reset to preset" restores defaults.

### Out of scope

- Algorithm changes (Task 27) and smoothing logic (Task 28) — this task only _locks and exposes_ them.
- AudioWorklet / Web Worker offloading — not needed (`docs/tuner-web-workers.md`).
- A full automated audio test harness.

### Files (likely)

- `app/src/screens/Tuner.tsx` (new) — production tuner screen
- `app/src/stores/tunerStore.ts` (new) — persisted settings (presets + custom + reset)
- `app/src/components/ui/TunerDial.tsx`, `app/src/components/ui/TunerControls.tsx` — reuse / refine for production
- `app/src/App.tsx` — register the production route
- Home / Harjoittelu screen + `app/src/components/ui/DesktopNavBar.tsx` — entry point
- `docs/ux-spec.md`, `docs/ui-components.md` — document the tuner screen + settings menu
- `CLAUDE.md` — reference entry if a dedicated tuner doc is added
