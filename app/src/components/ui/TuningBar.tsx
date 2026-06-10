/**
 * TuningBar — the horizontal pitch strip for the Jalokiviasteikko gem game
 * (game-necklace-in-tune-step.md §3). A passive readout, never a reward element:
 * left = live cents deviation from the target note, a thin needle sliding with the
 * pitch, a shaded "good zone" that brightens when centred, right = the phase timer.
 *
 * Two states: **disabled** (present but quiet, needle parked centre) and **active**
 * (during the evaluation window). On a poor result the whole strip yields its space
 * to a neutral, non-shaming message for ~1 s.
 */

interface TuningBarProps {
  /** True during the evaluation window (the bar is "measuring"). */
  active: boolean
  /**
   * Cents deviation from the *target* note (negative = flat, positive = sharp), or
   * null when no in-tune reading is available (silent / wrong pitch / disabled).
   */
  cents: number | null
  /** Half-width (cents) of the centred "good zone" band. */
  goodZoneCents: number
  /** Elapsed evaluation time in seconds (shown to one decimal), or null when idle. */
  timerSeconds: number | null
  /** Neutral poor-result message; when set it replaces the bar for ~1 s. */
  message: string | null
}

/** Full-scale cents the bar spans left→right (needle clamps to the ends). */
const DISPLAY_RANGE_CENTS = 50

export function TuningBar({ active, cents, goodZoneCents, timerSeconds, message }: TuningBarProps) {
  const hasReading = active && cents != null
  const inGood = hasReading && Math.abs(cents) <= goodZoneCents
  const needlePct = hasReading ? 50 + Math.max(-1, Math.min(1, cents / DISPLAY_RANGE_CENTS)) * 50 : 50
  const goodHalfPct = (goodZoneCents / DISPLAY_RANGE_CENTS) * 50

  return (
    <div className='w-full px-2 pb-2'>
      <div
        className={`flex h-7 items-center gap-2 rounded-md border border-white/10 bg-black/40 px-2 transition-opacity ${
          active ? 'opacity-100' : 'opacity-55'
        }`}
      >
        {message ? (
          // Poor-result: plain, easy-reading sans-serif instruction in place of the bar.
          <p className='flex-1 text-center font-sans text-[11px] leading-tight text-white/85'>{message}</p>
        ) : (
          <>
            {/* Cents readout — tabular numerals so the width never jumps. */}
            <span className='w-9 shrink-0 text-right font-mono text-[10px] tabular-nums text-white/70'>
              {hasReading ? `${cents > 0 ? '+' : ''}${Math.round(cents)}` : ''}
            </span>

            {/* Track with the centred good zone + sliding needle. */}
            <div className='relative h-3 flex-1 overflow-hidden rounded-full bg-white/5'>
              <div
                className='absolute inset-y-0 rounded-full transition-colors'
                style={{
                  left: `${50 - goodHalfPct}%`,
                  width: `${2 * goodHalfPct}%`,
                  backgroundColor: inGood ? 'rgba(159,208,255,0.65)' : 'rgba(159,208,255,0.28)',
                }}
              />
              {hasReading && (
                <div
                  className='absolute inset-y-0 w-[2px] -translate-x-1/2 rounded-full bg-white'
                  style={{ left: `${needlePct}%` }}
                />
              )}
            </div>

            {/* Phase timer — one decimal is enough. */}
            <span className='w-9 shrink-0 text-left font-mono text-[10px] tabular-nums text-white/70'>
              {timerSeconds != null ? `${timerSeconds.toFixed(1)}s` : ''}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
