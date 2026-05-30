# Tuner pitch detection 

Recommendation: McLeod Pitch Method via `pitchy`

**Use a ready, published algorithm and a maintained implementation. Don't keep our own.**

- **Algorithm: MPM** (McLeod & Wyvill, *A Smarter Way to Find Pitch*, 2005). It is the
  method the most credible browser-tuner write-up (29a.ch) is built on, and it is
  purpose-designed for continuous pitch of monophonic *musical* sound.
- **Library: `pitchy`** (`ianprime0509/pitchy`) — a small, tested MPM implementation that
  returns `[pitch, clarity]`. This replaces `pitchDetect.ts` for the live path.

Why MPM specifically fits a violin tuner:

- It runs in real time at 44.1/48 kHz and, unlike many detectors, **uses no low-pass
  filtering**, so it copes with the strong high harmonics of a violin instead of being
  confused by them.
- Its **clarity** measure is a single, comparable 0..1 confidence — exactly the gate the
  old doc was trying to reconstruct from RMS + thresholds.

YIN is a legitimate alternative (it's a close cousin — CMNDF vs MPM's NSDF), and our
existing code works. But there's no upside to maintaining hand-rolled DSP when a tested
MPM library exists, and MPM's clarity output simplifies the gating layer.

### `pitchy` — library audit + verdict

I checked the library against the things that actually matter for adopting a dependency
here. **Verdict: yes, use it for the live path.**

| Criterion | `pitchy` | Notes |
|---|---|---|
| Algorithm | MPM (McLeod 2005) | exactly the method we want |
| License | **0BSD** | most permissive there is; fine for commercial use |
| Dependencies | **one: `fft.js`** | small, permissive (MIT), well-used; not "zero" but trivial |
| Types | first-class TypeScript | no `@types/*` needed |
| Format | pure ESM | fits Vite cleanly |
| Size | **~2.8 KB gzip** (8 KB min; 33 KB unpacked w/ types) | negligible next to the app |
| Popularity | ~40 k npm downloads/month | the de-facto JS MPM library; niche but established |
| Maintenance | v4.1.0 (Jan 2024); quiet since | stable finished library — but no activity in ~2 yr |
| Speed | FFT-based autocorrelation → **O(n·log n)** | faster than our O(n²) YIN double loop |

The performance line matters: `pitchy` (via its `fft.js` dependency) computes the NSDF
through an FFT (`autocorr = IFFT(|FFT(x)|²)`), so it's already the "FFT-accelerated" path
the old doc never mentioned — at 2048 it's well under a millisecond per frame.

Integration is a near drop-in for `tuner.ts` — same `Float32Array` from the analyser:

```ts
import { PitchDetector } from 'pitchy'

// once, sized to the analyser:
const detector = PitchDetector.forFloat32Array(analyser.fftSize) // 2048
detector.minVolumeDecibels = -40 // library-level silence gate (tune on test page)

// per frame (already have `buf` from analyser.getFloatTimeDomainData):
const [hz, clarity] = detector.findPitch(buf, ctx.sampleRate)
// gate: clarity >= 0.9 → trust hz; else treat as "no note"
```

Caveat worth a test-page check: `findPitch` always returns *some* `hz`; **clarity is the
real accept/reject signal** (same lesson as the old YIN `minConfidence` bug — gate on
clarity, not on the bare frequency).

### Build our own instead? (we now understand the algorithm)

Tempting, since we already have a hand-rolled YIN in the repo and now understand MPM end
to end. The honest answer: **no meaningful upside, a real downside.**

- **Accuracy: zero gain.** `pitchy` *is* MPM done correctly. Rolling our own runs the
  same math — we'd reproduce it, not improve on it.
- **Cost: we'd own it forever.** Every octave-error edge case and the FFT correctness
  become ours to maintain. The evidence is already on the table: our hand-rolled YIN
  shipped the `minConfidence` bug that caused the "only detects B4" symptom. Hand-rolled
  pitch DSP has cost us once already.
