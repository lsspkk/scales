import { useRef, useEffect } from 'react'
import { computeLayout, renderScale, renderArpeggio, type NoteWithOctave } from '../../lib/musicStave'
import { useViewport } from '../../lib/useViewport'

interface MusicCanvasProps {
  scaleKey?: string
  mode?: string
  staves?: 1 | 2
  arpeggioNotes?: NoteWithOctave[]
  className?: string
  style?: React.CSSProperties
}

/**
 * Reusable canvas component for rendering music scales.
 *
 * The canvas always renders at its true on-screen size. The parent must give
 * the wrapper a definite width and height (via Tailwind utility classes or
 * inline styles — e.g. `w-full aspect-[2/1]`). The component observes that
 * size, sets the canvas bitmap to `cssSize × devicePixelRatio`, and feeds
 * the measured CSS size into `computeLayout`. No CSS stretching of a fixed
 * bitmap — all geometry follows the container.
 */
export function MusicCanvas({ scaleKey, mode, staves = 2, arpeggioNotes, className, style }: MusicCanvasProps) {
  const { isDesktop } = useViewport()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const rect = wrapper.getBoundingClientRect()
      const cssW = Math.max(1, Math.round(rect.width))
      const wrapperH = Math.max(1, Math.round(rect.height))
      const cssH = Math.max(1, Math.round(wrapperH * (!isDesktop && staves === 1 ? 0.9 : 1)))
      const dpr = window.devicePixelRatio || 1

      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const layout = computeLayout({ width: cssW, height: cssH, staves })
      if (arpeggioNotes) {
        renderArpeggio(ctx, arpeggioNotes, layout)
      } else if (scaleKey && mode) {
        renderScale(ctx, scaleKey, mode, layout)
      }
    }

    const ro = new ResizeObserver(draw)
    ro.observe(wrapper)
    const t = setTimeout(draw, 200)
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) draw()
    })
    io.observe(wrapper)
    return () => {
      ro.disconnect()
      io.disconnect()
      clearTimeout(t)
    }
  }, [scaleKey, mode, staves, arpeggioNotes, isDesktop])

  return (
    <div ref={wrapperRef} className={className} style={style}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
