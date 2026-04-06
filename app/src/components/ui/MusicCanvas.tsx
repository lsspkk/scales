import { useRef, useEffect } from 'react'
import { computeLayout, renderScale } from '../../lib/musicStave'

interface MusicCanvasProps {
  /** The root key (e.g., 'C', 'G', 'F#') */
  scaleKey: string
  /** The mode (e.g., 'ionian', 'dorian', 'aeolian (Molli)') */
  mode: string
  /** Canvas width in pixels */
  width: number
  /** Canvas height in pixels */
  height: number
  /** Number of staves: 1 = ascending only, 2 = ascending + descending */
  staves?: 1 | 2
  /** Mobile mode: larger accidentals, adjusted clef size */
  mobile?: boolean
  /** Optional CSS class for the canvas element */
  className?: string
  /** Optional inline style for the canvas element */
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
  className,
  style,
}: MusicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const layout = computeLayout({ width, height, staves, mobile })
    renderScale(ctx, scaleKey, mode, layout)
  }, [scaleKey, mode, width, height, staves, mobile])

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