- **"Avoid a dependency" isn't a real argument here:** 2.8 KB gzipped, one tiny
  transitive dep (`fft.js`, MIT).

**Is the quiet maintenance a problem?** Last release was Jan 2024. Normally that's a
yellow flag — but here it's **neutralised by the licence + size.** pitchy is 0BSD and
~8 KB of source. If the author disappears or a bug needs fixing, we **vendor it**: copy
the source into `app/src/lib/audio/` and own it, with zero legal friction. That is the
*smart* version of "do it ourselves" — start from working, tested MPM code instead of a
blank file. So "is it maintained?" barely matters for a library this small and this
permissive.

**Commercial use: unrestricted.** 0BSD (pitchy) and MIT (`fft.js`) are both permissive —
no copyleft, no attribution-in-binary burden. Fine to ship.

**Decision: depend on `pitchy` now; keep vendoring as the escape hatch.** Don't write our
own MPM from scratch, and stop maintaining the YIN for the live path (the offline sample
CLI can keep it — see the plan below).

---

## Is there a more modern / better alternative? (checked May 2026)

Short answer: **no — for a solo-instrument tuner this is a solved problem, and
`pitchy`/MPM is the lean solution.** Two things confirmed by a fresh search:

**1. The browser has no native pitch-detection API.** `AnalyserNode` gives you FFT /
time-domain samples but *no* pitch — you always supply the algorithm yourself (a library
or hand-rolled). "Modern browsers solve this for you" is false: it's solved at the
*library* level, not the platform level. So the only question is *which* library.

**2. Nothing newer is both lighter and better for this job.** The field splits in three:

| Option | What it is | Verdict for our tuner |
|---|---|---|
| **`pitchy`** (MPM) | lean, tuner-focused, 2.8 KB gzip | **our pick** |
| **`pitchfinder`** | JS bag of algorithms (YIN, MPM, AMDF, wavelet), MIT | the one true peer — *same* MPM/YIN, bundled with weaker extras; fine as a fallback, not an upgrade |
| **Essentia.js / aubio** (WASM) | full MIR toolkits (incl. YIN / YinFFT), AudioWorklet-capable | overkill — hundreds of KB+ for features we don't need |
| **CREPE / SPICE** (TensorFlow.js) | neural, state-of-the-art accuracy, noise/polyphony-robust | overkill — MB-scale model download, WASM/WebGL, mobile battery + latency, a 16 kHz-resampling quirk; **no perceptible benefit on a clean solo violin** |

The "modern frontier" (CREPE 2018, SPICE 2019) is ML, and it only wins on *hard* signals
— noisy rooms, singing voice, polyphony, transcription. A single sustained violin note
into a phone mic is exactly the easy, monophonic case MPM was designed for; a neural net
buys accuracy we'd never hear, for megabytes and milliseconds we'd definitely feel.

So the algorithm question is settled, and in our favour: **YIN (2002) and MPM (2005) are
still the references for monophonic instrument tuning**, every lightweight JS library
implements one or both, and `pitchy` is the cleanest single-purpose MPM build. If `pitchy`
ever became a problem, `pitchfinder` (same algorithms, MIT) is the drop-in peer — a
sideways move, not an upgrade. There is no newer, lighter, *better* option for this job.

---

## How MPM works (so the settings below aren't magic numbers)

1. **NSDF** — the Normalized Square Difference Function. Plain SDF is
   `d(τ) = Σ (sᵢ − sᵢ₊τ)²`, which dips toward zero where the signal lines up with a
   delayed copy of itself. MPM normalizes it to `n(τ)` in `[-1, 1]` by dividing by the
   summed signal energy. Normalization is what makes peak heights comparable across loud
   and quiet input — and what gives a meaningful clarity number.
