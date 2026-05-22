import { useCallback, useEffect, useRef, useState } from 'react'
import { rollVariation, type ScaleVariation } from '../lib/scaleVariations'

const DEFAULT_CLEAR_DELAY_MS = 3000

interface UseScaleVariationQueueResult {
  variation: ScaleVariation | null
  rollNextVariation: () => void
  clearVariation: () => void
}

export function useScaleVariationQueue(clearDelayMs: number = DEFAULT_CLEAR_DELAY_MS): UseScaleVariationQueueResult {
  const [variation, setVariation] = useState<ScaleVariation | null>(null)
  const queueRef = useRef<ScaleVariation[]>([])
  const lastVariationIdRef = useRef<string | null>(null)
  const clearTimeoutRef = useRef<number | null>(null)

  const clearPendingTimeout = useCallback(() => {
    if (clearTimeoutRef.current === null) return
    window.clearTimeout(clearTimeoutRef.current)
    clearTimeoutRef.current = null
  }, [])

  const clearVariation = useCallback(() => {
    clearPendingTimeout()
    setVariation(null)
  }, [clearPendingTimeout])

  const rollNextVariation = useCallback(() => {
    const result = rollVariation(queueRef.current, lastVariationIdRef.current)
    queueRef.current = result.nextQueue

    if (!result.variation) return

    lastVariationIdRef.current = result.variation.id
    setVariation(result.variation)
  }, [])

  useEffect(() => {
    clearPendingTimeout()
    if (!variation) return

    clearTimeoutRef.current = window.setTimeout(() => {
      clearTimeoutRef.current = null
      setVariation(null)
    }, clearDelayMs)

    return clearPendingTimeout
  }, [variation, clearDelayMs])

  useEffect(() => clearPendingTimeout, [clearPendingTimeout])

  return {
    variation,
    rollNextVariation,
    clearVariation,
  }
}
