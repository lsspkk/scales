/*
 * DEBUG / TEST ROUTE
 * Hidden test page for the live microphone tuner. Reach via #/test/tuner
 * (also linked from #/test). Plays nothing — just listens and shows the
 * detected note + how in tune it is on the needle dial.
 */
import { Link } from 'react-router-dom'
import { useMicPitch } from '../hooks/useMicPitch.ts'
import { TunerDial } from '../components/ui/TunerDial.tsx'

const ACCURACY_CENTS = 10

export function TunerTest() {
  const pitch = useMicPitch()
  const inTune = pitch.cents != null && Math.abs(pitch.cents) <= ACCURACY_CENTS

  return (
    <div className='flex min-h-screen flex-col items-center gap-6 bg-[#fffbe9] p-4'>
      <Link
        to='/test'
        className='flex min-h-[44px] items-center self-start rounded-xl border-2 border-[#5a2d0c] px-3 py-2 text-sm font-bold text-[#5a2d0c]'
      >
        ← Testisivut
      </Link>

      <h1 className='text-lg font-bold text-[#5a2d0c]'>Viritin</h1>

      <TunerDial noteName={pitch.noteName} cents={pitch.cents} accuracyCents={ACCURACY_CENTS} inTune={inTune} />

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
        Salli mikrofoni ja soita yksi sävel kerrallaan. Neula osoittaa ylös ja vihreälle, kun sävel on vireessä.
      </p>
    </div>
  )
}
