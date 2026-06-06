# Tuner tuning worksheet (manual)

Sweep every tuner setting on a **real device** (phone mic + violin) and record what
works, so we can lock in sensible defaults and usable slider ranges. Fill the result
cells in as you go (✓ works / ✗ fails / short note), then complete the **Findings**
table at the bottom and copy those numbers into the code + docs (see last section).

## Where to test

Run the app locally, then open one of the hidden tuner test routes:

- **`#/test/tuner`** — raw chromatic tuner: the dial + the four detection sliders +
  the Filter toggle + the live readout. Best for sweeping detection settings against
  a single sustained note.
- **`#/test/scaletuner`** — scale game: same detection sliders, plus **Hold (Kesto)**
  and **Accuracy** presets; it advances when you hold the target note in tune. Best
  for judging note-change latency and the hold/accuracy feel.

All four detection sliders are full width and show their current value. The Filter
toggle bypasses all gating/smoothing when OFF (shows the raw detector) — useful as a
"what is the detector actually seeing?" reference while sweeping.

## Settings under test

| Setting (UI label) | Key | Range (step) | Current default | Higher = |
|---|---|---|---|---|
| Sensitivity | `sensitivity` | 0.00–1.00 (0.01) | **0.90** | picks up quieter notes (volume gate nearer the noise floor) |
| Clarity | `clarityThreshold` | 0.50–1.00 (0.01) | **0.60** | note must be cleaner to register; rejects more noise |
| Smoothing | `smoothingFrames` | 1–24 (1) | **12** | calmer, steadier needle (more cents-median lag) |
| Confirm | `confirmFrames` | 1–10 (1) | **4** | steadier note name (slower to switch notes) |
| Filter | `filterEnabled` | on / off | **on** | off = raw detector, no gating/smoothing |
| Hold (Kesto) · scaletuner | `holdSeconds` | 0.2–2.0 s (0.1) | **0.5** | must hold in tune longer before it advances |
| Accuracy · scaletuner | `accuracyCents` | 35 / 20 / 10 ¢ | **20** | tighter "in tune" tolerance |

## Reading the live readout ("Live" line)

`clarity 0.NN · 196.0 Hz (or RMS x / portti y) · raaka +12¢→tasattu +3¢ · pidossa`

- **clarity** — this frame's MPM clarity; compare it against the Clarity slider.
- **Hz** — detected pitch; or `RMS / portti(gate)` when nothing is detected — RMS must
  exceed the gate to pass the volume gate (driven by Sensitivity).
- **raaka→tasattu** — raw vs smoothed cents; shows what Smoothing is doing.
- **pidossa** — a held/decayed note (Confirm's hold window), not a fresh detection.

## Test scenarios

Run each sweep across these conditions; note which ones break.

| # | Scenario |
|---|---|
| A | Quiet room, soft / slow bowing |
| B | Quiet room, full / loud bowing |
| C | Quiet room, **not playing** (silence) — should show nothing |
| D | Noisy room (talking / hum / fan), playing normally |
| E | Weak string, gentle bow (open D / open G) |
| F | High notes (E-string / high positions) |
| G | Fast note changes (play a scale) |

## Sweeps

Hold the other settings at their defaults, sweep the one under test, and record the
**lowest** and **highest** value that still behaves. Add rows as needed.

### Sensitivity — does the note get picked up? (and no false note in silence)

| Value | A soft bow | B loud | C silence (no false note) | D noisy | E weak string | Notes |
|---|---|---|---|---|---|---|
| 0.50 | | | | | | |
| 0.70 | | | | | | |
| 0.90 *(default)* | | | | | | |
| 1.00 | | | | | | |

### Clarity — registers weak/rough notes vs. latches onto noise

| Value | A soft bow | E weak string | D noisy (no false note) | C silence (no false note) | Notes |
|---|---|---|---|---|---|
| 0.50 | | | | | |
| 0.60 *(default)* | | | | | |
| 0.75 | | | | | |
| 0.90 | | | | | |

### Smoothing — needle calm vs. laggy

| Value | B held note: needle calm? | G fast changes: lag noticeable? | Notes |
|---|---|---|---|
| 1 (off) | | | |
| 6 | | | |
| 12 *(default)* | | | |
| 24 | | | |

### Confirm — note flicker vs. switch latency / false commits

| Value | F/B octave or neighbour flicker? | G time to switch on a real change | D false note from noise? | Notes |
|---|---|---|---|---|
| 1 (off) | | | | |
| 4 *(default)* | | | | |
| 7 | | | | |
| 10 | | | | |

### Filter toggle (reference, not a sweep)

| | What you should see |
|---|---|
| Filter OFF | raw detector: jumpy note + cents, octave errors, noise registers as notes |
| Filter ON | gated + smoothed: should be the experience the sliders above tune |

### Hold + Accuracy (scaletuner only)

| Setting | Value tried | Feels too easy / too hard / right | Notes |
|---|---|---|---|
| Hold (Kesto) | 0.2 / 0.5 / 1.0 / 2.0 s | | |
| Accuracy | 35 / 20 / 10 ¢ | | |

## Findings — recommended defaults & ranges

Fill once the sweeps are done. "Works from/to" = the range that behaved acceptably.

### Measured results (2026-06-06, phone mic + violin)

Resolved sweet spots from a real device sweep (full per-scenario cells not logged —
only the values that landed). These feed the **3-step "Mittausnopeus" slider** task
(see `docs/todo.md`): the middle/default step uses the measured smoothing 5 / confirm 4.

| Setting | Works from | Works to | Recommended default | Reason / notes |
|---|---|---|---|---|
| Sensitivity | — | — | **1** | pinned max; quiet notes must still register |
| Clarity | 0.5 | 0.6 | **0.5** | 0.5 is best; 0.6 also good |
| Smoothing | 1 (fast reactions) | 12 (slow reactions) | **5** | 1 = fast/jumpy, 12 = slow/laggy; 5 is the balanced sweet spot |
| Confirm | 1 (fast reactions) | 7 (slow reactions) | **4** | 1 = fast switching, 7 = slow switching; 4 is balanced |
| Hold (scaletuner) | | | | not measured |
| Accuracy (scaletuner) | | | | not measured |

## After filling this in

Apply the chosen numbers in code and keep the docs in sync:

- `app/src/lib/audio/tuner.ts` — `DEFAULT_TUNER_SETTINGS`, `DEFAULT_CLARITY_THRESHOLD`,
  and the `*_FRAMES` / `*_MAX` constants (slider ranges) if a range needs widening.
- `docs/tuner-pitch-detection.md` — the "Clarity threshold by use case" section
  (authoritative current defaults + rationale).
