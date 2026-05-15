import type { CSSProperties } from 'react'
import { WalkingPelicanSvg, FlyingPelicanSvg } from './PelicanTimer'

export type PelicanCelebrationVariant = 'walking' | 'flying'

interface PelicanCelebrationProps {
  variant: PelicanCelebrationVariant
  durationMs?: number
}

const CONFETTI_COUNT = 12

/**
 * Procedural pelican celebration animation (Task 22). Plays once when the
 * Soittohetki timer reaches zero. Variant is paired with the timer variant:
 * walking timer → proud bounce + confetti; flying timer → dive, catch a
 * small fish, and rise back up.
 *
 * All motion is pure CSS keyframes driven by `--celebration-duration` set
 * from durationMs. Reuses the pelican SVG rigs from PelicanTimer.
 */
export function PelicanCelebration({ variant, durationMs = 3000 }: PelicanCelebrationProps) {
  const sceneStyle = { '--celebration-duration': `${durationMs}ms` } as CSSProperties

  if (variant === 'flying') {
    return (
      <div className='pelican-scene pelican-scene--celebration-flying' style={sceneStyle}>
        <div className='sun' />
        <div className='cloud cloud--a' />
        <div className='cloud cloud--b' />
        <div className='water-line' aria-hidden='true' />
        <div className='splash' aria-hidden='true' />
        <div className='pelican' aria-hidden='true'>
          <FlyingPelicanSvg />
          <svg viewBox='0 0 36 18' className='pelican-fish' xmlns='http://www.w3.org/2000/svg'>
            <defs>
              <linearGradient
                id='pelican-fish-body-gradient'
                x1='6'
                y1='4'
                x2='22'
                y2='14'
                gradientUnits='userSpaceOnUse'
              >
                <stop offset='0%' stopColor='#d8ecf8' />
                <stop offset='45%' stopColor='#9fc5de' />
                <stop offset='100%' stopColor='#6f99b7' />
              </linearGradient>
              <linearGradient
                id='pelican-fish-tail-gradient'
                x1='21'
                y1='4'
                x2='33'
                y2='15'
                gradientUnits='userSpaceOnUse'
              >
                <stop offset='0%' stopColor='#5f86a5' />
                <stop offset='100%' stopColor='#2f5a85' />
              </linearGradient>
            </defs>
            <ellipse
              cx='14'
              cy='9'
              rx='8'
              ry='5'
              fill='url(#pelican-fish-body-gradient)'
              stroke='#5f86a5'
              strokeWidth='1.2'
            />
            <polygon
              points='21,9 32,3 32,15'
              fill='url(#pelican-fish-tail-gradient)'
              stroke='#2f5a85'
              strokeWidth='1.2'
              strokeLinejoin='round'
            />
            <polygon points='12,4 16,1 18,5' fill='url(#pelican-fish-tail-gradient)' opacity='0.8' />
            <circle cx='10' cy='8' r='1.2' fill='#3a2a1a' />
          </svg>
        </div>
        <div className='celebration-text'>Valmis!</div>
      </div>
    )
  }

  return (
    <div className='pelican-scene pelican-scene--celebration-walking' style={sceneStyle}>
      <div className='sun' />
      <div className='ground-strip-static' aria-hidden='true' />
      <div className='confetti' aria-hidden='true'>
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <span key={i} className={`confetti-piece confetti-piece--${i}`} />
        ))}
      </div>
      <div className='pelican' aria-hidden='true'>
        <WalkingPelicanSvg />
      </div>
      <div className='celebration-text'>Valmis!</div>
    </div>
  )
}
