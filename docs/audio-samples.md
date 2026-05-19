# Audio Samples — Detected Pitches

Output of `node --experimental-strip-types scripts/detect-pitch.mjs <file>` on the three pad/drone samples that ship with the app. Tuning reference: **A4 = 442 Hz**.

| File (renamed) | Detected pitch | Confidence | Notes |
|---|---|---|---|
| `app/public/samples/major-pad-G4.mp3` | **G4** — 388.6 Hz (MIDI 67, −23 cents) | 0.70 | YIN result. FFT cross-check: strongest spectral content clustered at 390–395 Hz. Recording sits a few cents flat of G4 at A=442. The original `major-pad.mp3` shipped with a non-standard container header that ffmpeg accepted but the browser's `decodeAudioData` rejected ("unknown content type"); it was re-encoded in place via `ffmpeg -i broken.mp3 -codec:a libmp3lame -b:a 192k clean.mp3`, salvaging ~26 s of clean audio out of the 53 s original. Pitch detection result was unchanged after re-encoding. |
| `app/public/samples/major-space-A3.mp3` | **A3** — 220.9 Hz (MIDI 57, ±0 cents) | 0.95 | Cleanest of the three. YIN and FFT agree; harmonic stack 220 / 441 / 660 Hz (A3 / A4 / E5). |
| `app/public/samples/minor-space-F2.mp3` | **F2** (chosen by FFT cross-check) | 0.44 (YIN) | YIN's primary result was C#2 (~70 Hz). FFT cross-check (and an autocorrelation second-opinion via NumPy) revealed the real fundamental at **F2 ≈ 87.5 Hz** with the dominant harmonic at F4 ≈ 350 Hz. The sample has an unusually sparse harmonic structure (strong fundamental + strong 4th harmonic, almost no 2nd/3rd), which is the textbook YIN failure mode — the cumulative-mean-normalised difference biases against the long-tau dip when there are many small dips at shorter tau. Manifest uses F2; the discrepancy is documented and accepted. |

## How to reproduce

From the repo root:

```bash
npm --prefix app run detect-pitch -- app/public/samples/major-pad-G4.mp3 app/public/samples/major-space-A3.mp3 app/public/samples/minor-space-F2.mp3
```

Or with JSON output:

```bash
node --experimental-strip-types scripts/detect-pitch.mjs --json app/public/samples/major-pad-G4.mp3
```

The CLI uses system `ffmpeg` to decode files to 48 kHz mono 32-bit-float PCM, then delegates to the pure detector at `app/src/lib/audio/pitchDetect.ts`. Node ≥ 22.6 is required for the experimental TS type-stripping flag.

## Naming convention

`<mood>-<texture>-<pitch>.mp3` — preserves the original `<mood>-<texture>` ordering and appends the detected sample pitch so the filename alone is enough to compute pitch-shift ratios. The runtime manifest (`app/src/lib/audio/samples.ts`) is still the source of truth; filename encoding is for humans.
