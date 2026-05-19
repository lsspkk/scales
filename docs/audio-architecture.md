# Audio Architecture

Polyphonic sample-based audio engine. Foundation for a future drone background in Soittohetki; today it powers the developer-only `#/test/audio` page. Tuning anchor: **A4 = 442 Hz**.

For prior options and pitch math see `docs/audio-research.md`. For the per-sample detection log see `docs/audio-samples.md`.

---

## Module map

```
app/src/lib/audio/
  tuning.ts        — A4=442 constant + MIDI↔Hz↔name helpers (no env deps)
  pitchDetect.ts   — YIN pitch detector over Float32Array (no env deps)
  samples.ts       — manifest: id, src URL, recorded rootMidi, label
  chords.ts        — chord-type → interval list table
  audioService.ts  — AudioContext + buffer cache + voice playback

app/src/hooks/
  useAudio.ts      — thin React wrapper around audioService

app/src/screens/
  AudioTest.tsx    — DEBUG / TEST ROUTE at #/test/audio

scripts/
  detect-pitch.mjs — Node CLI wrapping pitchDetect.ts with ffmpeg decoding
```

All cross-module imports inside `lib/audio/` use explicit `.ts` extensions so the same source files can be loaded by Node's `--experimental-strip-types` for the CLI.

---

## What shipped

### Web Audio nodes per chord voice

```
            ┌─────────────────────────┐
            │ shared AudioBuffer      │  (decoded once, cached by sample id)
            └────────────┬────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ BufferSource │ │ BufferSource │ │ BufferSource │   detune = (target-root)*100 cents
│  + detune    │ │  + detune    │ │  + detune    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       ▼                ▼                ▼
   GainNode         GainNode         GainNode          per-voice envelope
       └────────────────┼────────────────┘
                        ▼
                    masterGain  ───►  destination
```

- One `AudioContext` lives in a module-level variable. It is **lazy** — created on the first `playChord` call (browser autoplay rules) and reused afterwards.
- Decoded samples are kept in `bufferCache: Map<sampleId, AudioBuffer>`. A second `bufferPromises` map de-duplicates concurrent decode requests for the same id.
- `AudioBufferSourceNode` is single-use (start once, stop once, discard). `playChord` allocates `intervals.length` fresh source+gain pairs each call and drops them into an `activeVoices` array.
- `stopAll` releases everything currently sounding with a short fade, then schedules each source to `.stop()` after the fade completes.

### Voice lifecycle

| Phase | What happens |
|---|---|
| Start | `gain.value = 0` → linear ramp to `VOICE_GAIN` over 40 ms (`ATTACK_SECONDS`). |
| Sustain | Source plays the cached buffer. Each source's `loop` flag is set from `playChord({ loop })` — `true` repeats the buffer indefinitely, `false` plays it once. |
| Stop | Linear ramp back to 0 over 250 ms (`RELEASE_SECONDS`), then `source.stop()` 50 ms later. `stopAll` releases everything currently sounding, including looped voices. |

Linear ramps were chosen over exponential because the only goal is anti-click smoothing on a soft pad sample. The shape is inaudible; a setter for it can be added if needed.

### Looping (added Task 25)

`playChord({ ..., loop: true })` sets `AudioBufferSourceNode.loop = true` on every voice for that call. The buffer's natural length is the loop period (e.g. ~30 s for the shipped pad samples). When the playhead wraps, the buffer restarts from sample 0 — there is **no crossfade**, so any non-zero level at the buffer's end produces an audible seam. The shipped pad samples taper out toward silence and loop cleanly enough for a kid-friendly drone; record future samples with a near-silent tail to keep that property, or revisit this when crossfaded looping is needed.

Voice envelopes (40 ms attack / 250 ms release) apply once per `playChord` call — not per loop iteration. The loop is seamless from an envelope standpoint.

