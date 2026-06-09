import { useEffect, useRef } from 'react'
import {
  computeNecklaceLayout,
  createDrawState,
  advanceDrawState,
  drawNecklace,
  type NecklaceModel,
  type DrawState,
} from '../../lib/necklace'

interface NecklaceCanvasProps {
  /** The necklace to render. Mutate this freely from React — the loop reads it live. */
  model: NecklaceModel
  className?: string
  style?: React.CSSProperties
}

/**
 * Thin React wrapper around the pure `necklace.ts` engine — the same shape as
 * `MusicCanvas`, but with a *continuous* `requestAnimationFrame` loop because the
 * necklace animates every frame (spin easing, twinkle, set-bursts).
 *
 * How the parts fit together:
 *   • A `ResizeObserver` measures the wrapper and sizes the canvas bitmap to
 *     `cssSize × devicePixelRatio`, so the image stays crisp on HiDPI screens.
 *   • Each frame we re-apply the DPR transform, recompute the layout from the
 *     current size, advance the animation state by the elapsed time, then paint.
 *   • The live `model` is read through a ref so the long-lived loop never has to
 *     be torn down and rebuilt when React re-renders with a new model.
 */
export function NecklaceCanvas({ model, className, style }: NecklaceCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Always-current model for the animation loop (updated on every render).
  const modelRef = useRef(model)
  modelRef.current = model

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Persistent animation state (spin, per-socket effects, bursts) lives here,
    // outside React, for the lifetime of the loop.
    const draw: DrawState = createDrawState(modelRef.current, reduceMotion)

    // CSS-pixel size of the wrapper, kept fresh by the ResizeObserver.
    let cssW = 1
    let cssH = 1
    const measure = () => {
      cssW = Math.max(1, wrapper.clientWidth)
      cssH = Math.max(1, wrapper.clientHeight)
      const dpr = window.devicePixelRatio || 1
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrapper)

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      // dt in seconds; clamp big gaps (e.g. returning to a backgrounded tab) so
      // nothing teleports after a long pause.
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // draw in CSS pixels each frame
      const m = modelRef.current
      const layout = computeNecklaceLayout({ width: cssW, height: cssH, socketCount: m.sockets.length })
      advanceDrawState(draw, m, layout, dt)
      drawNecklace(ctx, layout, m, draw)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
    // Empty deps: the loop is created once and reads everything live via refs.
  }, [])

  return (
    <div ref={wrapperRef} className={className} style={style}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
