import { useRef, useEffect } from 'react'
import { computeLayout, renderScale, renderArpeggio, type NoteWithOctave } from '../../lib/musicStave'

interface MusicCanvasProps {
  scaleKey?: string
  mode?: string
  width: number
  height: number
  staves?: 1 | 2
  mobile?: boolean
  compact?: boolean
  arpeggioNotes?: NoteWithOctave[]
  className?: string
  style?: React.CSSProperties
}

/**
 * Reusable canvas component for rendering music scales.
 * Uses the pure musicStave drawing library.
 */
export function MusicCanvas({
  scaleKey,
  mode,
  width,
  height,
  staves = 2,
  mobile = false,
  compact = false,
  arpeggioNotes,
  className,
  style,
}: MusicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const layout = computeLayout({ width, height, staves, mobile, compact })
    if (arpeggioNotes) {
      renderArpeggio(ctx, arpeggioNotes, layout)
    } else if (scaleKey && mode) {
      renderScale(ctx, scaleKey, mode, layout)
    }
  }, [scaleKey, mode, width, height, staves, mobile, compact, arpeggioNotes])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}
