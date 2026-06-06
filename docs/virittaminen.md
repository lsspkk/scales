# Virittäminen — production tuner screen (Tasks 29, 31)

The user-facing violin tuner. Tasks 27–28 found good detection + stability
defaults on the hidden test pages (`#/test/tuner`, `#/test/scaletuner`); this
screen is the "fast, easy to use" payoff — calm and accurate with **zero
configuration**, plus one optional slider that persists per player.

- **Route:** `/virittaminen` — menu + nav title **"Virittäminen"**.
- **Screen:** `app/src/screens/Virittaminen.tsx`
- **Slider:** `app/src/components/ui/SimpleTunerControls.tsx`
- **Store:** `app/src/stores/tunerStore.ts`
- **Dial:** reuses `app/src/components/ui/TunerDial.tsx` as-is.

## Layout

```
+--------------------------------------------+
| ‹  Virittäminen / Viritä viulu      (red)  |   ScreenHeader (mobile)
+--------------------------------------------+
|        [ Avaa mikrofoni / Sulje mikrofoni ]        |   start/stop, full width ≤320px
|                                            |
|              ╭───────────╮                 |
|         ♭   (  VU dial   )   ♯             |   TunerDial (note + cents below)
|                  A4   +3 ¢                 |
|                                            |
|   Mittausnopeus       [ Oletus ]       |   SimpleTunerControls
|   ●────────○────────●                      |   1..3 slider (default 2)
|   Nopea          Hidas               |
+--------------------------------------------+
```

Only start/stop, the dial (which carries the note + cents readout), and the
calmness slider. **No debug info** — clarity / raw→smoothed cents / `pidossa`
stay on the test pages. The full four-knob `TunerControls` is untouched and
test-page-only. On desktop the `DesktopNavBar` carries the title; the mobile
`ScreenHeader` (red) gives the back arrow.

## The one control — a 3-step "Mittausnopeus" slider

`SimpleTunerControls` exposes a single 1..3 slider (Finnish **Mittausnopeus**,
ends labelled **Nopea** / **Hidas**) plus an **Oletus** (reset-to-default)
button that is disabled while already at the default.

**Why one slider, and why it only calms (never gates).** The test-page
`TunerControls` expose four independent knobs. Two of them — `sensitivity` +
`clarityThreshold` — _gate_ (reject) frames; too tight and the needle goes dead.
The other two — `smoothingFrames` + `confirmFrames` — only _calm_ the reading
(worst case a slightly laggy needle, never a dead one). The old "Filter ON" felt
worse precisely because it conflated the two. So the production slider drives
**only the smoothing stage**; gating is pinned permissive at every step. Full
rationale: `docs/tuner-pitch-detection.md`, "Production filter".

### Step → settings mapping (`calmnessToSettings` in `tunerStore.ts`)

A real-device sweep (2026-06-06) settled the best values, so the 5-step range
collapsed to **3 choices**. The middle step is the measured sweet spot.

| Step             | `smoothingFrames` | `confirmFrames` | `sensitivity` | `clarityThreshold` |
| ---------------- | ----------------- | --------------- | ------------- | ------------------ |
| 1 (Nopea)        | 1 (≈ off)         | 1               | **1** (max)   | 0.5 (locked)       |
| **2 (default)**  | **5**             | **4**           | **1**         | **0.5**            |
| 3 (Hidas)        | 12                | 7               | **1**         | 0.5                |

- `sensitivity` is **pinned max** at every step — we want to hear quiet notes.
- `clarityThreshold` is **locked at 0.5** (measured best), not ramped — the
  slider means "how calm", not "how picky".
- Step 2 = the measured defaults (smoothing 5 / confirm 4) and is the baked
  zero-config default.

## Persistence

`tunerStore` is a Zustand `persist` store (localStorage key `tuner-store`,
`partialize` → `{ calmness }`). It holds only the slider step:

- `calmness` — current step, clamped 1..3. Values outside this range (e.g.
  from an old 5-step persist) are clamped on read, not crashed.
- `setCalmness(step)` — set + persist.
- `reset()` — restore `DEFAULT_CALMNESS` (2).

The screen reads `calmness`, runs it through `calmnessToSettings`, and passes the
result to `useMicPitch`. Settings flow into the running detector live via the
hook's settings ref (no mic restart), so dragging the slider re-calms instantly.

## Icon

Home card icon is a Boxicons "gauge" SVG (needle + arc), downloaded from the web
and stored at `app/src/assets/tuner-gauge.svg` for provenance; it is inlined into
`Home.tsx` as `TunerGaugeIcon` (parchment fill `rgba(255,251,233,0.9)`) to match
the existing `BookMusicIcon` / `ViolinIcon` pattern. Boxicons free license.

## Validation (manual)

- Default tuner is calm + accurate on sustained violin notes with no config.
- Changing the slider persists across reload.
- **Oletus** restores step 2.
