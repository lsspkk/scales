import { useNavigate } from 'react-router-dom'
import { useMicPitch } from '../hooks/useMicPitch.ts'
import { useTunerStore, calmnessToSettings } from '../stores/tunerStore.ts'
import { useViewport } from '../lib/useViewport'
import { TunerDial } from '../components/ui/TunerDial.tsx'
import { SimpleTunerControls } from '../components/ui/SimpleTunerControls.tsx'
import { ScreenHeader } from '../components/ui/ScreenHeader.tsx'

const ACCURACY_CENTS = 10

/**
 * Production tuner screen (route `/virittaminen`). The "fast, easy to use" half
 * of the tuner goal: zero-config by default. It shows only start/stop, the
 * TunerDial, and the note + cents readout (carried by the dial), plus the single
 * 5-step calmness slider whose value persists via `tunerStore`. No debug info —
 * the four-knob `TunerControls` + raw readouts stay on the hidden test pages.
 * Baked defaults + the calmness mapping live in `tunerStore`/`tuner.ts`.
 */
export function Virittaminen() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const calmness = useTunerStore((s) => s.calmness)
  const setCalmness = useTunerStore((s) => s.setCalmness)
  const reset = useTunerStore((s) => s.reset)
  const pitch = useMicPitch(calmnessToSettings(calmness))
  const inTune = pitch.cents != null && Math.abs(pitch.cents) <= ACCURACY_CENTS

  return (
    <div className='flex h-full flex-col bg-[#fffbe9]'>
      {!isDesktop && (
        <ScreenHeader title='Virittäminen' subtitle='Viritä viulu' color='red' onBack={() => navigate('/')} />
      )}

      <div className='flex flex-1 flex-col items-center gap-5 p-4'>
        <TunerDial noteName={pitch.noteName} cents={pitch.cents} accuracyCents={ACCURACY_CENTS} inTune={inTune} />

        {pitch.error && <p className='text-center text-xs text-red-700'>{pitch.error}</p>}

        <button
          onClick={() => (pitch.listening ? pitch.stop() : void pitch.start())}
          className={`min-h-[44px] w-full max-w-[320px] rounded-xl text-base font-bold text-white ${
            pitch.listening ? 'bg-[#a0563f]' : 'bg-[#5a2d0c]'
          }`}
        >
          {pitch.listening ? 'Sulje mikrofoni' : 'Avaa mikrofoni'}
        </button>

        <SimpleTunerControls calmness={calmness} onChange={setCalmness} onReset={reset} />
      </div>
    </div>
  )
}
