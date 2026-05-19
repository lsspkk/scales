/**
 * Chord vocabulary.
 *
 * The audio service does not know chord names — it accepts a list of MIDI
 * offsets and plays N pitch-shifted voices from a cached sample buffer.
 * This file maps a chord-type id to its interval stack (semitones from
 * the root). Adding a new chord type is a one-line append here.
 */

export interface ChordType {
  /** Stable identifier (used in URLs, persisted state, the test UI). */
  id: string
  /** Display label, Finnish where natural. */
  label: string
  /** Semitone offsets from the root. */
  intervals: readonly number[]
}

export const CHORD_TYPES: readonly ChordType[] = [
  { id: 'major',      label: 'Duuri',           intervals: [0, 4, 7] },
  { id: 'minor',      label: 'Molli',           intervals: [0, 3, 7] },
  { id: 'diminished', label: 'Vähennetty',      intervals: [0, 3, 6] },
  { id: 'augmented',  label: 'Ylinouseva',      intervals: [0, 4, 8] },
  { id: 'maj7',       label: 'Maj7',            intervals: [0, 4, 7, 11] },
  { id: 'minor7',     label: 'Molli 7',         intervals: [0, 3, 7, 10] },
  { id: 'dom7',       label: 'Normaali 7',      intervals: [0, 4, 7, 10] },
  { id: 'dim7',       label: 'Vähennetty 7',    intervals: [0, 3, 6, 9] },
] as const

export function getChordType(id: string): ChordType | undefined {
  return CHORD_TYPES.find((c) => c.id === id)
}
