import { hzToMidiAndCents, midiToNoteName } from './tuning.ts'

/**
 * Portable monophonic pitch detector based on the YIN algorithm
 * (de Cheveigné & Kawahara, 2002).
 *
 * No browser- or Node-only imports. Both `scripts/detect-pitch.mjs`
 * and any future in-app tuner feed it the same shape of data: a
 * Float32Array of mono PCM samples plus the sampleRate.
 */

export interface PitchResult {
  /** Detected fundamental in Hz, or null if no confident pitch found. */
  hz: number | null
  /** Nearest MIDI integer, or null if hz is null. */
  midi: number | null
  /** Note name like "A3", or null. */
  noteName: string | null
  /** Cents offset from the nearest semitone, range roughly [-50, 50]. */
  cents: number | null
  /** Confidence in [0, 1]. Higher means a clearer pitch. */
  confidence: number
}

export interface DetectPitchOptions {
  /** Lowest pitch to consider, in Hz. Default 50 (≈ G1). */
  minHz?: number
  /** Highest pitch to consider, in Hz. Default 2000 (≈ B6). */
  maxHz?: number
  /** YIN cumulative-mean-normalized difference threshold. Default 0.15. */
  threshold?: number
}

/**
 * Detect the fundamental pitch in a Float32Array of mono PCM samples.
 *
 * The input may be a long file — only a single window from the middle is
 * analysed (sustained samples have a stable pitch by then), which keeps
 * the cost O(window²) rather than O(file·window).
 */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  options: DetectPitchOptions = {},
): PitchResult {
  const minHz = options.minHz ?? 50
  const maxHz = options.maxHz ?? 2000
  const threshold = options.threshold ?? 0.15

  const tauMax = Math.min(samples.length >> 1, Math.floor(sampleRate / minHz))
  const tauMin = Math.max(2, Math.floor(sampleRate / maxHz))
  if (tauMax <= tauMin) {
    return { hz: null, midi: null, noteName: null, cents: null, confidence: 0 }
  }

  // Window 4 × tauMax centred in the file: enough cycles at the lowest
  // expected pitch for the difference function to find a clean dip. At
  // 50 Hz / 48 kHz that's ~3840 samples (80 ms) — still cheap.
  const windowSize = Math.min(samples.length, tauMax * 4)
  const start = Math.max(0, Math.floor((samples.length - windowSize) / 2))
  const buf = samples.subarray(start, start + windowSize)

  // Step 1: difference function d(tau).
  const diff = new Float32Array(tauMax + 1)
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0
    const limit = buf.length - tau
    for (let i = 0; i < limit; i++) {
      const delta = buf[i] - buf[i + tau]
      sum += delta * delta
    }
    diff[tau] = sum
  }

  // Step 2: cumulative mean normalized difference.
  const cmnd = new Float32Array(tauMax + 1)
  cmnd[0] = 1
  let running = 0
  for (let tau = 1; tau <= tauMax; tau++) {
    running += diff[tau]
    cmnd[tau] = running > 0 ? (diff[tau] * tau) / running : 1
  }

  // Step 3: absolute threshold — first dip below `threshold` that is a local min.
  let tau = -1
  for (let t = tauMin; t < tauMax; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 < tauMax && cmnd[t + 1] < cmnd[t]) t++
      tau = t
      break
    }
  }

  // Fallback: take the global minimum in [tauMin, tauMax) if no dip crossed threshold.
  if (tau === -1) {
    let bestTau = tauMin
    let bestVal = cmnd[tauMin]
    for (let t = tauMin + 1; t < tauMax; t++) {
      if (cmnd[t] < bestVal) {
        bestVal = cmnd[t]
        bestTau = t
      }
    }
    tau = bestTau
  }

  // Step 4: parabolic interpolation around tau for sub-sample precision.
  let betterTau = tau
  if (tau > 0 && tau < tauMax) {
    const s0 = cmnd[tau - 1]
    const s1 = cmnd[tau]
    const s2 = cmnd[tau + 1]
    const denom = 2 * (2 * s1 - s2 - s0)
    if (Math.abs(denom) > 1e-9) {
      betterTau = tau + (s2 - s0) / denom
    }
  }

  const hz = sampleRate / betterTau
  // Confidence: 1 - cmnd value at chosen tau, clamped.
  const confidence = Math.max(0, Math.min(1, 1 - cmnd[tau]))

  if (!isFinite(hz) || hz < minHz || hz > maxHz) {
    return { hz: null, midi: null, noteName: null, cents: null, confidence }
  }

  const { midi, cents } = hzToMidiAndCents(hz)
  return {
    hz,
    midi,
    noteName: midiToNoteName(midi),
    cents,
    confidence,
  }
}
