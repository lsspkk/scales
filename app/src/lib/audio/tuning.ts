/**
 * Tuning anchor for the audio engine and pitch detector.
 *
 * A = 442 Hz is used as the single reference for all absolute-frequency math
 * (note name → Hz, MIDI → Hz, cents calculation in pitch detection).
 *
 * Buffer-source pitch shifting uses a ratio of two MIDI values, so the
 * reference cancels out — but both sides MUST agree on the same reference.
 */

export const A4_HZ = 442
export const A4_MIDI = 69

const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/** Convert a MIDI number to absolute frequency anchored at A4 = 442 Hz. */
export function midiToHz(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12)
}

/** Convert a frequency to fractional MIDI (real-valued). */
export function hzToMidi(hz: number): number {
  return 12 * Math.log2(hz / A4_HZ) + A4_MIDI
}

/** Convert a frequency to its nearest MIDI integer + cents offset (range [-50, 50]). */
export function hzToMidiAndCents(hz: number): { midi: number; cents: number } {
  const fractional = hzToMidi(hz)
  const midi = Math.round(fractional)
  const cents = Math.round((fractional - midi) * 100)
  return { midi, cents }
}

/** "A4", "F#3", "Bb2" → MIDI number. Accepts # or b accidentals. */
export function noteNameToMidi(name: string): number {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(name.trim())
  if (!match) throw new Error(`Invalid note name: ${name}`)
  const [, letter, accidental, octaveStr] = match
  const baseSemis: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  let semis = baseSemis[letter.toUpperCase()]
  if (accidental === '#') semis += 1
  else if (accidental === 'b') semis -= 1
  const octave = parseInt(octaveStr, 10)
  return semis + (octave + 1) * 12
}

/** MIDI number → "A4", "F#3" (sharps only). */
export function midiToNoteName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES_SHARP[pc]}${octave}`
}