2. **Peak picking** — collect the maxima of `n(τ)` between its positive zero-crossings.
   Take the highest peak `nmax`, then pick the **first** peak whose height ≥ `k · nmax`.
   The constant **k = 0.93** (tunable 0.8–1.0; lower favours the lower octave). This
   "first tall-enough peak" rule is MPM's octave-error fix.
3. **Parabolic interpolation** around the chosen peak's lag → sub-sample period →
   ~1-cent frequency resolution. (Our YIN already does the equivalent.)
4. **Clarity** = the interpolated peak height of `n(τ)`, in `[0, 1]`. ~1.0 = a pure,
   confident tone; low = noise/no clear pitch. **This is the value to threshold on.**

---

## Concrete settings

| Setting | Value | Source / reason |
|---|---|---|
| Algorithm | **MPM** (`pitchy`) | 29a.ch; McLeod 2005; pitchy |
| Window / `fftSize` | **2048** baseline; **4096** if open-G (≈196 Hz) misreads | needs several low-string cycles; bigger = more latency/CPU |
| Sample rate | Whatever `AudioContext` gives (44.1 / 48 kHz) | MPM is real-time at both |
| MPM peak constant `k` | **0.93** | McLeod 2005 (range 0.8–1.0) |
| **Clarity** accept | start **≥ 0.9**; expose a slider on the test page | pitchy/audiojs "reliable" cutoff |
| Amplitude / RMS gate | reject silence only; **auto** = noise-floor × ~3 | keep `tuner.ts`'s adaptive floor for the silence case |
| Frequency bounds | **~180–2800 Hz** (open-G → high E positions) | clamps sub-/super-harmonic octave errors |
| Smoothing | **median of ~5** cents readings | kills per-frame jitter |
| Note hysteresis | require **~3 consecutive** frames on a note before committing | kills the octave-jump flicker |
| `getUserMedia` | DSP off: `echoCancellation`, `noiseSuppression`, `autoGainControl` false | speech DSP distorts pitch & level |
| Loop | rAF, frame work **< 16.7 ms** (60 fps) | leaves headroom on a phone |

Note ↔ Hz ↔ cents math is already correct in `tuning.ts`
(`12·log₂(f/ref)`, `cents = 1200·log₂(f/f_nearest)`) — unchanged.

### Clarity threshold by use case

The accept gate (`clarityThreshold` in `TunerSettings`) is the single MPM clarity
value a frame must clear to register as a note. Good starting ranges by signal type:

| Range | Use case | Notes |
|---|---|---|
| **0.90–0.95** | Instrument tuning (guitar, violin, piano) | The "golden standard." Instruments produce clean, periodic waveforms, so clarity sits high. The MPM/Tartini work uses ~**0.93** as its baseline (see the caveat below). |
| **0.80–0.88** | Singing / human voice | Vocal cords have micro-variation, vibrato and breathiness that pull clarity below a string's. Push above ~0.88 and a sustained voice can randomly drop out mid-note. |
| **0.65–0.75** | Lenient / noisy rooms, cheap phone mics | Registers pitches through background hum, at the cost of occasionally latching onto noise as a "note." |

**Accuracy caveat on the 0.93.** That number is MPM's internal **peak-pick constant
`k`** (pick the first NSDF peak ≥ `k·nmax`), not the accept threshold — it's a
different knob in the same neighbourhood, and `pitchy` already applies it internally
at its default. Our `clarityThreshold` is the *downstream* accept gate on the returned
clarity. So treat the ranges above as practical accept-gate guidance; they're sound,
just don't conflate them with `k`.

**Why this app ships 0.60, below even the lenient range** (defaults: `sensitivity
0.9`, `clarityThreshold 0.6`)**:** the goal is that a quietly- *or* roughly-bowed
violin on a phone mic still gets tuned. In real device testing the weak strings and
off-centre bowing only cleared the gate near the slider's 0.5 minimum, and the
volume gate needed near-max sensitivity, so the defaults are deliberately permissive.
The note-confirm hysteresis (`confirmFrames`) + the 120–2800 Hz clamp do the noise
rejection the low clarity gate gives up — random noise rarely holds the same note
for several consecutive frames. The test-page sliders re-tune this per device; raise
clarity / lower sensitivity if a quiet room makes the readout twitch on noise.

