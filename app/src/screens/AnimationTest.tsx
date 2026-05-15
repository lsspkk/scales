/*
 * DEBUG / TEST ROUTE
 * Hidden preview route for the Soittohetki timer animation (Task 21).
 * Reachable only by typing `#/dev/animation/timer` in the URL bar — there
 * is intentionally no UI link to it from the rest of the app. The variant
 * is chosen via `?variant=walking` (default) or `?variant=flying`, and the
 * duration via `?ms=<milliseconds>` (default 60 000 = 1 min for quick visual
 * iteration). Both variants can also be flipped through the toggle below.
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PelicanTimer, type PelicanTimerVariant } from '../components/animations/PelicanTimer'

function parseVariant(value: string | null): PelicanTimerVariant {
  return value === 'flying' ? 'flying' : 'walking'
}

function parseMs(value: string | null): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 60_000
}

export function AnimationTest() {
  const [searchParams, setSearchParams] = useSearchParams()
  const variant = parseVariant(searchParams.get('variant'))
  const durationMs = parseMs(searchParams.get('ms'))
  const [isRunning, setIsRunning] = useState(true)
  const [runId, setRunId] = useState(0)

  const setVariant = (v: PelicanTimerVariant) => {
    const next = new URLSearchParams(searchParams)
    next.set('variant', v)
    setSearchParams(next, { replace: true })
    setRunId((n) => n + 1)
  }

  const setMs = (ms: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('ms', String(ms))
    setSearchParams(next, { replace: true })
    setRunId((n) => n + 1)
  }

  const restart = () => setRunId((n) => n + 1)

  return (
    <div className='min-h-screen bg-[#fffbe9] p-4 flex flex-col items-center gap-4'>
      <h1 className='text-[#5a2d0c] text-lg font-bold'>Pelican timer (debug)</h1>

      {/* Demo container — same sizing rules as Soittohetki's animation slot */}
      <div className='w-full max-w-[520px]'>
        <div className='w-full h-[35svh] min-h-[180px] max-h-[360px] rounded-2xl overflow-hidden bg-[#faf3d8]'>
          <PelicanTimer
            key={`${variant}-${durationMs}-${runId}`}
            variant={variant}
            durationMs={durationMs}
            isRunning={isRunning}
          />
        </div>
      </div>

      <div className='flex flex-wrap gap-2 justify-center'>
        <button
          onClick={() => setVariant('walking')}
          className={`px-3 h-10 rounded-lg text-sm font-bold ${
            variant === 'walking' ? 'bg-[#8B2500] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
          }`}
        >
          Walking
        </button>
        <button
          onClick={() => setVariant('flying')}
          className={`px-3 h-10 rounded-lg text-sm font-bold ${
            variant === 'flying' ? 'bg-[#8B2500] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
          }`}
        >
          Flying
        </button>
      </div>

      <div className='flex flex-wrap gap-2 justify-center'>
        {[10_000, 30_000, 60_000, 180_000, 600_000].map((ms) => (
          <button
            key={ms}
            onClick={() => setMs(ms)}
            className={`px-3 h-10 rounded-lg text-sm font-bold ${
              durationMs === ms ? 'bg-[#8B2500] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
            }`}
          >
            {ms < 60_000 ? `${ms / 1000}s` : `${ms / 60_000}min`}
          </button>
        ))}
      </div>

      <div className='flex gap-2'>
        <button
          onClick={() => setIsRunning((r) => !r)}
          className='px-4 h-10 rounded-lg bg-[#8B2500] text-white text-sm font-bold'
        >
          {isRunning ? 'Pause' : 'Run'}
        </button>
        <button onClick={restart} className='px-4 h-10 rounded-lg border-2 border-[#5a2d0c] text-[#5a2d0c] text-sm font-bold'>
          Restart
        </button>
      </div>

      <p className='text-xs text-[#8B4513] text-center max-w-[520px]'>
        Hidden test route — not linked from the UI. Add <code>?variant=walking|flying</code> and{' '}
        <code>?ms=&lt;duration&gt;</code> for direct deep-linking.
      </p>
    </div>
  )
}
