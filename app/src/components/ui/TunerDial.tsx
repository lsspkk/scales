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
const TICK_CENTS_MINOR = [-45, -35, -25, -15, -5, 5, 15, 25, 35, 45]

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
  const inTuneArcPath = `M ${sL.x.toFixed(1)} ${sL.y.toFixed(1)} A ${RX} ${RY} 0 0 1 ${sR.x.toFixed(1)} ${sR.y.toFixed(1)}`

  // Closed ring path: outer arc left→right, then inner arc right→left (sweep flipped)
  const BO = 1.065
  const BI = 0.935
  const boL = arcPoint(-1, BO); const boR = arcPoint(1, BO)
  const biL = arcPoint(-1, BI); const biR = arcPoint(1, BI)
  const bandPath = [
    `M ${boL.x.toFixed(1)} ${boL.y.toFixed(1)}`,
    `A ${(RX * BO).toFixed(1)} ${(RY * BO).toFixed(1)} 0 0 1 ${boR.x.toFixed(1)} ${boR.y.toFixed(1)}`,
    `L ${biR.x.toFixed(1)} ${biR.y.toFixed(1)}`,
    `A ${(RX * BI).toFixed(1)} ${(RY * BI).toFixed(1)} 0 0 0 ${biL.x.toFixed(1)} ${biL.y.toFixed(1)}`,
    'Z',
  ].join(' ')
  const outerRimPath = `M ${boL.x.toFixed(1)} ${boL.y.toFixed(1)} A ${(RX * BO).toFixed(1)} ${(RY * BO).toFixed(1)} 0 0 1 ${boR.x.toFixed(1)} ${boR.y.toFixed(1)}`

  return (
    <div className='flex flex-col items-center'>
      <svg viewBox={`0 0 ${W} ${H}`} className='h-[110px] w-[260px]' role='img' aria-label='Viritysmittari'>
        <defs>
          <linearGradient id='arcBandGrad' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#f0e4c8' />
            <stop offset='45%' stopColor='#d8c090' />
            <stop offset='100%' stopColor='#7a5020' />
          </linearGradient>
          <radialGradient id='hubGrad' cx='35%' cy='30%' r='65%'>
            <stop offset='0%' stopColor='#cc3333' />
            <stop offset='100%' stopColor='#550000' />
          </radialGradient>
        </defs>

        {/* gradient ring band — bevel depth behind the track */}
        <path d={bandPath} fill='url(#arcBandGrad)' />

        {/* arc track */}
        <path d={trackPath} fill='none' stroke='#e3d1ad' strokeWidth={10} strokeLinecap='butt' />

        {/* in-tune zone — violet arc slightly wider than the track, below ticks */}
        <path d={inTuneArcPath} fill='none' stroke={VIOLET} strokeWidth={12} strokeLinecap='butt' strokeOpacity={inTune ? 0.9 : 0.55} />

        {/* outer rim — dark outline on the top edge of the arc band */}
        <path d={outerRimPath} fill='none' stroke='#5d2c0a' strokeWidth={5.25} strokeLinecap='butt' />

        {/* minor ticks every 5¢ — super thin, short */}
        {TICK_CENTS_MINOR.map((c) => {
          const frac = c / MAX_CENTS
          const outer = arcPoint(frac, 1.015)
          const inner = arcPoint(frac, 0.975)
          return (
            <line
              key={`m${c}`}
              x1={outer.x.toFixed(1)}
              y1={outer.y.toFixed(1)}
              x2={inner.x.toFixed(1)}
              y2={inner.y.toFixed(1)}
              stroke='#b09878'
              strokeWidth={0.8}
              strokeLinecap='butt'
            />
          )
        })}

        {/* major ticks every 10¢ — three lengths: centre/ends, mid, normal */}
        {TICK_CENTS.map((c) => {
          const frac = c / MAX_CENTS
          const major = c === 0 || Math.abs(c) === MAX_CENTS
          const outer = arcPoint(frac, 1.02)
          const inner = arcPoint(frac, major ? 0.88 : 0.93)
          return (
            <line
              key={c}
              x1={outer.x.toFixed(1)}
              y1={outer.y.toFixed(1)}
              x2={inner.x.toFixed(1)}
              y2={inner.y.toFixed(1)}
              stroke={major ? '#6B3010' : '#9a7050'}
              strokeWidth={major ? 2 : 1.2}
              strokeLinecap='butt'
            />
          )
        })}

        {/* flat / sharp orientation marks at the arc ends */}
        <text x={(left.x - 13).toFixed(1)} y={(left.y + 5).toFixed(1)} fontSize={15} fill='#8B4513' textAnchor='middle'>
          ♭
        </text>
        <text x={(right.x + 13).toFixed(1)} y={(right.y + 5).toFixed(1)} fontSize={15} fill='#8B4513' textAnchor='middle'>
          ♯
        </text>

        {/* needle */}
        <g
          transform={`rotate(${needleDeg.toFixed(2)} ${CX} ${CY})`}
          className='transition-transform duration-300 ease-out'
        >
          <path
            d={`M ${CX - 1.75} ${CY} L ${CX + 1.75} ${CY} L ${CX + 1.75} ${CY - (NEEDLE_LEN - 7)} L ${CX} ${CY - NEEDLE_LEN - 4} L ${CX - 1.75} ${CY - (NEEDLE_LEN - 7)} Z`}
            fill={inTune ? VIOLET : '#aa0000'}
          />
        </g>

        {/* pivot hub with metallic radial gradient */}
        <circle cx={CX} cy={CY} r={8} fill='url(#hubGrad)' />
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