### Smoothing vs. confirmation — two stages, not redundant (researched, settled)

`smoothingFrames` ("Smoothing") and `confirmFrames` ("Confirm") look similar but
stabilize **two different quantities**, and each fixes a defect the other can't.
This is standard tuner practice — confirmed by external sources (below), so it does
not need re-researching.

| Knob | Stabilizes | Defect it fixes | Standard name in the literature |
|---|---|---|---|
| **Smoothing** (`smoothingFrames`) | the **continuous cents value** — needle position *within* a note | per-frame jitter: the needle/readout twitching ±a few cents on a steadily-held note | display / pitch-contour smoothing — "smooth the display so it doesn't flash a new value every frame"; median windows are the usual tool (e.g. the *Smart-Median* real-time pitch smoother) |
| **Confirm** (`confirmFrames`) | the **discrete note label** — *which* note is shown | note flicker: a single bad frame flipping the note to an octave or neighbour | "sticky" pitch / hysteresis / debounce — "make the earlier pitch sticky so a single frame detecting a different candidate (e.g. an octave) is ignored" |

**Why neither covers the other:** the cents-smoothing window **resets on every note
change** (`tuner.ts`, `this.centsHistory = []` in `commit()`). So the two run *in
sequence*: confirmation decides *which note* first, then smoothing calms the cents
*within* that confirmed note. Smoothing therefore gives zero protection against a
note flip (the window just resets), and confirmation does nothing for cents jitter
(the note identity isn't changing). Proof by turning one off:

- `confirmFrames = 1`, smoothing high → a stray octave-error frame instantly flips
  the *note name*; smoothing can't catch it.
- `smoothingFrames = 1`, confirm high → the note label is rock-steady, but the
  *needle* stays nervous on a held note because MPM's per-frame Hz estimate has noise.

**Verdict: keep both.** They are orthogonal — Confirm = stability of *which note*,
Smoothing = stability of *how in-tune*. The only thing they share is a little added
latency, which is why the defaults are modest.

Sources confirming both as standard, separate techniques:
- alexanderell.is, *Detecting pitch with the Web Audio API and autocorrelation* — the "sticky"/hysteresis approach for octave flips, **and** smoothing the display so it doesn't flash every frame — https://alexanderell.is/posts/tuner/
- *Smart-Median: A New Real-Time Algorithm for Smoothing Singing Pitch Contours* (MDPI, 2022) — median-window smoothing of the continuous pitch contour in real time — https://www.mdpi.com/2076-3417/12/14/7026
- FrequencyDetector.com — hysteresis used to keep detected pitch within a note's twelve-tone quantization range — https://frequencydetector.com/pitch-detector/

---

## Optional robustness (from 29a.ch — add only if the basics aren't enough)

These are the real-world tricks the old doc skipped. They matter most for noisy phone
mics; don't add them pre-emptively.

- **FFT-accelerated autocorrelation** — compute the difference/NSDF via FFT to drop the
  inner loop from **O(n²) → O(n·log n)**. Relevant if larger windows (4096) cost too
  much per frame. `pitchy` already handles its own cost; this matters only if we keep
  rolling our own.
- **Onset / attack locking** — take a reliable first estimate from the pluck/bow attack
  and bias toward it, instead of trusting every frame equally.
- **Kalman filter** — a principled alternative to the median window for fusing successive
  noisy estimates into a stable readout. Median + hysteresis is simpler and usually enough.
- **Off-main-thread detection** — whether to move the DSP to an `AudioWorklet` / Web
  Worker is its own question; the short answer for this workload is "not worth it yet."
  See `docs/tuner-web-workers.md` for the full reasoning.

---

## Plan for the implementation task

1. Add `pitchy`; replace the live detector in `tuner.ts` with MPM, gating on **clarity**
   (default ≥ 0.9) plus the existing adaptive RMS floor for silence.
2. Keep `pitchDetect.ts` (YIN) only for the offline `scripts/detect-pitch.mjs` sample
   detector — no need to touch that path.
3. On the test pages (`#/test/tuner`, `#/test/scaletuner`) expose: clarity slider,
   window 2048/4096, violin-range vs full-range, median length + frames-to-confirm, and
   a filter-off raw view. Use these to lock defaults empirically, **then** ship a tuner
   with zero sliders — just start/stop and the dial.

---

## Shipped (Task 27)

The live path now runs `pitchy` MPM; the offline sample CLI keeps YIN. Concretely:

- **`pitchy` (v4.1.0)** added to `app/package.json`. 0BSD, one tiny transitive dep
  (`fft.js`), first-class types.
- **`app/src/lib/audio/tuner.ts`** rewritten around `PitchDetector.forFloat32Array`:
  the `Tuner` class lazily builds one detector sized to the frame length (reused across
  frames, rebuilt only if the length changes), and calls `findPitch(buf, sampleRate)
  → [hz, clarity]` per frame. The hand-rolled YIN/confidence/fallback machinery is gone.
  - **Range clamp:** `hz` outside **180–2800 Hz** is treated as "no pitch" (kills
    sub-/super-harmonic octave errors). pitchy's internal `clarityThreshold` (the MPM
    peak-pick constant `k`) is left at its default; our accept gate is a *separate*
    comparison on the returned clarity.
  - **Clarity gate (filtered path):** a note is surfaced only when
    `clarity ≥ settings.clarityThreshold` (default **0.9**, `DEFAULT_CLARITY_THRESHOLD`).
    Below it → "no note", never a weak guess. There is no fallback flag anymore — clarity
    *is* the accept/reject signal.
  - **Volume gate = the single user-facing knob.** We kept the adaptive RMS noise-floor
    as the one volume gate (not pitchy's `minVolumeDecibels`, to avoid two overlapping
    gates); `sensitivity` maps it to a 6×..1.5× multiple of the floor. pitchy's
    `minVolume*` is left unset so our floor is the sole source of truth.
  - **Raw bypass** (`filterEnabled: false`) returns the bare range-clamped `findPitch`
    output, gates skipped. `clarity` is reported on *every* reading (even when gated
    out) so the test readout can show whether a frame would clear the gate.
  - Median-of-5 cents smoothing is retained as-is (proper smoothing/hysteresis is
    Task 28).
