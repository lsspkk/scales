# Audio System — Initial Architecture Notes

Research note for the upcoming audio system (Task 24). Goal: turn the static one-note sample files in `app/public/` into a small polyphonic drone engine that can play any chord on any root, tuned to **A = 442 Hz**.

This document captures **initial considerations and open questions**. Final architectural choices and rationale belong in `docs/audio-architecture.md`, which is a deliverable of Task 24.

---

## The problem in one paragraph

Each `*.mp3` in `app/public/` contains one sustained pitch ("pad" / "space" style — long, soft, sample-able). To build a chord-drone we need to (a) play several pitch-shifted copies of the same sample at the same time, (b) pick pitches that form a named chord (maj, min, dim, aug, maj7, dom7, dim7), and (c) anchor the tuning to A = 442 Hz, not the standard 440 Hz. The system should be reusable: today for a test page, later as the actual drone background in Soittohetki.

---

## Options considered

| Approach | Polyphony | Pitch shift | Pros | Cons |
|---|---|---|---|---|
| `<audio>` / `HTMLAudioElement` | One element per voice — clones needed | `playbackRate` only (changes speed too) | Trivial to use, no decoding step | No precise scheduling, hard to mix N voices from one decoded source, glitchy on rapid restart |
| **Web Audio API + `AudioBufferSourceNode`** | Cheap: many one-shot sources from one decoded `AudioBuffer` | `playbackRate` and/or `detune` (cents) | Native, no dependency, true polyphony, envelope/gain trivial | Manual envelope, manual lifecycle (sources are one-shot), pitch is duration-coupled |
| Tone.js `Sampler` | Built in | Built in (multi-zone, auto-pitch) | Almost no code; handles release tails | ~50 KB dep for a small feature; abstraction we don't otherwise need |

Leaning toward **Web Audio API + `AudioBufferSourceNode`** — small enough to own outright, and it leaves room to grow (envelopes, filters, future drone crossfades) without a framework. Final call belongs to the implementation, after a quick spike.

---

## What each sample needs to know about itself

A sample is a recording of one note. To pitch-shift it correctly, the audio service must know **which note that recording IS**. So each sample needs metadata:

- `id` — stable string used by the UI / service (e.g. `pad-major`, `space-minor`)
- `src` — URL of the audio file
- `rootPitch` — the actual pitch of the sample, as MIDI number or note name (e.g. `A3` = MIDI 57)
- optionally: human label, suggested gain, loop points (future)

This pairs nicely with renaming the files so the filename itself encodes the root pitch — e.g. `pad-major-A3.mp3`. Decision left to implementation; both filename-encoded and manifest-only approaches are viable.

> The current filenames (`major-pad.mp3`, `major-space.mp3`, `minor-space.mp3`) do not encode the recorded pitch. Step 0 of the task is to identify each sample's actual root pitch and bake it into the metadata.

---

## Pitch math at A = 442 Hz

Given a sample whose recorded pitch is `rootMidi` and a desired output pitch `targetMidi`, the rate ratio is:

```
ratio = 2^((targetMidi - rootMidi) / 12)
```

The 442-Hz tuning anchor doesn't change this formula — it only changes the mapping from note name to absolute frequency, which matters when comparing against an external instrument (tuner, drone, violin). Since both `rootMidi` and `targetMidi` are derived from the same reference, the ratio cancels the reference out **as long as the reference is consistent**. So practically:

- Pick A = 442 Hz as the single reference constant in one place (e.g. `lib/audio/tuning.ts`).
- Use it whenever an absolute frequency is needed (e.g. for a future synth tone, tuner, or A-drone calibration). It is **not** needed in the buffer-source-rate calculation above.

`detune` (cents) is equivalent to `playbackRate` for buffer sources: `100 cents = 1 semitone`. Implementation may use whichever reads more naturally.

---

## Chord intervals (semitones from root)

Fixed pool the test page must support. These are the standard interval stacks; the audio service should accept them as data, not as hard-coded "play a major chord" methods.

| Chord | Intervals (semitones from root) | Voices |
|---|---|---|
| major | 0, 4, 7 | 3 |
| minor | 0, 3, 7 | 3 |
| diminished | 0, 3, 6 | 3 |
| augmented | 0, 4, 8 | 3 |
| maj7 | 0, 4, 7, 11 | 4 |
| dominant 7 | 0, 4, 7, 10 | 4 |
| dim7 | 0, 3, 6, 9 | 4 |

The audio service should not "know" the names — it plays a set of MIDI numbers. A small `chords.ts` table maps name → interval list. This keeps room for future chord types (sus2, sus4, min7, mMaj7…) without touching the engine.

---

## Voice lifecycle

