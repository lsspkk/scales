import { detectPitch } from './pitchDetect.ts'

/**
 * Live-tuner service: documented detection settings + an adaptive noise floor,
 * wrapping the pure YIN detector. The browser hook (useMicPitch) owns the audio
 * graph and feeds frames here; all gating/smoothing lives in this module so the
 * defaults sit in one place. See docs/tuner-research.md.
 */

export const TUNER_FFT_SIZE = 2048
export const YIN_THRESHOLD = 0.15
export const TUNER_MIN_HZ = 180 // just below open-G (≈197 Hz)
export const TUNER_MAX_HZ = 2800

const SMOOTHING_FRAMES = 5
const NOISE_FLOOR_MIN = 0.001
const NOISE_FLOOR_MAX = 0.05
const NOISE_FLOOR_EMA = 0.05
const GATE_MAX = 0.2

/** Two simple 0..1 knobs surfaced as sliders on the test pages. */
export interface TunerSettings {
  /** Higher = detects quieter notes (gate closer to the noise floor). */
  sensitivity: number
  /** Higher = rejects noisier/less-clear detections more strictly. */
  noiseReduction: number
  /** When false, bypass the gates + smoothing and emit raw detection. */
  filterEnabled: boolean
}

export const DEFAULT_TUNER_SETTINGS: TunerSettings = {
  sensitivity: 0.5,
  noiseReduction: 0.4,
  filterEnabled: true,
}

export interface TunerReading {
  hz: number | null
  midi: number | null
  noteName: string | null
  cents: number | null
  confidence: number
  rms: number
  noiseFloor: number
  gate: number
  /** True when the reading passed every gate (a real, clear note). */
  detected: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export class Tuner {
  private noiseFloor = 0.005
  private centsHistory: number[] = []

  reset(): void {
    this.noiseFloor = 0.005
    this.centsHistory = []
  }

  process(samples: Float32Array, sampleRate: number, settings: TunerSettings): TunerReading {
    let sumSq = 0
    for (let i = 0; i < samples.length; i++) sumSq += samples[i] * samples[i]
    const rms = Math.sqrt(sumSq / samples.length)

    const result = detectPitch(samples, sampleRate, {
      minHz: TUNER_MIN_HZ,
      maxHz: TUNER_MAX_HZ,
      threshold: YIN_THRESHOLD,
    })

    // Raw bypass — show whatever the detector returns.
    if (!settings.filterEnabled) {
      const detected = result.hz !== null
      return { ...result, rms, noiseFloor: this.noiseFloor, gate: 0, detected }
    }

    // sensitivity → gate as a multiple of the adaptive noise floor (6× .. 1.5×).
    const k = 6 - settings.sensitivity * 4.5
    const gate = clamp(this.noiseFloor * k, NOISE_FLOOR_MIN, GATE_MAX)
    // noiseReduction → required YIN confidence. >0.85 ⇒ a real CMND dip crossed
    // the threshold (not the fallback global minimum).
    const confidenceFloor = 0.8 + settings.noiseReduction * 0.17

    const loud = rms >= gate
    const clear = result.hz !== null && result.cents !== null && result.confidence >= confidenceFloor

    if (!loud || !clear) {
      // Adapt the noise floor from frames that are not a clear note. Clamped so
      // a loud unclear sound can't drag it up to a real note's level.
      this.noiseFloor = clamp(this.noiseFloor + (rms - this.noiseFloor) * NOISE_FLOOR_EMA, NOISE_FLOOR_MIN, NOISE_FLOOR_MAX)
      this.centsHistory = []
      return {
        hz: null,
        midi: null,
        noteName: null,
        cents: null,
        confidence: result.confidence,
        rms,
        noiseFloor: this.noiseFloor,
        gate,
        detected: false,
      }
    }

    const hist = this.centsHistory
    hist.push(result.cents as number)
    while (hist.length > SMOOTHING_FRAMES) hist.shift()
    const sorted = [...hist].sort((a, b) => a - b)
    const cents = sorted[sorted.length >> 1]

    return {
      hz: result.hz,
      midi: result.midi,
      noteName: result.noteName,
      cents,
      confidence: result.confidence,
      rms,
      noiseFloor: this.noiseFloor,
      gate,
      detected: true,
    }
  }
}
