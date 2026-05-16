/*
 * DEBUG / TEST ROUTE
 * Hidden preview route for the Soittohetki time-up celebration animation
 * (Task 22). Reach it from the shared `#/test` menu or directly via
 * `#/test/animation/celebration`. The variant is chosen via
 * `?variant=walking` (default) or `?variant=flying`. `?ms=<milliseconds>`
 * adjusts the celebration duration (default 3000 ms). The replay button
 * remounts the animation so it restarts from the first keyframe.
 */
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PelicanCelebration, type PelicanCelebrationVariant } from '../components/animations/PelicanCelebration'

function parseVariant(value: string | null): PelicanCelebrationVariant {
  return value === 'flying' ? 'flying' : 'walking'
}

function parseMs(value: string | null): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 3000
}

export function CelebrationAnimationTest() {
  const [searchParams, setSearchParams] = useSearchParams()
  const variant = parseVariant(searchParams.get('variant'))
  const durationMs = parseMs(searchParams.get('ms'))
  const [runId, setRunId] = useState(0)

  const setVariant = (v: PelicanCelebrationVariant) => {
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

  const replay = () => setRunId((n) => n + 1)

  return (
    <div className='min-h-screen bg-[#fffbe9] p-4 flex flex-col items-center gap-4'>
      <Link
        to='/test'
        className='flex min-h-11 items-center self-start rounded-xl border-2 border-[#5a2d0c] px-3 py-2 text-sm font-bold text-[#5a2d0c]'
      >
        ← Testisivut
      </Link>

      <h1 className='text-[#5a2d0c] text-lg font-bold'>Pelikaanin valmis-animaatio</h1>

      {/* Demo container — same sizing rules as Soittohetki's animation slot */}
      <div className='w-full max-w-130'>
        <div className='w-full h-[35svh] min-h-45 max-h-90 rounded-2xl overflow-hidden bg-[#fffbe9]'>
          <PelicanCelebration key={`${variant}-${durationMs}-${runId}`} variant={variant} durationMs={durationMs} />
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
        {[1500, 3000, 5000, 8000].map((ms) => (
          <button
            key={ms}
            onClick={() => setMs(ms)}
            className={`px-3 h-10 rounded-lg text-sm font-bold ${
              durationMs === ms ? 'bg-[#8B2500] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
            }`}
          >
            {ms / 1000}s
          </button>
        ))}
      </div>

      <div className='flex gap-2'>
        <button onClick={replay} className='px-4 h-10 rounded-lg bg-[#8B2500] text-white text-sm font-bold'>
          Toista
        </button>
      </div>

      <p className='text-xs text-[#8B4513] text-center max-w-130'>
        Tavallisin reitti tänne on <code>#/test</code>. Voit myös käyttää suoraa linkkiä{' '}
        <code>#/test/animation/celebration</code> ja lisätä perään <code>?variant=walking|flying</code> sekä{' '}
        <code>?ms=&lt;kesto&gt;</code>.
      </p>
    </div>
  )
}
