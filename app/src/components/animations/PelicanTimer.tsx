import type { CSSProperties } from 'react'

export type PelicanTimerVariant = 'walking' | 'flying'

interface PelicanTimerProps {
  variant: PelicanTimerVariant
  durationMs: number
  isRunning: boolean
}

/**
 * Procedural pelican timer animation. All motion is pure CSS keyframes
 * driven by `--duration` (set from durationMs) and toggled via the
 * `is-paused` class. The parent should remount this component (via a
 * `key` prop) to rewind the animation on reset or duration change.
 */
export function PelicanTimer({ variant, durationMs, isRunning }: PelicanTimerProps) {
  const shadeReleaseMs = Math.min(durationMs, 20_000)
  const shadeEarlyMs = Math.max(durationMs - shadeReleaseMs, 1)
  const sceneStyle = {
    '--duration': `${durationMs}ms`,
    '--shade-early-duration': `${shadeEarlyMs}ms`,
    '--shade-release-duration': `${shadeReleaseMs}ms`,
  } as CSSProperties
  const pausedClass = isRunning ? '' : 'is-paused'

  if (variant === 'flying') {
    return (
      <div className={`pelican-scene pelican-scene--flying ${pausedClass}`} style={sceneStyle} aria-hidden='true'>
        <div className='pelican-scene__content'>
          <div className='sun' />
          <div className='cloud cloud--a' />
          <div className='cloud cloud--b' />
          <div className='cloud cloud--c' />
          <div className='water-line' />
          <div className='pelican'>
            <FlyingPelicanSvg />
          </div>
        </div>
        <div className='pelican-scene__shade' />
      </div>
    )
  }

  return (
    <div className={`pelican-scene pelican-scene--walking ${pausedClass}`} style={sceneStyle} aria-hidden='true'>
      <div className='pelican-scene__content'>
        <div className='sun' />
        <div className='ground-strip' />
        <div className='pelican'>
          <WalkingPelicanSvg />
        </div>
      </div>
      <div className='pelican-scene__shade' />
    </div>
  )
}

export function WalkingPelicanSvg() {
  return (
    <svg viewBox='0 0 200 110' className='pelican-svg' xmlns='http://www.w3.org/2000/svg'>
      {/* Tail */}
      <polygon points='50,52 38,46 50,62' fill='#f5f0e8' stroke='#d8cdb5' strokeWidth='0.6' />

      {/* Back leg (behind body) */}
      <g transform='translate(72 72)'>
        <g className='pelican-part pelican-leg pelican-leg--back'>
          <rect x='-1.5' y='0' width='3' height='20' fill='#f0a030' />
          <polygon points='-5,20 5,20 0,24' fill='#f0a030' />
        </g>
      </g>

      {/* Body (waddle) */}
      <g className='pelican-part pelican-body-group'>
        <ellipse cx='85' cy='58' rx='38' ry='20' fill='#f5f0e8' stroke='#d8cdb5' strokeWidth='0.8' />
      </g>

      {/* Wing (folded against body) */}
      <ellipse cx='85' cy='50' rx='30' ry='11' fill='#fff8ed' stroke='#d8cdb5' strokeWidth='0.6' />
      <ellipse cx='58' cy='51' rx='8' ry='4' fill='#3a2a1a' />

      {/* Front leg */}
      <g transform='translate(92 72)'>
        <g className='pelican-part pelican-leg pelican-leg--front'>
          <rect x='-1.5' y='0' width='3' height='20' fill='#f0a030' />
          <polygon points='-5,20 5,20 0,24' fill='#f0a030' />
        </g>
      </g>

      {/* Neck */}
      <path d='M118,50 Q128,38 138,32' stroke='#f5f0e8' strokeWidth='11' fill='none' strokeLinecap='round' />

      {/* Head */}
      <circle cx='143' cy='30' r='11' fill='#f5f0e8' stroke='#d8cdb5' strokeWidth='0.6' />
      <circle cx='147' cy='27' r='1.5' fill='#222' />

      {/* Bill assembly */}
      <g transform='translate(152 32)'>
        <g className='pelican-part pelican-bill'>
          <polygon points='0,-2.2 36,0.9 36,4.8 0,2.3' fill='#f0a030' stroke='#c08018' strokeWidth='0.5' />
          <g className='pelican-part pelican-pouch'>
            <path d='M0,2.3 Q14,21 36,4.8 L36,1.1 Q14,4.2 0,-1.1 Z' fill='#e8820a' stroke='#c06010' strokeWidth='0.4' />
          </g>
        </g>
      </g>
    </svg>
  )
}

export function FlyingPelicanSvg() {
  return (
    <svg viewBox='0 0 200 110' className='pelican-svg' xmlns='http://www.w3.org/2000/svg'>
      {/* Body (horizontal glide pose) */}
      <ellipse cx='100' cy='60' rx='40' ry='13' fill='#f5f0e8' stroke='#d8cdb5' strokeWidth='0.8' />

      {/* Tucked legs trailing */}
      <rect x='66' y='62' width='16' height='3' rx='1' fill='#f0a030' />
      <polygon points='62,63 70,63 66,67' fill='#f0a030' />

      {/* Wing (animated flap), pivot at shoulder */}
      <g transform='translate(102 54)'>
        <g className='pelican-part pelican-wing'>
          <ellipse cx='-18' cy='-10' rx='38' ry='10' fill='#fff8ed' stroke='#d8cdb5' strokeWidth='0.6' />
          <ellipse cx='-50' cy='-10' rx='9' ry='4' fill='#3a2a1a' />
        </g>
      </g>

      {/* Neck (pulled back S-curve) */}
      <path d='M140,58 Q150,60 158,52' stroke='#f5f0e8' strokeWidth='10' fill='none' strokeLinecap='round' />

      {/* Head */}
      <circle cx='162' cy='50' r='10' fill='#f5f0e8' stroke='#d8cdb5' strokeWidth='0.6' />
      <circle cx='167' cy='48' r='1.5' fill='#222' />

      {/* Bill + pouch (resting) */}
      <polygon points='170,51.2 196,54.2 196,58.6 170,55.7' fill='#f0a030' stroke='#c08018' strokeWidth='0.5' />
      <path
        d='M170,55.7 Q180,73 196,58.6 L196,54.6 Q181,57.2 170,52.8 Z'
        fill='#e8820a'
        stroke='#c06010'
        strokeWidth='0.4'
      />
    </svg>
  )
}
