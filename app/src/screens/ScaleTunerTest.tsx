/*
 * DEBUG / TEST ROUTE
 * Hidden test page for the scale-playing tuner game. Reach via
 * #/test/scaletuner (also linked from #/test). Draws the current scale,
 * colours the target note, and listens via the mic: hold the target in tune
 * long enough and it advances to the next note. Uses the key/mode currently
 * stored by the rest of the app.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMusicStore } from '../stores/musicStore.ts'
import { useMicPitch } from '../hooks/useMicPitch.ts'
import { TunerDial } from '../components/ui/TunerDial.tsx'
import { MusicCanvas } from '../components/ui/MusicCanvas.tsx'
import { getScale } from '../lib/musicScale.ts'
import { assignAscendingOctaves, SCALE_START_OCTAVE, formatNoteSPN, formatNoteFi } from '../lib/noteOctave.ts'
import { noteNameToMidi } from '../lib/audio/tuning.ts'

const HIGHLIGHT_COLOR = '#a0563f'

const ACCURACY_OPTIONS = [
  { label: 'Helppo', cents: 35 },
  { label: 'Keski', cents: 20 },
  { label: 'Tarkka', cents: 10 },
]

/** Pitch class (0–11) of a note string like "Bb4", tolerant of bad input. */
function pitchClassOf(spn: string): number | null {
  try {
    return ((noteNameToMidi(spn) % 12) + 12) % 12
  } catch {
    return null
  }
}

export function ScaleTunerTest() {
  const scaleKey = useMusicStore((s) => s.key)
  const mode = useMusicStore((s) => s.mode)

  const [accuracyCents, setAccuracyCents] = useState(20)
  const [holdSeconds, setHoldSeconds] = useState(0.5)
  const [randomize, setRandomize] = useState(false)
  const [targetIndex, setTargetIndex] = useState(0)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdStartRef = useRef<number | null>(null)

  const pitch = useMicPitch()

  // Ascending scale notes (8 entries; last is the octave repeat of the root).
  const scaleNotes = useMemo(() => {
    const scale = getScale(scaleKey, mode)
    const rootLetter = scaleKey.replace(/[#b].*$/, '')
    const startOctave = SCALE_START_OCTAVE[scaleKey] ?? SCALE_START_OCTAVE[rootLetter] ?? 4
    return assignAscendingOctaves(scale, startOctave)
  }, [scaleKey, mode])

  const target = scaleNotes[Math.min(targetIndex, scaleNotes.length - 1)]
  const targetKey = `${target.letter}${target.accidental ?? ''}`
  const targetPc = useMemo(() => pitchClassOf(formatNoteSPN(target)), [target])

  const detectedPc = pitch.midi == null ? null : ((pitch.midi % 12) + 12) % 12
  const matchesTarget = detectedPc !== null && detectedPc === targetPc
  const inTune = matchesTarget && pitch.cents != null && Math.abs(pitch.cents) <= accuracyCents

  const advance = useCallback(() => {
    setTargetIndex((i) => {
      const unique = scaleNotes.length - 1 // exclude the duplicate octave root
      if (unique <= 1) return i
      if (randomize) {
        let next = Math.floor(Math.random() * unique)
        if (next === i) next = (next + 1) % unique
        return next
      }
      return (i + 1) % unique
    })
  }, [randomize, scaleNotes.length])

  // Hold timer: while the right note stays in tune, fill the progress bar;
  // when it tops out, advance to the next target. Re-runs on each mic frame.
  useEffect(() => {
    if (!pitch.listening || !inTune) {
      holdStartRef.current = null
      setHoldProgress(0)
      return
    }
    if (holdStartRef.current == null) holdStartRef.current = performance.now()
    const elapsed = performance.now() - holdStartRef.current
    const p = Math.min(1, elapsed / (holdSeconds * 1000))
    setHoldProgress(p)
    if (p >= 1) {
      holdStartRef.current = null
      setHoldProgress(0)
      advance()
    }
  }, [inTune, pitch.cents, pitch.midi, pitch.listening, holdSeconds, advance])

  return (
    <div className='flex min-h-screen flex-col items-center gap-4 bg-[#fffbe9] p-4'>
      <Link
        to='/test'
        className='flex min-h-[44px] items-center self-start rounded-xl border-2 border-[#5a2d0c] px-3 py-2 text-sm font-bold text-[#5a2d0c]'
      >
        ← Testisivut
      </Link>

      <div className='flex w-full max-w-[420px] flex-col gap-4'>
        <h1 className='text-lg font-bold text-[#5a2d0c]'>
          Asteikkoviritin · {scaleKey} {mode.split(' ')[0]}
        </h1>

        <MusicCanvas
          scaleKey={scaleKey}
          mode={mode}
          staves={1}
          highlightNotes={[targetKey]}
          highlightColor={HIGHLIGHT_COLOR}
          className='w-full aspect-[2/1] rounded-xl border-2 border-[#8B4513] bg-white'
        />

        <p className='text-center text-sm text-[#5a2d0c]'>
          Soita: <span className='font-bold' style={{ color: HIGHLIGHT_COLOR }}>{formatNoteFi(target)}</span>
        </p>

        <TunerDial
          noteName={pitch.noteName}
          cents={pitch.cents}
          accuracyCents={accuracyCents}
          inTune={inTune}
        />

        {/* hold progress */}
        <div className='h-3 w-full overflow-hidden rounded-full bg-[#f0dbb8]'>
          <div
            className='h-full rounded-full bg-[#86c98a] transition-[width] duration-100'
            style={{ width: `${Math.round(holdProgress * 100)}%` }}
          />
        </div>

        {/* accuracy */}
        <div className='flex flex-col gap-1'>
          <span className='text-sm font-bold text-[#5a2d0c]'>Tarkkuus</span>
          <div className='flex gap-2'>
            {ACCURACY_OPTIONS.map((opt) => (
              <button
                key={opt.cents}
                onClick={() => setAccuracyCents(opt.cents)}
                className={`min-h-[44px] flex-1 rounded-lg px-2 text-sm font-bold ${
                  accuracyCents === opt.cents ? 'bg-[#5a2d0c] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
                }`}
              >
                {opt.label} (±{opt.cents}¢)
              </button>
            ))}
          </div>
        </div>

        {/* hold time */}
        <div className='flex flex-col gap-1'>
          <span className='text-sm font-bold text-[#5a2d0c]'>Kesto: {holdSeconds.toFixed(1)} s</span>
          <input
            type='range'
            min={0.2}
            max={2}
            step={0.1}
            value={holdSeconds}
            onChange={(e) => setHoldSeconds(Number(e.target.value))}
            className='h-11 w-full accent-[#a0563f]'
          />
        </div>

        {/* randomize */}
        <label className='flex min-h-[44px] items-center gap-3 text-sm font-bold text-[#5a2d0c]'>
          <input
            type='checkbox'
            checked={randomize}
            onChange={(e) => setRandomize(e.target.checked)}
            className='h-5 w-5 accent-[#a0563f]'
          />
          Arvo seuraava sävel satunnaisesti
        </label>

        {pitch.error && <p className='text-center text-sm text-red-700'>{pitch.error}</p>}

        <button
          onClick={() => (pitch.listening ? pitch.stop() : void pitch.start())}
          className={`min-h-[48px] rounded-xl px-6 text-base font-bold text-white ${
            pitch.listening ? 'bg-[#a0563f]' : 'bg-[#5a2d0c]'
          }`}
        >
          {pitch.listening ? 'Lopeta' : 'Aloita kuuntelu'}
        </button>
      </div>
    </div>
  )
}