`AudioBufferSourceNode` is single-use: start once, stop once, discard. So "play a chord" creates 3–4 fresh source nodes from the cached buffer, each routed through its own gain node (for an attack/release envelope) into a shared output gain → destination.

Open questions for implementation:

- **Attack/release shape** — short linear ramps (5–30 ms) should be enough to avoid clicks. Drone style probably wants a longer release (200–500 ms) when the chord is stopped, so chords blend instead of cutting.
- **Stop semantics** — does tapping a second chord stop the first, or layer? For the test page, simplest is "tap chord = stop everything currently playing, start this chord" with an explicit "Stop" button. Layering can come later.
- **Looping** — the current samples are long enough to be a sustained background for the duration of one Soittohetki, so v1 can ignore seamless looping. Mark it as a known limitation in the final architecture doc.
- **Audio context lifecycle** — browsers require a user gesture to start an `AudioContext`. The service should lazy-init on the first user interaction and reuse the same context after that.

---

## Pitch detection (sample identification + future tuner)

Phase 0 of Task 24 builds a portable pitch detector so the existing samples can be identified programmatically, and so the same code can later power an in-app tuner. The algorithm runs on a raw `Float32Array` of mono PCM — environment-agnostic, so the file lives in `app/src/lib/audio/pitchDetect.ts` with no browser- or Node-only imports.

### Algorithm candidates

| Algorithm | Strength | Weakness | Fit for these samples |
|---|---|---|---|
| **YIN** (de Cheveigné & Kawahara, 2002) | Robust on sustained monophonic content, low octave-error rate, well-known reference implementations | Slightly more code than autocorrelation; needs careful threshold tuning | Excellent — pad/space samples are exactly its target case |
| Autocorrelation (with peak picking) | Simple, ~30 lines | Octave errors on low pitches, sensitive to noise | OK as a fallback / first spike |
| FFT peak picking | Good for clean harmonic content | Bin resolution caps accuracy at low pitches without zero-padding | Workable but more code for less benefit here |

Leaning **YIN** for the shipped implementation, with autocorrelation acceptable as a first-spike step. The choice and the discarded alternatives belong in `audio-architecture.md` once implementation lands.

### Two callers, one core

```
                ┌──────────────────────────────┐
                │ pitchDetect.ts               │  pure: Float32Array → {hz, midi, …}
                └──────────────┬───────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
  scripts/detect-pitch.mjs            future: app tuner
  (Node — file I/O + decode)          (browser — AnalyserNode / AudioWorklet)
```

The core function knows nothing about files, microphones, or AudioContext. Both wrappers feed it the same shape of data.

### CLI shape

Suggested:

```
node scripts/detect-pitch.mjs path/to/sample.mp3
# → detected: A3 (220.84 Hz, MIDI 57, +6 cents) confidence 0.97

node scripts/detect-pitch.mjs --json path/to/sample.mp3
# → {"hz":220.84,"midi":57,"noteName":"A3","cents":6,"confidence":0.97}
```

Decoding library left open. Candidates: `audio-decode` (pure JS, handles mp3/ogg/wav), `node-wav` (wav only — simplest if samples get converted to wav), `ffmpeg-static` + spawn (heavy but universal). Pick by trying the lightest one first.

### Future tuner

Not part of Task 24, but the constraint on `pitchDetect.ts` (no env-specific imports, no buffering policy, no smoothing built in) exists so a later tuner can:
- Pull a frame from an `AnalyserNode` or `AudioWorklet`.
- Call the same `detectPitch()` once per frame.
- Apply UI-side smoothing / hold-and-release on top.

The smoothing belongs to the tuner UI layer, not the detector — keep the detector pure.

---

## Open questions left to implementation

- Web Audio direct vs. tiny wrapper (e.g. tone.js Sampler) — decide after a 30-minute spike.
- File naming convention: encode pitch in filename vs. keep manifest as the source of truth.
- Whether to ship one big sample for each "color" or several per color across an octave (multi-zone sampling) — single-sample is fine until pitch shifts get audibly stretched (> ~7 semitones either way).
- Envelope curves (linear vs. exponential ramps).
- Where the audio service file lives — likely `app/src/lib/audio/` with `audioService.ts`, `chords.ts`, `samples.ts` (manifest), `pitchDetect.ts` (Phase 0), `tuning.ts`, and a `useAudio` React hook for components.
- Which Node audio-decoding library to use for the CLI (pure-JS `audio-decode` vs. wav-only `node-wav` vs. `ffmpeg-static`).
- Detector algorithm (YIN vs. autocorrelation vs. FFT) — see the dedicated section above.

These are noted here so the implementation can pick deliberately rather than reinventing the question.
