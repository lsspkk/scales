import { useEffect, useRef } from 'react'
import { drawSimpleNecklace, type NecklaceCandidate } from '../../lib/simplenecklace'

interface SimpleNecklaceCanvasProps {
  candidate: NecklaceCandidate
  className?: string
}

/**
 * Renders one candidate necklace as a static flat row of gems. Unlike `NecklaceCanvas`
 * there is no animation loop — the necklace is painted once per size/candidate change,
 * so a long scrolling list of them stays cheap. A `ResizeObserver` keeps the bitmap at
 * `cssSize × devicePixelRatio` for crisp gems on any screen.
 */
export function SimpleNecklaceCanvas({ candidate, className }: SimpleNecklaceCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const paint = () => {
      const cssW = Math.max(1, wrapper.clientWidth)
      const cssH = Math.max(1, wrapper.clientHeight)
      const dpr = window.devicePixelRatio || 1
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawSimpleNecklace(ctx, cssW, cssH, candidate)
    }
    paint()
    const ro = new ResizeObserver(paint)
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [candidate])

  return (
    <div ref={wrapperRef} className={className}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
