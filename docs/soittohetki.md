# Soittohetki Screen

A kid-friendly "playing moment" timer. The user picks a duration, hits play, and practices the chosen scale until the timer runs out.

## Entry point

A small round button with an inline stick-figure SVG sits next to the info button on each row of the Harjoittelu practice list (`app/src/screens/Harjoittelu.tsx`). Clicking it navigates to `/soittohetki` with the scale's parameters in the URL.

## Route

Registered in `app/src/App.tsx` as `path="/soittohetki"`, lazy-loaded like the other screens. Because the app uses `HashRouter`, the full URL looks like:

```
#/soittohetki?root=D&mode=ionian&octaves=2
```

### Query parameters

| Param     | Type                          | Default              | Notes                                                                                                                                                      |
| --------- | ----------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`    | letter `[A-G]` + opt. `#`/`b` | `C`                  | Passed through verbatim — no validation against a key list.                                                                                                |
| `mode`    | `ionian` \| `aeolian`         | `ionian`             | Matches the internal `ScaleEntry.mode` values; readable and parseable.                                                                                     |
| `octaves` | `1` \| `2` \| `3`             | `2`                  | Used only for the header label.                                                                                                                            |
| `min`     | `1` \| `3` \| `5` \| `10`     | `3`                  | Selected duration; written back with `replace: true` so back-nav stays clean.                                                                              |
| `anim`    | `walking` \| `flying`         | random on first open | Selects the pelican timer animation variant (Task 21). When opened from Harjoittelu, one of the two variants is picked at random and written into the URL. |

Invalid values fall back to defaults — no error screen, no redirect.

## Layout

```
+--------------------------------+
| < D-duuri, 2 oktaavia          |  ScreenHeader (red), label as title
+--------------------------------+
| [Asteikko]  [Arpeggio]         |  toggle (Asteikko = scale, default)
| +----------------------------+ |
| |  music canvas (4:1)        | |  notes from getScale() or arpeggio
| +----------------------------+ |
| C – D – E – F – G – A – B – C [🎲][👁] |  marquee note line + challenge buttons in scale mode
|                                |
|  +------------------------+    |
|  |   pelican animation    |    |  PelicanTimer / PelicanCelebration
|  +------------------------+    |
|  [1] [3] [5] [10]  3:00  [▶]   |  duration chips + time + play/pause (red-brown row)
|  [🔊====●==]  [Sample ▾]       |  sound row — olive bg (#5a6b3d)
|  [ D ] [DMaj] [DMaj7]          |  drone + diatonic chord suggestions
+--------------------------------+
```

- The toggle drives a local `view` state (`'scale' | 'arpeggio'`). Switching re-renders the `MusicCanvas` with either `scaleKey`/`mode` or `arpeggioNotes` props.
- In scale mode, the note line below the canvas is a compact flex row: `MarqueeText` on the left, dice + hide buttons on the right. The marquee shows either `scaleNotes.join(' – ')` or the rolled variation text.
- In arpeggio mode, the old plain text line remains: arpeggio notes (letter + accidental, dropping the octave number), no extra buttons.
- Duration chips are disabled while the timer is running so the user can't change the duration mid-countdown.
- The play button swaps to a pause button while running. The reset button only appears once the timer has moved off its initial state.

## Scale-line challenge controls (Task 26)

Only the **scale** view gets the extra controls below the canvas.

1. **Variation button** — rolls one Finnish practice instruction from `SCALE_VARIATIONS` and shows it in the marquee area.
2. **Hide-two-notes button** — cycles hide → reveal → hide new pair for two non-tonic notes from the current scale. The dimming is passed to `MusicCanvas` through `hiddenNotes`.

The challenge state is local to `Soittohetki` and resets when a different root/mode is opened.

## Timer logic

`app/src/lib/useCountdownTimer.ts` — small hook (~50 lines) that owns the countdown:

```ts
const { remainingMs, isRunning, start, pause, reset } = useCountdownTimer(durationMs, onComplete)
```

- Drift-free: records `performance.now()` at start, subtracts elapsed wall-clock time inside a `setInterval` tick (~10 Hz) — surviving tab throttling and not accumulating per-tick error.
- `onComplete` fires once when `remainingMs` hits zero. The celebration then stays on its final frame until the user presses a screen button (for example Reset, a duration chip, or a view toggle) or leaves the screen.
- Changing `durationMs` while the timer is **not running** snaps `remainingMs` to the new value; mid-run changes are ignored (and the chips are disabled in the UI anyway).
- Cleans up its interval on unmount.

