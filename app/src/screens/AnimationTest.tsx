/*
 * DEBUG / TEST ROUTE
 * Hidden preview route for the Soittohetki timer animation (Task 21).
 * Reach it from the shared `#/test` menu or directly via
 * `#/test/animation/timer`. The variant is chosen via
 * `?variant=walking` (default) or `?variant=flying`, and the duration via
 * `?ms=<milliseconds>` (default 60 000 = 1 min for quick visual iteration).
 * Both variants can also be flipped through the toggle below.
 */
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
    <div className='min-h-screen bg-[#fffbe9] p-2 flex flex-col items-center gap-3'>
      <Link
        to='/test'
        aria-label='Takaisin testisivuille'
        className='flex min-h-[30px] shrink-0 items-center self-start rounded-lg border-2 border-[#5a2d0c] px-2 text-xs font-bold text-[#5a2d0c]'
      >
        ←
      </Link>

      {/* Demo container — same sizing rules as Soittohetki's animation slot */}
      <div className='w-full max-w-[520px]'>
        <div className='w-full h-[35svh] min-h-[180px] max-h-[360px] rounded-2xl overflow-hidden bg-[#fffbe9]'>
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
          Kävely
        </button>
        <button
          onClick={() => setVariant('flying')}
          className={`px-3 h-10 rounded-lg text-sm font-bold ${
            variant === 'flying' ? 'bg-[#8B2500] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
          }`}
        >
          Lento
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
          {isRunning ? 'Tauko' : 'Käynnistä'}
        </button>
        <button
          onClick={restart}
          className='px-4 h-10 rounded-lg border-2 border-[#5a2d0c] text-[#5a2d0c] text-sm font-bold'
        >
          Aloita alusta
        </button>
      </div>

      <p className='text-xs text-[#8B4513] text-center max-w-[520px]'>
        Tavallisin reitti tänne on <code>#/test</code>. Voit myös käyttää suoraa linkkiä{' '}
        <code>#/test/animation/timer</code> ja lisätä perään <code>?variant=walking|flying</code> sekä{' '}
        <code>?ms=&lt;kesto&gt;</code>.
      </p>
    </div>
  )
}
