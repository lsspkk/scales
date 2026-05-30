# Virittäminen — production tuner screen (Task 29)

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
|   Herkkyys            [ Oletus ]       |   SimpleTunerControls
|   ●────────○────────●                      |   1..5 slider (default 3)
|   Nopea          Hidas               |
+--------------------------------------------+
```

Only start/stop, the dial (which carries the note + cents readout), and the
calmness slider. **No debug info** — clarity / raw→smoothed cents / `pidossa`
stay on the test pages. The full four-knob `TunerControls` is untouched and
test-page-only. On desktop the `DesktopNavBar` carries the title; the mobile
`ScreenHeader` (red) gives the back arrow.

## The one control — a 5-step "calmness" slider

`SimpleTunerControls` exposes a single 1..5 slider (Finnish **Herkkyys**,
ends labelled **Nopea** / **Hidas**) plus an **Oletus** (reset-to-default)
button that is disabled while already at the default.

**Why one slider, and why it only calms (never gates).** The test-page
`TunerControls` expose four independent knobs. Two of them — `sensitivity` +
`clarityThreshold` — _gate_ (reject) frames; too tight and the needle goes dead.
The other two — `smoothingFrames` + `confirmFrames` — only _calm_ the reading
(worst case a slightly laggy needle, never a dead one). The old "Filter ON" felt
worse precisely because it conflated the two. So the production slider drives
**only the smoothing stage**; gating is pinned permissive at every step. Full
rationale: `docs/tuner-pitch-detection.md`, "Production filter — one calmness
slider, permissive gating".

### Step → settings mapping (`calmnessToSettings` in `tunerStore.ts`)

| Step            | `smoothingFrames` | `confirmFrames` | `sensitivity` | `clarityThreshold` |
| --------------- | ----------------- | --------------- | ------------- | ------------------ |
| 1 (Nopea)       | 1 (≈ off)         | 1               | **1** (max)   | 0.6 (locked)       |
| 2               | 6                 | 2               | **1**         | 0.6                |
| **3 (default)** | **12**            | **4**           | **1**         | **0.6**            |
| 4               | 18                | 6               | **1**         | 0.6                |
| 5 (Hidas)       | 24                | 8               | **1**         | 0.6                |

- `sensitivity` is **pinned max** at every step — we want to hear quiet notes.
- `clarityThreshold` is **locked low (~0.6), not ramped** — the slider means
  "how calm", not "how picky". Bias toward the known-good "filter off" feel; the
  locked value can rise later once we have real mobile-violin measurements (none
  yet, so start permissive on purpose).
- Step 3 ≈ the Task 28 defaults (`DEFAULT_SMOOTHING_FRAMES` 12 /
  `DEFAULT_CONFIRM_FRAMES` 4) and is the baked zero-config default.

## Persistence

`tunerStore` is a Zustand `persist` store (localStorage key `tuner-store`,
`partialize` → `{ calmness }`). It holds only the slider step:

- `calmness` — current step, clamped 1..5.
- `setCalmness(step)` — set + persist.
- `reset()` — restore `DEFAULT_CALMNESS` (3).

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
- **Oletus** restores step 3.