`stopAll` releases looped voices the same way it releases single-shot ones: ramp gain to 0 over 250 ms, then `source.stop()`. No special "stop loop" API — the single `activeVoices` group covers the v1 use case where only one drone or chord plays at a time.

### Master volume (added Task 25)

`setMasterVolume(0..1)` writes to the existing `masterGain` and persists in module state, so:

- A volume set **before** the first `playChord` is applied when the AudioContext wakes (the masterGain node is created with `masterVolume` as its initial gain).
- A volume set **during** playback ramps via `setTargetAtTime` with a 20 ms time constant — slider drag is smooth, no zipper noise, no restart of the loop.
- `getMasterVolume()` returns the current value (used by the Soittohetki slider to initialise its UI from the engine).

The slider in Soittohetki defaults to **0.6** on mount and pushes that through so the first listen is comfortable.

### Tuning

`tuning.ts` exposes one number — `A4_HZ = 442` — and four helpers (`midiToHz`, `hzToMidi`, `hzToMidiAndCents`, `noteNameToMidi`, `midiToNoteName`). The same module is used by both `audioService` and `pitchDetect`, so the engine and the detector always agree on what "A3" means.

For pitch-shifting the actual reference cancels out: `ratio = 2^((targetMidi - rootMidi) / 12)`. A=442 only matters when an absolute frequency is asked for (currently only the pitch detector's `cents` output).

The engine uses `source.detune` rather than `playbackRate`. They are equivalent for buffer sources, but cents-as-an-integer reads more naturally in the call site: `source.detune.value = semitoneOffset * 100`.

### Pitch detection

`pitchDetect.ts` implements **YIN** (de Cheveigné & Kawahara, 2002) — chosen because:

- It targets exactly this kind of input (sustained monophonic samples).
- It has a well-known octave-bias mitigation built in (the `cmnd[tau] = d(tau) · tau / Σd(j)` weighting).
- Autocorrelation alone was tried as a sanity check and confirmed YIN's results on two of three samples; YIN was kept because the math extends cleanly to a future tuner.

Settings: window = `4 × tauMax`, threshold = 0.15, fallback to global minimum if no dip crosses the threshold. The pure function returns `{ hz, midi, noteName, cents, confidence }`; no smoothing or hysteresis — those belong in the tuner UI layer.

**Known limitation seen on the shipped samples:** `minor-space-F2.mp3` has an unusually sparse harmonic structure (strong fundamental at F2 ≈ 87 Hz + strong 4th harmonic at F4 ≈ 350 Hz with almost nothing between), and YIN's primary result lands on a pseudo-period at C#2 (~70 Hz). A NumPy autocorrelation pass (in `docs/audio-samples.md`) recovered the true F2 fundamental. The manifest is set to F2; the discrepancy is documented rather than papered over.

### Sample naming + manifest

Files are stored in `app/public/samples/` and named `<mood>-<texture>-<pitch>.mp3` (e.g. `major-pad-G4.mp3`). The pitch in the filename is for humans; the manifest (`samples.ts`) is the runtime source of truth and computes `rootMidi` via `noteNameToMidi('G4')` so a typo in the filename and the manifest can't drift apart silently.

---

## Why this approach (and what was rejected)

| Alternative | Why not |
|---|---|
| `HTMLAudioElement` + `playbackRate` | No precise scheduling, cloning per voice for polyphony is awkward, pitch and duration are coupled, glitchy on rapid restart. Sufficient for one-shot UI sound, not for a 3–4 voice drone. |
| **Web Audio + `AudioBufferSourceNode`** ✅ | Native, zero deps, true polyphony from one decoded buffer, per-voice envelopes are trivial. Slightly more code than Tone.js but leaves room to grow (filters, future seamless looping, drone crossfades) without committing to a framework. |
| Tone.js `Sampler` | ~50 KB transitive dep + a layer of abstraction we don't otherwise need. The whole shipping module here is ~120 lines; pulling in a framework for that is overkill. Will revisit if multi-zone sampling or precision scheduling lands later. |
| `ffmpeg-static` for the CLI | Heavy npm install just to decode three files. System `ffmpeg` is universally available on dev machines and CI runners; using it via `spawn` keeps the repo lean. The CLI errors with a clear message if `ffmpeg` is missing. |
| `audio-decode` (pure JS) for the CLI | Considered as the lightweight alternative; not chosen because system `ffmpeg` was already present on this machine and adds zero install weight. Swapping it in later is a one-function change in `scripts/detect-pitch.mjs`. |
| Autocorrelation-only detector | Tested as a first spike — works fine on the two cleaner samples, fails on `minor-space-F2.mp3` for the same reason YIN does (octave ambiguity). Kept YIN because it extends to a future tuner. |
| Filename as the only metadata | Considered. Kept manifest-as-source-of-truth so the engine never has to parse filenames at runtime; filename encoding is a human convenience. |

---

## How to add a new sample

1. Run `npm --prefix app run detect-pitch -- path/to/new-sample.mp3` to confirm its pitch.
2. Rename to `<mood>-<texture>-<noteName>.mp3` and drop in `app/public/samples/`.
3. Append an entry to `SAMPLES` in `app/src/lib/audio/samples.ts`.

That's it. The engine picks it up by `id`; the test page enumerates `SAMPLES` and renders a button automatically.

## How to add a new chord type

Append an entry to `CHORD_TYPES` in `app/src/lib/audio/chords.ts` (id, label, intervals). The engine takes intervals as data, and the test page enumerates `CHORD_TYPES`. For the chord to also be offered by Soittohetki, give it a compact label branch in `makeLabel` inside `app/src/lib/scaleChords.ts` (otherwise it falls back to "Root ChordTypeLabel").

Current chord types: major, minor, diminished, augmented, maj7, **minor7** (added Task 25 so aeolian can offer the diatonic m7), dom7, dim7.

---

## Known limitations

- **No crossfaded looping.** Looping via `AudioBufferSourceNode.loop = true` restarts the buffer at sample 0 with no overlap. Pad samples that fade to silence loop cleanly; samples with non-zero tails will click at the seam. A future seamless-loop pass would need a crossfade between two scheduled sources.
- **Single-zone pitch shift.** Each sample is one recording; large pitch shifts (>~7 semitones either way) will sound stretched. Soittohetki defaults the chord/drone root to **octave 3** (C3 = MIDI 48); with the `major-pad-G4` sample that's a -19 semitone shift on the lowest voice. Audible but tolerable as background; if it sounds too stretched in a real session, swap to a lower-pitched sample (e.g. record one at C3) or raise the default octave.
- **Per-voice gain has no UI.** `VOICE_GAIN` is hardcoded at 0.25; only the master gain is exposed.
- **AudioContext autoplay quirks.** The context only resumes on a real user gesture. Soittohetki triggers the first `resume()` on the Aloita button click — `setMasterVolume` calls before that point are stored in module state and applied when the context wakes.
- **YIN failure mode on `minor-space-F2.mp3`** (see above) — the manifest worked around it; if more samples like this appear, swap to an FFT-based first pass or add an autocorrelation second-opinion in `pitchDetect.ts`.

---

## Quick reference

```ts
import { playChord, stopAll, setMasterVolume } from '@/lib/audio/audioService'
import { CHORD_TYPES } from '@/lib/audio/chords'
import { noteNameToMidi } from '@/lib/audio/tuning'

// Set master gain (persisted across context creation)
setMasterVolume(0.6)

// Play C major from the major-pad sample, looping until stopAll()
await playChord({
  sampleId: 'major-pad',
  rootMidi: noteNameToMidi('C4'),
  intervals: CHORD_TYPES.find((c) => c.id === 'major')!.intervals,
  loop: true,
})

// Later
stopAll()
```

React components use the `useAudio()` hook, which wraps `playChord`/`stopAll`/`setMasterVolume`/`getMasterVolume` in stable callbacks.
