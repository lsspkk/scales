# Tuner Research — pitch detection in a mobile web browser

Research notes for the in-app violin tuner (the `#/test/tuner` and `#/test/scaletuner`
pages). Goal: stop improvising the detection settings and base them on documented
reference implementations. **No code changes here** — this is the design source for a
later tuning task. For the shipped detector see `docs/audio-architecture.md` (YIN) and
`docs/audio-samples.md`; for the test-page UX see `docs/harjoittelu-row-challenges.md` style.

---

## Sources read (May 2026)

1. **cwilso/PitchDetect** — the canonical Web Audio autocorrelation tuner (ACF2+).
   `https://github.com/cwilso/PitchDetect` (`js/pitchdetect.js`).
2. **audiojs/pitch-detection** — a library bundling YIN, McLeod, pYIN, autocorrelation,
   AMDF, HPS, etc., with a documented default threshold per algorithm.
   `https://github.com/audiojs/pitch-detection`.
3. **ianprime0509/pitchy** — small, well-tested **McLeod Pitch Method (MPM)** library
   built for real-time tuners; returns `[pitch, clarity]`. `https://github.com/ianprime0509/pitchy`.
4. **MusicalBoard blog — "How Browser-Based Pitch Detection Works"** — overview of
   Web Audio → WASM, the 60 fps / 16.7 ms budget, and a user-facing **sensitivity slider**.
   `https://www.musicalboard.com/blog/2026-05-05-pitch-detection/`.
5. (Alexander Ellis, "Detecting pitch with the Web Audio API and autocorrelation" —
   `https://alexanderell.is/posts/tuner/` — good narrative walk-through; fetch returned
   only the intro, listed for follow-up.)

---

## Algorithm landscape

All the practical browser tuners use a **time-domain monophonic** detector (not a raw FFT
peak, which is too coarse for cents-accurate tuning). Three candidates, simplest → most robust:

| Algorithm | Used by | Strength | Weakness |
|---|---|---|---|
| **Autocorrelation / ACF2+** | cwilso/PitchDetect | Tiny, easy, fast | Noise-sensitive; octave errors. (A community PR cut its error 30 % → 3.7 % with extra weighting.) |
| **YIN** (CMND + threshold) | audiojs, our code | "The reference algorithm for monophonic pitch estimation. Most cited, most tested, most robust." Built-in octave-bias fix. | O(window²); needs a good accept threshold. |
| **McLeod / MPM** | pitchy | Designed for real-time tuners; clean `clarity` 0..1 output | Slightly more code than ACF2+. |

**Conclusion:** our existing **YIN** (`lib/audio/pitchDetect.ts`) is a defensible choice —
it is *the* documented reference for solo-instrument tuning. MPM (via `pitchy`) is the main
alternative and is purpose-built for tuners; worth A/B-testing on the test page rather than
guessing. ACF2+ is the easy baseline but the least robust to phone-mic noise.

---

## Documented default settings

| Setting | Documented value | Source |
|---|---|---|
| AnalyserNode `fftSize` / buffer | **2048** (practical range 2048–4096) | cwilso; audiojs |
| RMS silence gate | **0.01** — below this, "not enough signal", return no pitch | cwilso |
| YIN accept threshold (CMND) | **0.15** — lower = stricter, fewer detections | audiojs / de Cheveigné |
| McLeod peak threshold | **0.9** of global max | audiojs |
| MPM `clarity` "reliable" cutoff | **≥ ~0.9** | pitchy / audiojs |
| Autocorrelation accept | **0.5** normalised correlation | audiojs |
| Frequency bounds (general) | **50–2000 Hz** | pitchy/pYIN |
| Sensitivity slider (min relative amplitude) | **0.001 – 0.1** (quiet room → higher, noisy → lower) | MusicalBoard |
| Frame budget | **~16.7 ms** for 60 fps | MusicalBoard |
| `getUserMedia` constraints | disable `echoCancellation`, `noiseSuppression`, `autoGainControl`, + legacy `googEchoCancellation/googAutoGainControl/googNoiseSuppression/googHighpassFilter` | cwilso |

Note → Hz / cents math (cwilso, matches our `tuning.ts`):
`semitones = 12·log2(f/ref)`, `midi = round(semitones)+69`, `cents = 1200·log2(f/f_nearest)`.

---

## ⚠️ What our current code gets wrong

The `minConfidence` gate I added to `useMicPitch` is **not a documented, comparable metric**
and is the cause of the "only detects B4" symptom:

