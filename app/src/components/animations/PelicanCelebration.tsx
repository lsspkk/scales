import type { CSSProperties } from 'react'
import { WalkingPelicanSvg, FlyingPelicanSvg, PalmSvg } from './PelicanTimer'

export type PelicanCelebrationVariant = 'walking' | 'flying'

interface PelicanCelebrationProps {
  variant: PelicanCelebrationVariant
  durationMs?: number
}

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
      <div className='pelican-scene__backdrop' />
      <div className='sun' />
      <div className='palm palm--celebration-big'>
        <div className='palm-big-shadow palm-big-shadow--trunk' />
        <div className='palm-big-shadow palm-big-shadow--leaf palm-big-shadow--leaf-1' />
        <div className='palm-big-shadow palm-big-shadow--leaf palm-big-shadow--leaf-2' />
        <div className='palm-big-shadow palm-big-shadow--leaf palm-big-shadow--leaf-3' />
        <PalmSvg />
      </div>
      <div className='palm palm--celebration'>
        <PalmSvg />
      </div>
      <div className='ground-strip' aria-hidden='true' />
      <div className='pelican' aria-hidden='true'>
        <WalkingPelicanSvg />
      </div>
      <div className='coconut-shadow-layer' aria-hidden='true'>
        <div className='coconut coconut--1'>
          <div className='coconut-ground-shadow' />
        </div>
        <div className='coconut coconut--2'>
          <div className='coconut-ground-shadow' />
        </div>
        <div className='coconut coconut--3'>
          <div className='coconut-ground-shadow' />
        </div>
      </div>
      <div className='coconut coconut--1' aria-hidden='true'>
        <div className='coconut-drop'>
          <CoconutSvg variant={1} />
        </div>
      </div>
      <div className='coconut coconut--2' aria-hidden='true'>
        <div className='coconut-drop'>
          <CoconutSvg variant={2} />
        </div>
      </div>
      <div className='coconut coconut--3' aria-hidden='true'>
        <div className='coconut-drop'>
          <CoconutSvg variant={3} />
        </div>
      </div>
      <div className='celebration-text'>Valmis!</div>
    </div>
  )
}

function CoconutSvg({ variant }: { variant: 1 | 2 | 3 }) {
  if (variant === 1) {
    return (
      <svg viewBox='0 0 24 24' className='coconut-svg' xmlns='http://www.w3.org/2000/svg'>
        <ellipse cx='12' cy='12' rx='11.5' ry='9.5' fill='#6b3a18' stroke='#3a1d0a' strokeWidth='0.7' />
        <ellipse cx='7.8' cy='9' rx='3.6' ry='1.7' fill='#b78250' opacity='0.7' />
        <ellipse cx='16' cy='15.5' rx='4.5' ry='2.2' fill='#2a1407' opacity='0.55' />
        <circle cx='11.5' cy='12' r='0.85' fill='#2a1407' />
        <circle cx='9.8' cy='14' r='0.65' fill='#2a1407' />
      </svg>
    )
  }
  if (variant === 2) {
    return (
      <svg viewBox='0 0 24 24' className='coconut-svg' xmlns='http://www.w3.org/2000/svg'>
        <ellipse cx='12' cy='12' rx='10' ry='11.5' fill='#5e3014' stroke='#2e1808' strokeWidth='0.7' />
        <ellipse cx='15' cy='7.5' rx='2.6' ry='2.1' fill='#a87440' opacity='0.65' />
        <ellipse cx='8.5' cy='17' rx='3.8' ry='2.6' fill='#1f0e05' opacity='0.6' />
        <circle cx='12.5' cy='11.5' r='0.9' fill='#1f0e05' />
        <circle cx='14' cy='13.5' r='0.7' fill='#1f0e05' />
        <circle cx='11' cy='14' r='0.55' fill='#1f0e05' />
      </svg>
    )
  }
  return (
    <svg viewBox='0 0 24 24' className='coconut-svg' xmlns='http://www.w3.org/2000/svg'>
      <ellipse cx='12' cy='12' rx='11' ry='8.8' fill='#7a4520' stroke='#3a1d0a' strokeWidth='0.7' />
      <ellipse cx='10' cy='8.5' rx='4' ry='1.4' fill='#c69060' opacity='0.7' />
      <ellipse cx='14.5' cy='16' rx='5' ry='1.8' fill='#2a1407' opacity='0.5' />
      <circle cx='12' cy='12' r='0.7' fill='#2a1407' />
      <circle cx='10.2' cy='13.6' r='0.55' fill='#2a1407' />
    </svg>
  )
}
