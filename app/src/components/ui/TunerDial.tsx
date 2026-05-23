interface TunerDialProps {
  /** Detected note name (e.g. "A4"), or null when nothing is heard. */
  noteName: string | null
  /** Cents offset from the nearest semitone, range [-50, 50], or null. */
  cents: number | null
  /** Half-width of the "in tune" green zone, in cents. Default 20. */
  accuracyCents?: number
  /** When true the readout glows green (right note + within accuracy). */
  inTune?: boolean
}

const MAX_CENTS = 50
const SWEEP_DEG = 80 // ±50 cents maps to ±80° of needle travel

/**
 * Semicircular tuner gauge. A conic-gradient paints a green sector at the top
 * (the in-tune zone) and the needle rotates around the bottom-centre pivot by
 * an amount proportional to the cents error. The detected note name sits in
 * the readout below the dial.
 *
 * Inline styles are limited to the two genuinely dynamic values a Tailwind
 * utility can't express: the conic-gradient sector size and the needle angle.
 */
export function TunerDial({ noteName, cents, accuracyCents = 20, inTune = false }: TunerDialProps) {
  const clamped = Math.max(-MAX_CENTS, Math.min(MAX_CENTS, cents ?? 0))
  const angle = (clamped / MAX_CENTS) * SWEEP_DEG
  const accDeg = (Math.min(MAX_CENTS, accuracyCents) / MAX_CENTS) * SWEEP_DEG

  const green = '#86c98a'
  const neutral = '#f0dbb8'
  // conic 0deg points straight up; the green band wraps symmetrically around it.
  const dialBg = `conic-gradient(from 0deg at 50% 100%,
    ${green} 0deg ${accDeg}deg,
    ${neutral} ${accDeg}deg 270deg,
    ${green} ${360 - accDeg}deg 360deg)`

  return (
    <div className='flex flex-col items-center'>
      <div
        className='relative h-[130px] w-[260px] overflow-hidden rounded-t-[130px] border-2 border-b-0 border-[#8B4513]'
        style={{ background: dialBg }}
      >
        {/* needle */}
        <div
          className='absolute bottom-0 left-1/2 h-[120px] w-[3px] origin-bottom rounded-full bg-[#a0563f] transition-transform duration-100'
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        />
        {/* pivot hub */}
        <div className='absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#5a2d0c]' />
      </div>

      <div
        className={`mt-3 flex min-w-[120px] flex-col items-center rounded-xl px-4 py-1 ${
          inTune ? 'bg-[#86c98a] text-[#1f5d27]' : 'text-[#5a2d0c]'
        }`}
      >
        <span className='text-4xl font-bold tabular-nums'>{noteName ?? '–'}</span>
        <span className='text-sm tabular-nums'>
          {cents == null ? 'kuuntelee…' : `${cents > 0 ? '+' : ''}${cents}¢`}
        </span>
      </div>
    </div>
  )
}
