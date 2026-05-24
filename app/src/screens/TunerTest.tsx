/*
 * DEBUG / TEST ROUTE
 * Hidden test page for the live microphone tuner. Reach via #/test/tuner.
 * Listens and shows the detected chromatic note + how in tune it is, plus the
 * detection-tuning sliders for finding good defaults.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMicPitch } from '../hooks/useMicPitch.ts'
import { DEFAULT_TUNER_SETTINGS } from '../lib/audio/tuner.ts'
import { TunerDial } from '../components/ui/TunerDial.tsx'
import { TunerControls } from '../components/ui/TunerControls.tsx'

const ACCURACY_CENTS = 10

const fmtCents = (c: number) => `${c > 0 ? '+' : ''}${Math.round(c)}¢`

export function TunerTest() {
  const [sensitivity, setSensitivity] = useState(DEFAULT_TUNER_SETTINGS.sensitivity)
  const [clarityThreshold, setClarityThreshold] = useState(DEFAULT_TUNER_SETTINGS.clarityThreshold)
  const [filterEnabled, setFilterEnabled] = useState(true)
  const [smoothingFrames, setSmoothingFrames] = useState(DEFAULT_TUNER_SETTINGS.smoothingFrames)
  const [confirmFrames, setConfirmFrames] = useState(DEFAULT_TUNER_SETTINGS.confirmFrames)
  const pitch = useMicPitch({ sensitivity, clarityThreshold, filterEnabled, smoothingFrames, confirmFrames })
  const inTune = pitch.cents != null && Math.abs(pitch.cents) <= ACCURACY_CENTS

  // Lead with clarity (does the frame clear the gate?), then show raw→smoothed
  // cents so the calming is visibly the detector's, not just the dial easing.
  const readout = [
    `clarity ${pitch.clarity.toFixed(2)}`,
    pitch.hz != null ? `${pitch.hz.toFixed(1)} Hz` : `RMS ${pitch.rms.toFixed(3)} / portti ${pitch.gate.toFixed(3)}`,
    pitch.rawCents != null && pitch.cents != null ? `raaka ${fmtCents(pitch.rawCents)}→tasattu ${fmtCents(pitch.cents)}` : null,
    pitch.held ? 'pidossa' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className='flex min-h-screen flex-col items-center gap-5 bg-[#fffbe9] p-4'>
      <Link
        to='/test'
        className='flex min-h-[44px] items-center self-start rounded-xl border-2 border-[#5a2d0c] px-3 py-2 text-sm font-bold text-[#5a2d0c]'
      >
        ← Testisivut
      </Link>

      <h1 className='text-lg font-bold text-[#5a2d0c]'>Kromaattinen viritin</h1>

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

      <div className='w-full max-w-[420px]'>
        <TunerControls
          sensitivity={sensitivity}
          clarityThreshold={clarityThreshold}
          filterEnabled={filterEnabled}
          smoothingFrames={smoothingFrames}
          confirmFrames={confirmFrames}
          onSensitivity={setSensitivity}
          onClarityThreshold={setClarityThreshold}
          onFilterToggle={() => setFilterEnabled((v) => !v)}
          onSmoothingFrames={setSmoothingFrames}
          onConfirmFrames={setConfirmFrames}
          readout={readout}
        />
      </div>

      <p className='max-w-[280px] text-center text-xs text-[#8B4513]'>
        Salli mikrofoni ja soita yksi sävel kerrallaan. Kohinaportti säätyy automaattisesti; herkkyys päästää
        hiljaisemmat sävelet läpi, selkeysraja karsii epävarmat tunnistukset.
      </p>
    </div>
  )
}
