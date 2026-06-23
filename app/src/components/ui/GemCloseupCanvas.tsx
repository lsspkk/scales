import { useEffect, useRef } from 'react'
import {
  computeNecklaceLayout,
  createDrawState,
  advanceDrawState,
  drawCloseup,
  type NecklaceModel,
  type DrawState,
  type CloseupLabel,
} from '../../lib/necklace'

interface GemCloseupCanvasProps {
  /** The (finished) necklace to inspect. Read live through a ref. */
  model: NecklaceModel
  /** Which gem is centred (controlled by the parent). Clamped to range. */
  index: number
  /** Called when swipe / arrow-key navigation wants a different gem. */
  onIndexChange: (index: number) => void
  /** Per-socket captions (note name + scores) painted above each visible gem. */
  labels?: CloseupLabel[]
  className?: string
  style?: React.CSSProperties
}

/**
 * Close-up viewer for a finished necklace: one gem fills the screen with the chain
 * running off both edges. It is **controlled** — the parent owns the gem `index` and
 * renders the prev/next buttons — but the viewer still handles swipe (touch) and
 * ← / → arrow keys itself, reporting the new index back via `onIndexChange`.
 *
 * It reuses the necklace engine wholesale (`drawCloseup` zooms into the shared circular
 * ring and spins the focused gem to the front), so every facet, sparkle and crack stays
 * crisp at any size. Mechanics mirror `NecklaceCanvas`: a `ResizeObserver` sizes the bitmap to
 * `cssSize × devicePixelRatio`, and a continuous rAF loop re-applies the DPR transform,
 * eases the camera toward the target gem, and paints.
 */
export function GemCloseupCanvas({ model, index, onIndexChange, labels, className, style }: GemCloseupCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Everything the long-lived rAF loop / listeners need, read live so the effect
  // never has to be rebuilt.
  const modelRef = useRef(model)
  modelRef.current = model
  const indexRef = useRef(index)
  indexRef.current = index
  const onChangeRef = useRef(onIndexChange)
  onChangeRef.current = onIndexChange
  const labelsRef = useRef(labels)
  labelsRef.current = labels

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // All gems already morphed in (finished necklace), so the fresh draw state shows
    // every stone fully; we only advance it for the sparkle/twinkle life.
    const draw: DrawState = createDrawState(modelRef.current, reduceMotion)

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

    // Eased fractional gem index → the smooth slide between stones.
    let focus = indexRef.current
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const m = modelRef.current
      const layout = computeNecklaceLayout({ width: cssW, height: cssH, socketCount: m.sockets.length })
      advanceDrawState(draw, m, layout, dt)
      focus += (indexRef.current - focus) * (1 - Math.exp(-7 * dt))
      drawCloseup(ctx, layout, m, draw, focus, cssW, cssH, labelsRef.current)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const stepTo = (d: number) => {
      const n = modelRef.current.sockets.length
      const next = Math.max(0, Math.min(n - 1, indexRef.current + d))
      if (next !== indexRef.current) onChangeRef.current(next)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        stepTo(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        stepTo(-1)
      }
    }
    window.addEventListener('keydown', onKey)

    // Horizontal swipe → next/previous gem (swipe left reveals the next one).
    let downX = 0
    let swiping = false
    const onDown = (e: PointerEvent) => {
      downX = e.clientX
      swiping = true
    }
    const onUp = (e: PointerEvent) => {
      if (!swiping) return
      swiping = false
      const dx = e.clientX - downX
      if (Math.abs(dx) > 40) stepTo(dx < 0 ? 1 : -1)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
    // Built once; reads model/index/onIndexChange live via refs.
  }, [])

  return (
    <div ref={wrapperRef} className={className} style={style}>
      <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'pan-y' }} />
    </div>
  )
}
