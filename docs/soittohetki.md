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

| Param     | Type                   | Default     | Notes                                                                 |
|-----------|------------------------|-------------|-----------------------------------------------------------------------|
| `root`    | letter `[A-G]` + opt. `#`/`b` | `C`         | Passed through verbatim — no validation against a key list.           |
| `mode`    | `ionian` \| `aeolian`  | `ionian`    | Matches the internal `ScaleEntry.mode` values; readable and parseable. |
| `octaves` | `1` \| `2` \| `3`      | `2`         | Used only for the header label.                                       |
| `min`     | `1` \| `3` \| `5` \| `10` | `3`       | Selected duration; written back with `replace: true` so back-nav stays clean. |

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
| C – D – E – F – G – A – B – C  |  note names below canvas
|                                |
|  Ajastettu soittohetki         |  section title
|       3:00                     |  countdown display, MM:SS
|  +------------------------+    |
|  | animation placeholder  |    |  square, dashed border — Task 21 lands here
|  +------------------------+    |
|  [1] [3] [5] [10]  [▶] [⟲]     |  duration chips + play/reset on one row
+--------------------------------+
```

- The toggle drives a local `view` state (`'scale' | 'arpeggio'`). Switching re-renders the `MusicCanvas` with either `scaleKey`/`mode` or `arpeggioNotes` props.
- Note text below the canvas uses `scaleNotes.join(' – ')` or the arpeggio notes (letter + accidental, dropping the octave number).
- Duration chips are disabled while the timer is running so the user can't change the duration mid-countdown.
- The play button swaps to a pause button while running. The reset button only appears once the timer has moved off its initial state.

## Timer logic

`app/src/lib/useCountdownTimer.ts` — small hook (~50 lines) that owns the countdown:

```ts
const { remainingMs, isRunning, start, pause, reset } = useCountdownTimer(durationMs, onComplete)
```

- Drift-free: records `performance.now()` at start, subtracts elapsed wall-clock time inside a `setInterval` tick (~10 Hz) — surviving tab throttling and not accumulating per-tick error.
- `onComplete` fires once when `remainingMs` hits zero. Task 22 will hook the celebration animation here.
- Changing `durationMs` while the timer is **not running** snaps `remainingMs` to the new value; mid-run changes are ignored (and the chips are disabled in the UI anyway).
- Cleans up its interval on unmount.

## Out of scope (handled by future tasks)

- **Task 21:** procedural CSS/SVG animation in the placeholder box.
- **Task 22:** time-up celebration animation, triggered via the `onComplete` callback.
- Drone/metronome audio, persisting completed sessions, scale variations.
