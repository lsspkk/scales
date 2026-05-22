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

export interface VariationQueueRoll {
  nextQueue: ScaleVariation[]
  variation: ScaleVariation | null
}

function shuffleVariations(variations: readonly ScaleVariation[]): ScaleVariation[] {
  const shuffled = [...variations]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

/**
 * Build one shuffle-bag cycle.
 *
 * Every variation appears exactly once before the bag is refilled.
 * When possible, the first item in a fresh bag is different from the previous
 * variation so bag boundaries do not create an immediate repeat.
 */
export function buildVariationQueue(previousId?: string | null): ScaleVariation[] {
  if (SCALE_VARIATIONS.length <= 1) return [...SCALE_VARIATIONS]

  const shuffled = shuffleVariations(SCALE_VARIATIONS)
  if (!previousId || shuffled[0]?.id !== previousId) return shuffled

  const swapIndex = shuffled.findIndex((variation) => variation.id !== previousId)
  if (swapIndex <= 0) return shuffled
  ;[shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]]
  return shuffled
}

/**
 * Consume one variation from a shuffle bag.
 *
 * If the queue is empty, a new shuffled bag is created first.
 */
export function rollVariation(queue: readonly ScaleVariation[], previousId?: string | null): VariationQueueRoll {
  const nextQueue = queue.length > 0 ? [...queue] : buildVariationQueue(previousId)
  const variation = nextQueue.shift() ?? null

  return { variation, nextQueue }
}

function sameHiddenNotePair(a: readonly [string, string], b: readonly [string, string]): boolean {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0])
}

/**
 * Roll two distinct non-tonic notes from a scale's note list.
 *
 * `notes` is the 8-entry array from getScale() — indices 0 and 7 share the
 * tonic, so candidates are indices 1..6 (six unique non-tonic letters).
 * Returns the two note strings exactly as they appear in the scale
 * (e.g. ['F#', 'B'] for D major), or null if the pool is too small.
 * When `previousNotes` is provided, the same note pair is excluded from the
 * roll (order-insensitive), so at least one hidden note changes.
 */
export function rollHiddenNotes(
  notes: string[],
  previousNotes?: readonly [string, string] | null,
): [string, string] | null {
  const candidates = notes.slice(1, 7)
  if (candidates.length < 2) return null

  const pairs: [string, string][] = []
  for (let i = 0; i < candidates.length - 1; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const pair: [string, string] = [candidates[i], candidates[j]]
      if (previousNotes && sameHiddenNotePair(pair, previousNotes)) continue
      pairs.push(pair)
    }
  }

  if (pairs.length === 0) return null
  return pairs[Math.floor(Math.random() * pairs.length)]
}
