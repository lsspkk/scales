import { PitchDetector } from 'pitchy'
import { hzToMidiAndCents, midiToNoteName } from './tuning.ts'

/**
 * Live-tuner service. Pitch detection is the McLeod Pitch Method (MPM) via the
 * `pitchy` library, which returns a single comparable **clarity** value per
 * frame — that clarity is the accept/reject signal (see
 * docs/tuner-pitch-detection.md). This module owns the gating + smoothing so
 * the defaults sit in one place; the browser hook (useMicPitch) owns the audio
 * graph and feeds frames here.
 *
 * The offline sample CLI (`scripts/detect-pitch.mjs`) keeps using the YIN
 * detector in `pitchDetect.ts`; only this live path moved to `pitchy`.
 */

// 4096 (not 2048) so the lowest string sits across enough cycles to detect
// reliably: viola open-C (≈131 Hz) is only ~5–6 cycles in a 2048 window but
// ~11 in 4096. Costs a little latency, fine for tuning.
export const TUNER_FFT_SIZE = 4096
// Below the viola open-C (C3 ≈ 131 Hz at A=442) so it isn't clamped away, but
// well above its ~66 Hz sub-harmonic so octave errors are still rejected.
export const TUNER_MIN_HZ = 120
export const TUNER_MAX_HZ = 2800

// MPM accept gate: surface a note only when clarity ≥ this. Practical ranges by
// signal type: 0.90–0.95 clean instruments, 0.80–0.88 voice, 0.65–0.75 noisy
// rooms / cheap mics (see docs/tuner-pitch-detection.md for the breakdown — note
// the MPM paper's ~0.93 is the internal peak-pick constant k, not this gate).
// We ship 0.6 — below even the lenient range — because on a real phone mic a
// quietly- or roughly-bowed violin (weak strings, off-centre bowing) only cleared
// the gate near the slider's 0.5 minimum. The note-confirm hysteresis + the
// 120–2800 Hz clamp do the noise rejection the low gate gives up: random noise
// rarely holds the same note for `confirmFrames` frames. Slider-adjustable on the
// test page; raise it if a quiet room makes the readout twitch on noise.
export const DEFAULT_CLARITY_THRESHOLD = 0.6

// Stability defaults (Task 28). Frame counts run at the rAF rate (~60 fps), so
// ~12 frames ≈ 200 ms of cents smoothing and ~4 frames ≈ 65 ms to commit a new
// note label. A longer smoothing window than before makes the needle settle
// slowly on a held note instead of darting frame-to-frame, without lagging a
// real pitch change past a usable tuning latency.
export const DEFAULT_SMOOTHING_FRAMES = 12
export const DEFAULT_CONFIRM_FRAMES = 4
export const SMOOTHING_FRAMES_MAX = 24
export const CONFIRM_FRAMES_MAX = 10

// Beyond `confirmFrames`, a committed note is held this many extra unclear
// frames before it's released — stops a sustained note flickering away in the
// gaps between clear frames (~8 frames ≈ 130 ms of decay).
const HOLD_EXTRA_FRAMES = 8

const NOISE_FLOOR_MIN = 0.001
const NOISE_FLOOR_MAX = 0.05
const NOISE_FLOOR_EMA = 0.05
const GATE_MAX = 0.2

/**
 * Tuner knobs. `sensitivity` is the single user-facing concept (the volume
 * gate); `clarityThreshold` is an internal default exposed only as a secondary
 * slider on the test pages for finding the right value empirically.
 */
export interface TunerSettings {
  /** Higher = detects quieter notes (RMS gate closer to the adaptive floor). */
  sensitivity: number
  /** Minimum MPM clarity (0..1) to accept a note. Internal default ~0.9. */
  clarityThreshold: number
  /** When false, bypass the gates + smoothing and emit raw detection. */
  filterEnabled: boolean
  /** Median window length over cents readings; higher = calmer needle (1 = off). */
  smoothingFrames: number
  /** Consecutive frames on a new note required before its label is committed; higher = steadier note (1 = instant). */
  confirmFrames: number
}

