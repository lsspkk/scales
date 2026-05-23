/*
 * DEBUG / TEST ROUTE
 * Hidden test page for the live microphone tuner. Reach via #/test/tuner
 * (also linked from #/test). Plays nothing — just listens and shows the
 * detected note (any chromatic note) + how in tune it is on the needle dial.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMicPitch } from '../hooks/useMicPitch.ts'
import { TunerDial } from '../components/ui/TunerDial.tsx'

const ACCURACY_CENTS = 10

export function TunerTest() {
  const [filterEnabled, setFilterEnabled] = useState(true)
  const pitch = useMicPitch({ filterEnabled })
  const inTune = pitch.cents != null && Math.abs(pitch.cents) <= ACCURACY_CENTS

  return (
    <div className='flex min-h-screen flex-col items-center gap-6 bg-[#fffbe9] p-4'>
      <div className='flex w-full max-w-[420px] items-center justify-between'>
        <Link
          to='/test'
          className='flex min-h-[44px] items-center rounded-xl border-2 border-[#5a2d0c] px-3 py-2 text-sm font-bold text-[#5a2d0c]'
        >
          ← Testisivut
        </Link>
        <button
          onClick={() => setFilterEnabled((v) => !v)}
          aria-label={filterEnabled ? 'Suodatin päällä' : 'Suodatin pois'}
          className={`flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3 text-sm font-bold ${
            filterEnabled ? 'border-[#5a2d0c] bg-[#5a2d0c] text-white' : 'border-[#8B4513] text-[#8B4513]'
          }`}
        >
          <span aria-hidden>🎚</span>
          Suodatin {filterEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <h1 className='text-lg font-bold text-[#5a2d0c]'>Kromaattinen viritin</h1>

      <TunerDial noteName={pitch.noteName} cents={pitch.cents} accuracyCents={ACCURACY_CENTS} inTune={inTune} />

      <p className='font-mono text-xs text-[#8B4513]'>
        {pitch.hz != null ? `${pitch.hz.toFixed(1)} Hz · luotettavuus ${pitch.confidence.toFixed(2)}` : '—'}
      </p>

      {pitch.error && <p className='max-w-[280px] text-center text-sm text-red-700'>{pitch.error}</p>}

      <button
        onClick={() => (pitch.listening ? pitch.stop() : void pitch.start())}
        className={`min-h-[48px] rounded-xl px-6 text-base font-bold text-white ${
          pitch.listening ? 'bg-[#a0563f]' : 'bg-[#5a2d0c]'
        }`}
      >
        {pitch.listening ? 'Lopeta' : 'Aloita kuuntelu'}
      </button>

      <p className='max-w-[280px] text-center text-xs text-[#8B4513]'>
        Salli mikrofoni ja soita yksi sävel kerrallaan. Neula osoittaa ylös ja vihreälle, kun sävel on
        vireessä. Jos tunnistus ei toimi, kokeile suodatin pois päältä.
      </p>
    </div>
  )
}
