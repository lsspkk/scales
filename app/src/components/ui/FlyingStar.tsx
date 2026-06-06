import { useId } from 'react'

export type StarTone = 'gold' | 'silver' | 'indigo' | 'purple' | 'pink' | 'blue' | 'green' | 'yellow'

interface StarPalette {
  light: string
  mid: string
  dark: string
  stroke: string
}

// Colour presets so the same star shape serves both the scale-tuner gold
// celebration and the multi-colour flight on #/test/starflight. `light` is the
// centre, `dark` the tips — see the radial gradient below.
const STAR_PALETTES: Record<StarTone, StarPalette> = {
  gold: { light: '#fff6c0', mid: '#ffd23f', dark: '#d98a00', stroke: '#a85c00' },
  silver: { light: '#fdfeff', mid: '#cdd6e0', dark: '#8b97a6', stroke: '#5e6775' },
  indigo: { light: '#eceaff', mid: '#a9a0ff', dark: '#6b5cff', stroke: '#4a3fb0' },
  purple: { light: '#f3e6ff', mid: '#c08cff', dark: '#8b2fe0', stroke: '#6a1bb0' },
  pink: { light: '#ffe6f3', mid: '#ff8cc6', dark: '#ff2f9e', stroke: '#c01b6a' },
  blue: { light: '#e0f0ff', mid: '#6cb6ff', dark: '#1f7ae0', stroke: '#1559a8' },
  green: { light: '#e9ffe6', mid: '#7be07b', dark: '#2faa2f', stroke: '#1b7a1b' },
  yellow: { light: '#fffce0', mid: '#ffe96c', dark: '#f0c000', stroke: '#b89000' },
}

// A *regular* 5-pointed star centred at (50,50): 10 vertices alternating outer
// radius 46 and inner radius 18, generated at angles 36° apart from straight up.
const STAR_POINTS = '50,4 60.58,35.44 93.75,35.79 67.12,55.56 77.04,87.21 50,68 22.96,87.21 32.88,55.56 6.25,35.79 39.42,35.44'

/**
 * Decorative 5-pointed star with a soft 3D / glassy finish.
 *
 * Two layers stacked on the same shape:
 *  - Body: a radial gradient whose focal point (fx,fy) is pulled to the
 *    upper-left of the geometric centre. Off-centring the focus makes the light
 *    fall off unevenly, so the star reads like a lit, slightly domed surface
 *    (light from top-left) rather than a flat polygon.
 *  - Gloss: a soft white specular blob in the upper area, clipped to the star,
 *    that brightens the top edges like a reflection on glass.
 *
 * `userSpaceOnUse` keeps both gradients in the 0–100 viewBox coordinate space.
 * Unique ids per instance (via useId) stop several on-screen stars from sharing
 * — and losing — their fills/clips. `tone` picks the colour palette.
 */
export function FlyingStar({ size = 26, tone = 'gold' }: { size?: number; tone?: StarTone }) {
  const uid = useId()
  const grad = `star-grad-${uid}`
  const gloss = `star-gloss-${uid}`
  const spot = `star-spot-${uid}`
  const clip = `star-clip-${uid}`
  const c = STAR_PALETTES[tone]
  return (
    <svg width={size} height={size} viewBox='0 0 100 100' aria-hidden focusable={false}>
      <defs>
        <radialGradient id={grad} gradientUnits='userSpaceOnUse' cx='50' cy='50' r='52' fx='38' fy='34'>
          <stop offset='0%' stopColor={c.light} />
          <stop offset='45%' stopColor={c.mid} />
          <stop offset='100%' stopColor={c.dark} />
        </radialGradient>
        <radialGradient id={gloss} gradientUnits='userSpaceOnUse' cx='42' cy='30' r='34'>
          <stop offset='0%' stopColor='#ffffff' stopOpacity='0.85' />
          <stop offset='55%' stopColor='#ffffff' stopOpacity='0.18' />
          <stop offset='100%' stopColor='#ffffff' stopOpacity='0' />
        </radialGradient>
        <radialGradient id={spot} gradientUnits='userSpaceOnUse' cx='38' cy='28' r='10'>
          <stop offset='0%' stopColor='#ffffff' stopOpacity='0.95' />
          <stop offset='70%' stopColor='#ffffff' stopOpacity='0.6' />
          <stop offset='100%' stopColor='#ffffff' stopOpacity='0' />
        </radialGradient>
        <clipPath id={clip}>
          <polygon points={STAR_POINTS} />
        </clipPath>
      </defs>
      <polygon
        points={STAR_POINTS}
        fill={`url(#${grad})`}
        stroke={c.stroke}
        strokeWidth='3'
        strokeLinejoin='round'
      />
      {/* Glass highlight: a soft upper-left specular sheen, clipped to the star. */}
      <ellipse cx='42' cy='30' rx='30' ry='22' fill={`url(#${gloss})`} clipPath={`url(#${clip})`} />
      {/* Hot spot: a small almost-white round highlight, fixed slightly top-left. */}
      <circle cx='38' cy='28' r='10' fill={`url(#${spot})`} clipPath={`url(#${clip})`} />
    </svg>
  )
}
