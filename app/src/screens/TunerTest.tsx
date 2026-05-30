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
import type { TunerSettings } from '../lib/audio/tuner.ts'
import { TunerDial } from '../components/ui/TunerDial.tsx'
import { TunerControls } from '../components/ui/TunerControls.tsx'

const ACCURACY_CENTS = 10

const fmtCents = (c: number) => `${c > 0 ? '+' : ''}${Math.round(c)}¢`

export function TunerTest() {
  const [settings, setSettings] = useState<TunerSettings>(DEFAULT_TUNER_SETTINGS)
  const pitch = useMicPitch(settings)
  const inTune = pitch.cents != null && Math.abs(pitch.cents) <= ACCURACY_CENTS

  // Lead with clarity (does the frame clear the gate?), then show raw→smoothed
  // cents so the calming is visibly the detector's, not just the dial easing.
  const readout = [
    `clarity ${pitch.clarity.toFixed(2)}`,
    pitch.hz != null ? `${pitch.hz.toFixed(1)} Hz` : `RMS ${pitch.rms.toFixed(3)} / portti ${pitch.gate.toFixed(3)}`,
    pitch.rawCents != null && pitch.cents != null
      ? `raaka ${fmtCents(pitch.rawCents)}→tasattu ${fmtCents(pitch.cents)}`
      : null,
    pitch.held ? 'pidossa' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className='flex min-h-screen flex-col items-center bg-[#fffbe9] p-2'>
      <div className='flex w-full max-w-[420px] flex-col gap-2'>
        {/* back + start/stop on one row */}
        <div className='flex items-center gap-2'>
          <Link
            to='/test'
            aria-label='Takaisin testisivuille'
            className='flex min-h-[30px] shrink-0 items-center rounded-lg border-2 border-[#5a2d0c] px-2 text-xs font-bold text-[#5a2d0c]'
          >
            ←
          </Link>
          <button
            onClick={() => (pitch.listening ? pitch.stop() : void pitch.start())}
            className={`min-h-[34px] flex-1 rounded-lg text-sm font-bold text-white ${
              pitch.listening ? 'bg-[#a0563f]' : 'bg-[#5a2d0c]'
            }`}
          >
            {pitch.listening ? 'Sulje mikrofoni' : 'Avaa mikrofoni'}
          </button>
        </div>

        {pitch.error && <p className='text-center text-xs text-red-700'>{pitch.error}</p>}

        <TunerDial noteName={pitch.noteName} cents={pitch.cents} accuracyCents={ACCURACY_CENTS} inTune={inTune} />

        <TunerControls
          settings={settings}
          onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          readout={readout}
        />
      </div>
    </div>
  )
}