export const DEFAULT_TUNER_SETTINGS: TunerSettings = {
  // 0.9 = volume gate at ~1.35× the noise floor (1× at max). High by default so a
  // quietly-bowed violin clears it; real phone-mic testing needed near-max here.
  sensitivity: 0.9,
  clarityThreshold: DEFAULT_CLARITY_THRESHOLD,
  filterEnabled: true,
  smoothingFrames: DEFAULT_SMOOTHING_FRAMES,
  confirmFrames: DEFAULT_CONFIRM_FRAMES,
}

export interface TunerReading {
  hz: number | null
  midi: number | null
  noteName: string | null
  cents: number | null
  /** Unsmoothed cents of this frame's raw detection (null when nothing detected this frame). */
  rawCents: number | null
  /** Raw MPM clarity in [0,1] for this frame — reported even when gated out. */
  clarity: number
  rms: number
  noiseFloor: number
  gate: number
  /** True when a confirmed note is being shown (includes the brief hold frames). */
  detected: boolean
  /** True when this reading is a held/decayed note, not a fresh detection this frame. */
  held: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export class Tuner {
  private noiseFloor = 0.005
  private centsHistory: number[] = []
  private detector: PitchDetector<Float32Array> | null = null
  private detectorSize = 0

  // Note-confirm hysteresis + hold state (Task 28). `committedMidi` is the note
  // currently shown; a *different* note must be seen for `confirmFrames` frames
  // before it replaces the committed one, and a committed note survives a short
  // run of unclear frames (`holdFrames`) before being released. `lastCents` /
  // `lastHz` are the last smoothed values, frozen and re-shown during a hold.
  private committedMidi: number | null = null
  private candidateMidi: number | null = null
  private candidateCount = 0
  private missCount = 0
  private lastCents: number | null = null
  private lastHz: number | null = null

  reset(): void {
    this.noiseFloor = 0.005
    this.centsHistory = []
    this.committedMidi = null
    this.candidateMidi = null
    this.candidateCount = 0
    this.missCount = 0
    this.lastCents = null
    this.lastHz = null
  }

  /** MPM detector sized to the frame length, created once and reused. */
  private getDetector(size: number): PitchDetector<Float32Array> {
    if (!this.detector || this.detectorSize !== size) {
      this.detector = PitchDetector.forFloat32Array(size)
      this.detectorSize = size
    }
    return this.detector
  }

  process(samples: Float32Array, sampleRate: number, settings: TunerSettings): TunerReading {
    let sumSq = 0
    for (let i = 0; i < samples.length; i++) sumSq += samples[i] * samples[i]
    const rms = Math.sqrt(sumSq / samples.length)

    const [rawHz, clarity] = this.getDetector(samples.length).findPitch(samples, sampleRate)
    // Clamp to the violin range; out-of-range = sub-/super-harmonic octave error.
    const hz = rawHz >= TUNER_MIN_HZ && rawHz <= TUNER_MAX_HZ ? rawHz : null

    // Raw bypass — show whatever the detector returns, no gate/smoothing/hysteresis.
    if (!settings.filterEnabled) {
      if (hz == null) return this.noNote(clarity, rms, 0)
      const { midi, cents } = hzToMidiAndCents(hz)
      return { hz, midi, noteName: midiToNoteName(midi), cents, rawCents: cents, clarity, rms, noiseFloor: this.noiseFloor, gate: 0, detected: true, held: false }
    }

    // sensitivity → RMS gate as a multiple of the adaptive noise floor (4.5× .. 1×).
    // Gentler than before so a quietly bowed string still clears the volume gate.
    const k = 4.5 - settings.sensitivity * 3.5
    const gate = clamp(this.noiseFloor * k, NOISE_FLOOR_MIN, GATE_MAX)
    const loud = rms >= gate
    const clear = hz != null && clarity >= settings.clarityThreshold

    if (loud && clear) {
      const { midi, cents } = hzToMidiAndCents(hz as number)
      return this.commit(midi, cents, hz as number, settings, clarity, rms, gate)
    }

    // Not a clear note this frame: adapt the noise floor from it (clamped so a
    // loud unclear sound can't drag the floor up to a real note's level), then
    // hold the last committed note briefly or report silence.
    this.noiseFloor = clamp(this.noiseFloor + (rms - this.noiseFloor) * NOISE_FLOOR_EMA, NOISE_FLOOR_MIN, NOISE_FLOOR_MAX)
    return this.release(settings, clarity, rms, gate)
  }

  /** Fold a clear detection into the hysteresis state and return what to show. */
  private commit(midi: number, rawCents: number, hz: number, settings: TunerSettings, clarity: number, rms: number, gate: number): TunerReading {
    this.missCount = 0
    const confirmFrames = Math.max(1, Math.round(settings.confirmFrames))

    if (midi === this.committedMidi) {
      this.candidateMidi = null
      this.candidateCount = 0
    } else {
      // A note other than the committed one — require N consecutive frames of it.
      if (midi === this.candidateMidi) this.candidateCount++
      else {
        this.candidateMidi = midi
        this.candidateCount = 1
      }
      if (this.candidateCount >= confirmFrames) {
        this.committedMidi = midi
        this.candidateMidi = null
        this.candidateCount = 0
        this.centsHistory = [] // fresh smoothing window for the new note
      }
    }

    if (this.committedMidi === null) {
      // Still confirming the first note — show nothing yet (report raw for debug).
      return { hz, midi: null, noteName: null, cents: null, rawCents, clarity, rms, noiseFloor: this.noiseFloor, gate, detected: false, held: false }
    }

    if (midi === this.committedMidi) {
      // Smooth cents only across frames that belong to the committed note.
      const hist = this.centsHistory
      hist.push(rawCents)
      const window = Math.max(1, Math.round(settings.smoothingFrames))
      while (hist.length > window) hist.shift()
      const sorted = [...hist].sort((a, b) => a - b)
      const cents = sorted[sorted.length >> 1]
      this.lastCents = cents
      this.lastHz = hz
      return { hz, midi, noteName: midiToNoteName(midi), cents, rawCents, clarity, rms, noiseFloor: this.noiseFloor, gate, detected: true, held: false }
    }

    // A different note is detected but not yet confirmed — hold the committed
    // note's last smoothed reading instead of flickering to the unconfirmed one.
    return { hz: this.lastHz, midi: this.committedMidi, noteName: midiToNoteName(this.committedMidi), cents: this.lastCents, rawCents, clarity, rms, noiseFloor: this.noiseFloor, gate, detected: true, held: true }
  }

  /** No clear note this frame — hold the committed note briefly, then release. */
  private release(settings: TunerSettings, clarity: number, rms: number, gate: number): TunerReading {
    // An unclear frame breaks any note we were building confidence in.
    this.candidateMidi = null
    this.candidateCount = 0

    if (this.committedMidi !== null) {
      this.missCount++
      const holdFrames = Math.max(1, Math.round(settings.confirmFrames)) + HOLD_EXTRA_FRAMES
      if (this.missCount <= holdFrames) {
        return { hz: this.lastHz, midi: this.committedMidi, noteName: midiToNoteName(this.committedMidi), cents: this.lastCents, rawCents: null, clarity, rms, noiseFloor: this.noiseFloor, gate, detected: true, held: true }
      }
      // Held long enough with no signal — release the note.
      this.committedMidi = null
      this.lastCents = null
      this.lastHz = null
      this.centsHistory = []
    }
    return this.noNote(clarity, rms, gate)
  }

  private noNote(clarity: number, rms: number, gate: number): TunerReading {
    return { hz: null, midi: null, noteName: null, cents: null, rawCents: null, clarity, rms, noiseFloor: this.noiseFloor, gate, detected: false, held: false }
  }
}

/**
 * One-shot MPM detection over a buffer. Used by the offline `--pitchy` path in
 * `scripts/detect-pitch.mjs` to validate this exact live algorithm without a
 * mic. Windows the middle of long files so the FFT stays cheap.
 */
export function detectPitchMPM(samples: Float32Array, sampleRate: number) {
  const WINDOW = 16384
  const size = Math.min(WINDOW, samples.length)
  const start = Math.max(0, (samples.length - size) >> 1)
  const buf = samples.subarray(start, start + size)
  const [hz, clarity] = PitchDetector.forFloat32Array(buf.length).findPitch(buf, sampleRate)
  if (!isFinite(hz) || hz <= 0) return { hz: null, clarity, midi: null, noteName: null, cents: null }
  const { midi, cents } = hzToMidiAndCents(hz)
  return { hz, clarity, midi, noteName: midiToNoteName(midi), cents }
}