## Timer animation

Procedural CSS pelican rendered by `app/src/components/animations/PelicanTimer.tsx` (see [animations.md](animations.md)). Driven by `--duration` set from `durationMs`. Pausing toggles `animation-play-state` via an `is-paused` class. Reset and duration changes remount the component via a `runId` key (`<PelicanTimer key={`${variant}-${durationMs}-${runId}`} ... />`), which rewinds every CSS animation to frame 0.

Two variants share the same rig: **walking** and **flying**. Harjoittelu picks one at random when opening Soittohetki, and direct links without `anim` are normalised to a random variant once and then kept stable in the URL. The internal test menu lives at `#/test`, and the timer preview route is documented in `animations.md`.

## Sound row (Task 25)

Below the duration-controls row sits a second row with an **olive** background (`#5a6b3d`) so the eye reads it as a different functional band ("sound") from the red-brown timer row above. The row holds, left to right:

1. **VolumeSlider** (`app/src/components/ui/VolumeSlider.tsx`) — YouTube-style speaker icon (tap to mute/unmute, remembers last non-zero level) plus a thin horizontal track with the filled portion drawn by `accent-color`. Emits 0..1 to the parent.
2. **Sample picker** — native `<select>` over `SAMPLES` from `app/src/lib/audio/samples.ts`, styled to match the row (parchment chip on olive). Default: the first sample in the manifest.
3. **Sound buttons** — radio-style row built from `getScaleChords(root, mode)`:
   - First button is always the **tonic drone** (`intervals = [0]`). Label is the bare root letter (e.g. "C").
   - Following buttons are diatonic chord suggestions in `CHORD_TYPES` order. Labels are compact (`CMaj`, `CMaj7`, `Am`, `Am7`); `aria-label` spells the chord (`C Duuri`, `A Molli 7`).
   - One selected at a time. Tapping the active button deselects it — silent timer is the default state.
   - Active state uses the same primary-brown highlight (`#8B2500`) as the timer row's duration-chip selection.

### Selection ⇄ playback wiring

A single effect in `Soittohetki.tsx` watches `(isRunning, activeSound, sampleId, root)`:

| Event                               | What happens                                                   |
| ----------------------------------- | -------------------------------------------------------------- |
| Start with a sound selected         | `playChord({ sampleId, rootMidi, intervals, loop: true })`     |
| Start with no sound selected        | Silent timer                                                   |
| Pause / Reset / time-up             | `stopAll` (effect cleanup, 250 ms release fade)                |
| Resume (Start after pause)          | `playChord` again from the top                                 |
| Change selected sound while running | Old voices stop, new loop starts                               |
| Change sample while running         | Same — the effect re-runs                                      |
| Unmount / back navigation           | `stopAll`                                                      |
| Volume slider drag                  | `setMasterVolume(v)` — applied live; loop is **not** restarted |

The effect uses a `cancelled` flag captured in a closure: if the user pauses while `playChord` is still awaiting `decodeAudioData` on the first listen, the voices are killed as soon as they wake.

### Root octave

Drone and chord roots play at **octave 3** (e.g. C3 = MIDI 48 for a C-major scale) — one octave below middle C — so the audio sits comfortably as background below most kid-violin practice ranges. The other chord voices stack upward via interval offsets, so the topmost voice of a maj7 chord at C3 is B3 (MIDI 59), still safely below middle C. Defined as `ROOT_OCTAVE` in `Soittohetki.tsx`; change there to move the drone.

### Initial volume

The volume slider initialises to **0.6** on screen mount and immediately calls `setMasterVolume(0.6)` so the engine and the slider agree before the first playback gesture. Subsequent drags propagate live via `setMasterVolume(v)` with a 20 ms ramp inside the engine — no zipper noise, no loop restart.

## Out of scope (handled by future tasks)

- Non-tonic chord suggestions (V, ii–V–I, secondary dominants, modal characteristic chords).
- Crossfaded seamless loops — the shipped pad samples fade out cleanly enough; loops with non-zero tails would click at the seam.
- Persisting last-used sample / chord / volume across sessions.
- Showing the chosen chord on the music canvas.
