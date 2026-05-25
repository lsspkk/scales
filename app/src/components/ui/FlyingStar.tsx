import { useId } from 'react'

/**
 * Small 3D-ish gold SVG star — purely decorative. A diagonal gradient plus a
 * bright top facet fake a bevelled, lit-from-above look. A unique gradient id
 * per instance keeps several stars on screen from sharing (and losing) a fill.
 * Used by the scale-tuner game's fly-up celebration (#/test/scaletuner).
 */
export function FlyingStar({ size = 26 }: { size?: number }) {
  const grad = `star-grad-${useId()}`
  return (
    <svg width={size} height={size} viewBox='0 0 100 100' aria-hidden focusable={false}>
      <defs>
        <linearGradient id={grad} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor='#fff6c0' />
          <stop offset='45%' stopColor='#ffd23f' />
          <stop offset='100%' stopColor='#d98a00' />
        </linearGradient>
      </defs>
      <polygon
        points='50,4 61,37 96,37 68,58 79,93 50,72 21,93 32,58 4,37 39,37'
        fill={`url(#${grad})`}
        stroke='#a85c00'
        strokeWidth='3'
        strokeLinejoin='round'
      />
      {/* top facet highlight → fake 3D bevel */}
      <polygon points='50,4 61,37 50,45 39,37' fill='#fffbe6' opacity='0.9' />
    </svg>
  )
}
