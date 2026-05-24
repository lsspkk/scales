interface TunerDialProps {
  /** Detected note name (e.g. "A4"), or null when nothing is heard. */
  noteName: string | null
  /** Cents offset from the nearest semitone, range [-50, 50], or null. */
  cents: number | null
  /** Half-width of the "in tune" sector, in cents. Default 20. */
  accuracyCents?: number
  /** When true the needle + readout glow violet (right note + within accuracy). */
  inTune?: boolean
}

const MAX_CENTS = 50
const SWEEP = 62 // half-span in degrees: ±50¢ maps to ±62° of the top arc (≈28°–152°)

// Elliptical (VU-meter) geometry in the SVG viewBox: a wide rx + short ry give a
// long, shallow arc across the top, and the needle pivots at the bottom-centre.
const W = 280
const H = 118
const CX = 140
const CY = 110
const RX = 130
const RY = 100
const NEEDLE_LEN = 86

const VIOLET = '#7c6fd6' // in-tune sector + needle accent (replaces the old green)
const TICK_CENTS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50]

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Point on the (optionally scaled-in) ellipse for a cents fraction in [-1, 1]. */
function arcPoint(fraction: number, scale = 1) {
  const theta = 90 - fraction * SWEEP // 0¢ = straight up (90°); +¢ swings right
  return {
    x: CX + RX * scale * Math.cos(toRad(theta)),
    y: CY - RY * scale * Math.sin(toRad(theta)),
  }
}

/**
 * VU-meter style tuner gauge. A long, shallow elliptical arc carries cent ticks;
 * a translucent violet sector at the top marks the in-tune zone, and a needle
 * eases from the bottom-centre pivot by an amount proportional to the cents
 * error. The detected note name + signed cents sit just below the arc.
 *
 * The path `d`, `transform`, and colour values are SVG presentation attributes
 * computed from the cents/accuracy (not the `style` prop a Tailwind utility
 * can't express); a Tailwind `transition-transform` on the needle group gives
 * the slow settle the live readout asks for.
 */
export function TunerDial({ noteName, cents, accuracyCents = 20, inTune = false }: TunerDialProps) {
  const clamped = Math.max(-MAX_CENTS, Math.min(MAX_CENTS, cents ?? 0))
  const needleDeg = (clamped / MAX_CENTS) * SWEEP

  const left = arcPoint(-1)
  const right = arcPoint(1)
  const trackPath = `M ${left.x.toFixed(1)} ${left.y.toFixed(1)} A ${RX} ${RY} 0 0 1 ${right.x.toFixed(1)} ${right.y.toFixed(1)}`

  const half = Math.min(1, accuracyCents / MAX_CENTS)
  const sL = arcPoint(-half)
  const sR = arcPoint(half)
  const sectorPath = `M ${CX} ${CY} L ${sL.x.toFixed(1)} ${sL.y.toFixed(1)} A ${RX} ${RY} 0 0 1 ${sR.x.toFixed(1)} ${sR.y.toFixed(1)} Z`

  return (
    <div className='flex flex-col items-center'>
      <svg viewBox={`0 0 ${W} ${H}`} className='h-[110px] w-[260px]' role='img' aria-label='Viritysmittari'>
        {/* in-tune sector (violet, brighter on pitch) */}
        <path d={sectorPath} fill={VIOLET} fillOpacity={inTune ? 0.8 : 0.55} />

        {/* arc track */}
        <path d={trackPath} fill='none' stroke='#e3d1ad' strokeWidth={10} strokeLinecap='round' />

        {/* cent ticks */}
        {TICK_CENTS.map((c) => {
          const frac = c / MAX_CENTS
          const major = c === 0 || Math.abs(c) === MAX_CENTS
          const outer = arcPoint(frac, 1.02)
          const inner = arcPoint(frac, major ? 0.92 : 0.92)
          return (
            <line
              key={c}
              x1={outer.x.toFixed(1)}
              y1={outer.y.toFixed(1)}
              x2={inner.x.toFixed(1)}
              y2={inner.y.toFixed(1)}
              stroke={major ? '#8B4513' : '#b9975f'}
              strokeWidth={major ? 3 : 2}
              strokeLinecap='round'
            />
          )
        })}

        {/* flat / sharp orientation marks at the arc ends */}
        <text x={(left.x - 13).toFixed(1)} y={(left.y + 5).toFixed(1)} fontSize={15} fill='#8B4513' textAnchor='middle'>
          ♭
        </text>
        <text
          x={(right.x + 13).toFixed(1)}
          y={(right.y + 5).toFixed(1)}
          fontSize={15}
          fill='#8B4513'
          textAnchor='middle'
        >
          ♯
        </text>

        {/* needle — eased toward the smoothed cents value */}
        <g
          transform={`rotate(${needleDeg.toFixed(2)} ${CX} ${CY})`}
          className='transition-transform duration-300 ease-out'
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - NEEDLE_LEN}
            stroke={inTune ? VIOLET : '#7a2d4c'}
            strokeWidth={3.5}
            strokeLinecap='round'
          />
        </g>
        {/* pivot hub */}
        <circle cx={CX} cy={CY} r={8} fill='#5a2d0c' />
      </svg>

      <div className='mt-1 flex gap-2 items-center w-30 justify-center'>
        <span
          className={`text-4xl w-8 font-bold leading-none tabular-nums ${inTune ? 'text-[#6c5fc7]' : 'text-[#5a2d0c]'}`}
        >
          {noteName ?? '–'}
        </span>
        <span className='mt-0.5 w-8 text-sm text-end tabular-nums text-[#8B4513]'>
          {cents == null ? '...' : `${cents > 0 ? '+' : ''}${cents} ¢`}
        </span>
      </div>
    </div>
  )
}
