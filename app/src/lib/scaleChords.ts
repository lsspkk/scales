/**
 * Chord suggestions for a given scale.
 *
 * v1 scope: tonic-only diatonic chords. A chord type is suggested when every
 * one of its intervals (semitones from the root) lies in the mode's interval
 * set. Non-tonic chord suggestions (V, ii–V–I, secondary dominants, modal
 * characteristic chords) are deliberately out of scope.
 */

import { CHORD_TYPES, type ChordType } from './audio/chords.ts'
import { MODES, getBaseModeKey } from './musicScale.ts'

export interface ChordSuggestion {
  /** Stable id, e.g. 'C-maj7'. */
  id: string
  /** Compact button label, e.g. 'CMaj', 'Am7'. */
  label: string
  /** Root note string from `musicScale.ts` (letter + optional `#`/`b`). */
  rootNote: string
  /** Matches an entry id in `audio/chords.ts` CHORD_TYPES. */
  chordTypeId: string
}

function makeLabel(rootNote: string, chordType: ChordType): string {
  switch (chordType.id) {
    case 'major':
      return `${rootNote}Maj`
    case 'minor':
      return `${rootNote}m`
    case 'diminished':
      return `${rootNote}dim`
    case 'augmented':
      return `${rootNote}aug`
    case 'maj7':
      return `${rootNote}Maj7`
    case 'dom7':
      return `${rootNote}7`
    case 'minor7':
      return `${rootNote}m7`
    case 'dim7':
      return `${rootNote}dim7`
    default:
      return `${rootNote} ${chordType.label}`
  }
}

/**
 * Return the tonic-based chord suggestions that fit the given scale.
 *
 * Order follows the order in CHORD_TYPES — triads first, then 7th chords.
 * Returns an empty array if `mode` is unknown.
 */
export function getScaleChords(root: string, mode: string): ChordSuggestion[] {
  const baseMode = getBaseModeKey(mode)
  const intervals = MODES[baseMode]
  if (!intervals) return []
  const inScale = new Set(intervals)

  const suggestions: ChordSuggestion[] = []
  for (const chordType of CHORD_TYPES) {
    if (chordType.intervals.every((iv) => inScale.has(iv))) {
      suggestions.push({
        id: `${root}-${chordType.id}`,
        label: makeLabel(root, chordType),
        rootNote: root,
        chordTypeId: chordType.id,
      })
    }
  }
  return suggestions
}
