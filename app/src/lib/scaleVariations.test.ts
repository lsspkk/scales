import { describe, expect, it } from 'vitest'
import { buildVariationQueue, rollVariation, SCALE_VARIATIONS, type ScaleVariation } from './scaleVariations'

describe('buildVariationQueue', () => {
  it('includes every variation exactly once in one bag', () => {
    const queue = buildVariationQueue()

    expect(queue).toHaveLength(SCALE_VARIATIONS.length)
    expect(new Set(queue.map((variation) => variation.id)).size).toBe(SCALE_VARIATIONS.length)
  })

  it('starts a fresh bag with a different variation when possible', () => {
    const queue = buildVariationQueue('V02')

    expect(queue[0]?.id).not.toBe('V02')
  })
})

describe('rollVariation', () => {
  it('drains one full bag before any variation can repeat', () => {
    let queue: ScaleVariation[] = []
    let previousId: string | null = null
    const seenIds = new Set<string>()

    for (let i = 0; i < SCALE_VARIATIONS.length; i += 1) {
      const result = rollVariation(queue, previousId)
      expect(result.variation).not.toBeNull()

      seenIds.add(result.variation!.id)
      previousId = result.variation!.id
      queue = result.nextQueue
    }

    expect(seenIds.size).toBe(SCALE_VARIATIONS.length)
    expect(queue).toHaveLength(0)
  })

  it('refills with a fresh bag after the queue is empty', () => {
    const first = rollVariation([], 'V02')

    expect(first.variation).not.toBeNull()
    expect(first.variation?.id).not.toBe('V02')
    expect(first.nextQueue).toHaveLength(SCALE_VARIATIONS.length - 1)
  })
})
