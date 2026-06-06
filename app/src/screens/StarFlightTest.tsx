/*
 * DEBUG / TEST ROUTE
 * Hidden preview route for the multi-colour flying-star animation. Reach it from
 * the shared `#/test` menu or directly via `#/test/starflight`. Tap a colour to
 * send one star on a randomised flight: in from a random edge, loops at the top
 * while growing, random up/down bounces, then a widening, accelerating spiral
 * out while shrinking away. Each tap launches an independent star; pick a
 * duration to slow the flight down for inspection.
 */
import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { StarFlight } from '../components/ui/StarFlight'
import type { StarTone } from '../components/ui/FlyingStar'

const DURATIONS = [4000, 6000, 9000, 14000]

const COLORS: { tone: StarTone; label: string; swatch: string }[] = [
  { tone: 'purple', label: 'Violetti', swatch: '#c08cff' },
  { tone: 'pink', label: 'Pinkki', swatch: '#ff8cc6' },
  { tone: 'indigo', label: 'Indigo', swatch: '#a9a0ff' },
  { tone: 'blue', label: 'Sininen', swatch: '#6cb6ff' },
  { tone: 'green', label: 'Vihreä', swatch: '#7be07b' },
  { tone: 'yellow', label: 'Keltainen', swatch: '#ffe96c' },
  { tone: 'gold', label: 'Kulta', swatch: '#ffd23f' },
]

interface Flight {
  id: number
  tone: StarTone
  durationMs: number
}

export function StarFlightTest() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [durationMs, setDurationMs] = useState(6000)
  const nextId = useRef(0)

  const launch = (tone: StarTone) => {
    const id = nextId.current++
    setFlights((f) => [...f, { id, tone, durationMs }])
  }

  const launchAll = () => {
    setFlights((f) => [...f, ...COLORS.map((c) => ({ id: nextId.current++, tone: c.tone, durationMs }))])
  }

  const remove = useCallback((id: number) => {
    setFlights((f) => f.filter((flight) => flight.id !== id))
  }, [])

  return (
    <div className='min-h-screen bg-[#fffbe9] p-2 flex flex-col items-center gap-4'>
      <Link
        to='/test'
        aria-label='Takaisin testisivuille'
        className='flex min-h-[30px] shrink-0 items-center self-start rounded-lg border-2 border-[#5a2d0c] px-2 text-xs font-bold text-[#5a2d0c]'
      >
        ←
      </Link>

      <h1 className='text-lg font-bold text-[#5a2d0c]'>Lentävä tähti</h1>

      <div className='flex flex-wrap justify-center gap-2'>
        {DURATIONS.map((ms) => (
          <button
            key={ms}
            onClick={() => setDurationMs(ms)}
            className={`h-10 rounded-lg px-3 text-sm font-bold ${
              durationMs === ms ? 'bg-[#5a2d0c] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
            }`}
          >
            {ms / 1000}s
          </button>
        ))}
      </div>

      <div className='grid w-full max-w-100 grid-cols-2 gap-2'>
        {COLORS.map((c) => (
          <button
            key={c.tone}
            onClick={() => launch(c.tone)}
            className='flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-white/60 text-base font-bold text-[#3a2a00] shadow-md active:scale-[0.98]'
            style={{ backgroundColor: c.swatch }}
          >
            ★ {c.label}
          </button>
        ))}
        <button
          onClick={launchAll}
          className='col-span-2 flex h-14 items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-[#ff8cc6] via-[#c08cff] to-[#6cb6ff] text-base font-bold text-white shadow-md active:scale-[0.98]'
        >
          ★ Kaikki värit
        </button>
      </div>

      <p className='max-w-130 text-center text-xs text-[#8B4513]'>
        Tavallisin reitti tänne on <code>#/test</code>. Voit myös käyttää suoraa linkkiä{' '}
        <code>#/test/starflight</code>. Jokainen painallus lähettää oman tähden — voit lähettää useita kerralla.
      </p>

      {/* Stars render fixed to the whole viewport, above this UI. */}
      {flights.map((flight) => (
        <StarFlight
          key={flight.id}
          tone={flight.tone}
          durationMs={flight.durationMs}
          onDone={() => remove(flight.id)}
        />
      ))}
    </div>
  )
}
