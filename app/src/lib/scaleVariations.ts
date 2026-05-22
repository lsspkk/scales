/**
 * Scale practice variation pool — Task 26 v1.
 *
 * Each entry pairs a stable id (matches docs/scale-variation-research.md) with
 * a short, child-readable Finnish instruction string suitable for inline
 * display in a narrow practice-row.
 *
 * The pool is uniform-random — no difficulty weighting yet.
 */

export interface ScaleVariation {
  id: string
  text: string
}

export const SCALE_VARIATIONS: ScaleVariation[] = [
  { id: 'V02', text: 'Pitkä-lyhyt rytmi' },
  { id: 'V03', text: 'Lyhyt-pitkä rytmi' },
  { id: 'V05', text: 'Neljäsosa + kaksi kahdeksasosaa' },
  { id: 'V07', text: '2 sidottuna, 2 erikseen' },
  { id: 'V10', text: 'Staccato / martelé' },
  { id: 'V14', text: 'Murretut terssit' },
  { id: 'V16', text: 'Lisää toonika-arpeggio' },
]

/** Roll one variation uniformly at random. Never returns the same id twice in a row. */
export function rollVariation(previousId?: string | null): ScaleVariation {
  if (SCALE_VARIATIONS.length <= 1) return SCALE_VARIATIONS[0]
  const pool = previousId ? SCALE_VARIATIONS.filter((v) => v.id !== previousId) : SCALE_VARIATIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Roll two distinct non-tonic notes from a scale's note list.
 *
 * `notes` is the 8-entry array from getScale() — indices 0 and 7 share the
 * tonic, so candidates are indices 1..6 (six unique non-tonic letters).
 * Returns the two note strings exactly as they appear in the scale
 * (e.g. ['F#', 'B'] for D major), or null if the pool is too small.
 */
export function rollHiddenNotes(notes: string[]): [string, string] | null {
  const candidates = notes.slice(1, 7)
  if (candidates.length < 2) return null
  const a = Math.floor(Math.random() * candidates.length)
  let b = Math.floor(Math.random() * (candidates.length - 1))
  if (b >= a) b += 1
  return [candidates[a], candidates[b]]
}