- **`TunerReading.confidence` → `clarity`** through `useMicPitch` and both test pages.
  `TunerSettings.noiseReduction` → **`clarityThreshold`**.
- **`TunerControls`** now surfaces **Herkkyys** (sensitivity, primary) + a secondary
  **Selkeysraja** clarity slider (0.5–1.0, value shown) + the filter ON/OFF toggle. Test
  readouts lead with `clarity 0.NN · …`. These control/state shapes are reusable for the
  Task 29 settings menu.
- **Offline aid:** `scripts/detect-pitch.mjs --pitchy` runs `detectPitchMPM` (exported
  from `tuner.ts` — the same MPM call as the live path, windowed for one-shot files).
  Confirmed on the shipped samples: G4 → clarity 0.90, A3 → clarity 0.95 (both correct);
  the low minor-space pad reads F1/F2 ambiguously but sits far below the 180 Hz violin
  clamp, so it never reaches the live tuner. Default YIN path unchanged.

Still manual-only: the mic/UI path (sustained violin notes across a loudness range)
must be verified in the browser on `#/test/tuner`.

---

## Shipped (Task 28) — detector-side stability

The per-frame `[hz, clarity]` from `pitchy` is steady enough to *accept*, but the
note label and cents still jumped frame-to-frame. Task 28 adds **detector-side**
smoothing + hysteresis inside the `Tuner` class — so the *reported reading*
itself is calmer, not just the dial easing on top of it. All of it sits on top of
the unchanged `pitchy` output (algorithm-agnostic).