- Our YIN returns `confidence = 1 − cmnd[tau]`. A clean tone gives cmnd ≈ 0.05–0.1
  (confidence 0.9–0.95); a real live note through a phone mic gives cmnd ≈ 0.2–0.5
  (confidence 0.5–0.8). So **`minConfidence: 0.9` rejected almost every live note** — only
  the rare strongly-resonant one passed.
- The documented YIN accept test is **whether a CMND dip crossed the 0.15 threshold**, i.e.
  `confidence ≥ 1 − 0.15 = 0.85`. The right knob is the **threshold (0.15)**, not an extra
  0.9 confidence gate.
- Worse: our `detectPitch` *always* returns a result (it falls back to the global CMND
  minimum when no dip crosses threshold). For a tuner that fallback is **garbage on noise**.
  The detector should tell the caller whether a real dip was found, and the live tuner should
  reject the fallback case rather than display it.

**Action for the later task:** drop the ad-hoc `minConfidence`; either (a) gate on
`confidence ≥ ~0.8` *and* a "real dip found" flag, or (b) switch the live path to MPM
(`pitchy`) and gate on `clarity ≥ 0.9`. Compare both on the test page.

---

## Tuning principles (what each knob does)

- **RMS / amplitude gate** — rejects silence and room hiss before detection. Too high =
  quiet notes ignored; too low = noise produces phantom pitches. Documented start: **0.01**.
- **Clarity / accept threshold** — the algorithm's own confidence the period is real. This,
  not RMS, is what separates a tone from noise. YIN: CMND threshold 0.15; MPM: clarity ≥ 0.9.
- **Buffer / fftSize** — bigger window = better low-frequency resolution (open-G 196 Hz needs
  more samples) but more latency and CPU. 2048 is the standard; bump to 4096 if low strings
  misread.
- **Frequency bounds (minHz/maxHz)** — clamping to the violin range (≈ **180–2800 Hz**,
  open-G to high E-string positions) prevents both sub-harmonic and harmonic octave errors.
- **Smoothing / hysteresis** — median the last few cents readings, *and* require N consecutive
  frames on the same note before committing the note name. This is what kills the octave-jump
  flicker; raw per-frame output always jitters.
- **getUserMedia DSP off** — echo cancellation / noise suppression / auto-gain are tuned for
  speech and distort both pitch and level. Always disable (incl. the legacy `goog*` keys for
  Android Chrome).

### Auto-sensitivity (the "few clever settings" idea)

A documented pattern that removes most manual tweaking: **measure the noise floor**. On start,
sample RMS for ~0.5 s while nothing is played, then set the RMS gate to `noiseFloor × k`
(k ≈ 3–4). Re-baseline on a button or when the user is idle. This adapts the one setting that
actually depends on the room/phone, so the final UI can hide it entirely.

---

## What to expose on the **test** pages (for tweaking)

The test pages exist precisely so we can find good defaults empirically before locking the
simple tuner. Recommended controls + live readout:

**Controls**
- Algorithm selector: **YIN** vs **MPM (pitchy)** vs **ACF2+** — same input, compare live.
- Clarity / accept threshold slider (per-algorithm range).
- RMS gate slider (0.001–0.1, log-ish) + an **"auto"** toggle (noise-floor calibration).
- Buffer size: 2048 / 4096.
- Min/Max Hz (or a "violin range" preset vs "full range").
- Smoothing: median window length + "frames to confirm note" (hysteresis).
- Filter on/off (already added) — bypasses gates/smoothing for raw comparison.

**Live readout (already partly added)**
- Detected Hz, note + cents, **clarity/confidence**, **current RMS** vs gate, and whether the
  result came from a real threshold crossing or the fallback. Seeing clarity vs RMS side by
  side is what tells us where the real cutoffs should sit.

---

## Recommended starting defaults for the final (simple) tuner

Once the test page confirms them:

- Algorithm: YIN (keep in-house) **or** MPM via `pitchy` — decide from the A/B test.
- `fftSize` 2048; violin range ~180–2800 Hz.
- RMS gate: auto (noise-floor × 3), fallback 0.01.
- Accept: YIN threshold 0.15 (≈ confidence ≥ 0.85) **and** a real dip; or MPM clarity ≥ 0.9.
- Smoothing: median of 5 cents readings; confirm note over ~3 consecutive frames.
- `getUserMedia`: all DSP off, incl. legacy `goog*`.
- rAF loop, keep frame work < 16 ms (it is, for YIN at 2048).

The shipped UI then needs **zero** sliders — just start/stop and the dial.