**Three mechanisms, one small state machine** (`app/src/lib/audio/tuner.ts`):

1. **Cents smoothing** — a median over the last `smoothingFrames` cents readings
   *of the committed note* (median, not mean, so a single octave-error frame
   can't pull the value). The window resets when the note changes, so a new
   note's cents don't average against the old one. `smoothingFrames = 1` ⇒ off.
2. **Note-confirm hysteresis** — a note *different from* the committed one must
   be seen for `confirmFrames` consecutive clear frames before it replaces the
   label. This kills the brief octave-jump / neighbour-note flicker. A single
   unclear frame resets the candidate counter, so noise can't slowly accumulate
   into a false commit.
3. **Hold / decay** — once committed, a note survives `confirmFrames +
   HOLD_EXTRA_FRAMES` (8) unclear frames, re-showing its last smoothed cents,
   before it's released to "no note". This stops a sustained note flickering
   away in the inevitable gaps between clear frames (bow changes, vibrato dips).

The state (`committedMidi`, `candidateMidi`/`candidateCount`, `missCount`,
`lastCents`/`lastHz`) is cleared by `reset()` on every `start()`. The
`commit()` / `release()` split keeps each path readable.

**Defaults** (frame counts at the ~60 fps rAF rate):

| Setting | Default | ≈ time | Reason |
|---|---|---|---|
| `smoothingFrames` | **8** | ~130 ms | calm cents/needle without visible lag |
| `confirmFrames` | **4** | ~65 ms | steady label; still snaps to a real change fast |
| `HOLD_EXTRA_FRAMES` | 8 (internal) | ~130 ms | bridges clear-frame gaps on a held note |

These favour readability over instantaneous response, as the task asks.
`DEFAULT_SMOOTHING_FRAMES` / `DEFAULT_CONFIRM_FRAMES` are exported so Task 29 can
bake them as the zero-config production defaults.

**Reading shape.** `TunerReading` gained `rawCents` (this frame's unsmoothed
detection, `null` when nothing was detected this frame) and `held` (true when the
reading is a decayed/held note rather than a fresh detection). `detected` now
stays true across hold frames. These exist so the test readout can *prove* the
calming is the detector's: it shows `raaka +12¢→tasattu +3¢` and `pidossa` when
holding — distinguishing real detector smoothing from the CSS needle easing.

**Test-page controls.** `TunerControls` exposes the two experimental sliders —
**Tasaus** (`smoothingFrames`, 1–`SMOOTHING_FRAMES_MAX`) and **Sävelvarmistus**
(`confirmFrames`, 1–`CONFIRM_FRAMES_MAX`) — alongside the existing
Herkkyys/Selkeysraja knobs. Both test pages (`#/test/tuner`, `#/test/scaletuner`)
seed their state from `DEFAULT_TUNER_SETTINGS` and pass the values live through
`useMicPitch` (no detector restart — settings flow via the existing ref). The
control + state shapes are deliberately reusable for the Task 29 settings menu
(presets + saved custom + reset).

**Dial timing.** `TunerDial`'s 100 ms `transition-transform` on the needle was
left unchanged: with the now-calmer ~50 ms-throttled readings it eases gently and
*supports* the stabilised value instead of reintroducing nervous motion. A held
note simply freezes the needle at its last cents — no extra animation logic.

Manual validation (browser, sustained violin): note label, cents, and needle are
noticeably calmer at the defaults; a genuine pitch change still commits within a
practical tuning latency (~65 ms + smoothing).

## Production filter — one "calmness" slider, permissive gating (Task 29)

The test-page `TunerControls` expose four independent knobs (Herkkyys/sensitivity,
Selkeysraja/clarity, Tasaus/smoothing, Sävelvarmistus/confirm). That is right for
*finding* defaults but wrong for players. For the production screen
(`SimpleTunerControls`) we collapse them to a single **5-step slider**, and the
mapping is chosen deliberately, not just for fewer widgets.

**The old "Filter ON" felt worse because it conflated two unrelated jobs:**

1. **Gating** — `sensitivity` (volume floor) + `clarityThreshold` (tone-quality
   floor) *reject* frames. Too aggressive ⇒ real notes get dropped ⇒ the needle
   goes dead. A violin into a phone mic is a rough signal (bow noise, room, mic
   AGC), so its clarity number runs lower than a clean studio tone — a high
   `clarityThreshold` rejects perfectly good playing. This is what made
   "filter on" measurably worse than "filter off" in informal testing.
2. **Smoothing** — `smoothingFrames` / `confirmFrames` only *slow/calm* the
   reading (see Task 28 above). They never reject a note; worst case is a slightly
   laggy needle, never a dead one.

**Decision:** the 5-step slider drives **only the smoothing stage**, and never
re-tightens gating. So every step still sees every note — higher steps are just
calmer/steadier, not pickier. Concretely:

| Slider | smoothing/confirm | sensitivity | clarityThreshold |
|---|---|---|---|
| **1** (raw/fast) | minimal (≈ off) | **max** | permissive (locked, low) |
| **3** (default) | ≈ Task 28 defaults | **max** | permissive (locked, low) |
| **5** (calm/steady) | high | **max** | permissive (locked, low) |

- **`sensitivity` is pinned at max** at every step — we want to hear quiet notes;
  the volume floor was never the thing that helped.
- **`clarityThreshold` is locked at one low/permissive value (~0.6), not ramped.**
  The slider means "how calm," not "how picky"; if clarity rode the slider too,
  step 1 would also get noisier in a second, confusing dimension. We bias toward
  the known-good "filter off" behaviour (accept almost anything pitch-like) and
  can raise the locked value later **once we have real mobile-violin measurements**
  — none exist yet, so we start permissive on purpose.
- **Default = step 3:** noticeably calmer than raw, still responsive. The user can
  slide on the phone to taste; the result persists (`tunerStore`).

Net: the worst case is a slightly jumpy-but-accurate needle, never a silent one —
the failure mode that actually hurt before.

### Sources

- McLeod & Wyvill, *A Smarter Way to Find Pitch* (2005) — http://dl.icdst.org/pdfs/files4/b56e1f975f0b9b3fca904fb2a7778c15.pdf
- 29a.ch, *Building a (Web) Guitar Tuner* (MPM-based, real-world) — https://29a.ch/2020/04/15/guitar-tuner
- `pitchy` (MPM library) — https://github.com/ianprime0509/pitchy
- pitchdetector.com, *Real-Time Browser Pitch Detection Explained* — https://pitchdetector.com/real-time-browser-pitch-detection-explained/
- HackerNoon, *Guitar Tuner: Pitch Detection for Dummies* (intro-level; weakest of the set) — https://hackernoon.com/guitar-tuner-pitch-detection-for-dummies-ok8e35o9

Alternatives surveyed (May 2026):

- `pitchfinder` (YIN/MPM/AMDF/wavelet, MIT) — https://github.com/peterkhayes/pitchfinder
- Essentia.js (WASM MIR toolkit, AudioWorklet-capable) — https://transactions.ismir.net/articles/10.5334/tismir.111
- CREPE (neural, ICASSP 2018) — https://github.com/marl/crepe
- SPICE (self-supervised neural pitch, Google) — https://ai.googleblog.com/2019/11/spice-self-supervised-pitch-estimation.html
- Confirmation that there is no native Web Audio pitch API — https://www.musicalboard.com/blog/2026-05-05-pitch-detection/
