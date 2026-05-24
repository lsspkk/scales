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
import { DEFAULT_TUNER_SETTINGS } from '../lib/audio/tuner.ts'
import { TunerDial } from '../components/ui/TunerDial.tsx'
import { TunerControls } from '../components/ui/TunerControls.tsx'
import { MusicCanvas } from '../components/ui/MusicCanvas.tsx'
import { getScale, getKeyList, getModeList } from '../lib/musicScale.ts'
import { assignAscendingOctaves, SCALE_START_OCTAVE, formatNoteSPN, formatNoteFi } from '../lib/noteOctave.ts'
import { noteNameToMidi } from '../lib/audio/tuning.ts'

const HIGHLIGHT_COLOR = '#a0069f'
const BASIC_NOTE_COLOR = '#aaaaaa'

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

/** Readable scale name, e.g. "C-duuri" / "D-dorian". */
function scaleDisplayName(key: string, mode: string): string {
  const paren = mode.match(/\(([^)]+)\)/)
  const name = (paren ? paren[1] : mode.split(' ')[0]).toLowerCase()
  return `${key}-${name}`
}

export function ScaleTunerTest() {
  const scaleKey = useMusicStore((s) => s.key)
  const mode = useMusicStore((s) => s.mode)
  const setKey = useMusicStore((s) => s.setKey)
  const setMode = useMusicStore((s) => s.setMode)

  const [accuracyCents, setAccuracyCents] = useState(20)
  const [holdSeconds, setHoldSeconds] = useState(0.5)
  const [randomize, setRandomize] = useState(false)
  const [targetIndex, setTargetIndex] = useState(0)
  const [holdProgress, setHoldProgress] = useState(0)
  const [sensitivity, setSensitivity] = useState(DEFAULT_TUNER_SETTINGS.sensitivity)
  const [clarityThreshold, setClarityThreshold] = useState(DEFAULT_TUNER_SETTINGS.clarityThreshold)
  const [filterEnabled, setFilterEnabled] = useState(true)
  const [smoothingFrames, setSmoothingFrames] = useState(DEFAULT_TUNER_SETTINGS.smoothingFrames)
  const [confirmFrames, setConfirmFrames] = useState(DEFAULT_TUNER_SETTINGS.confirmFrames)
  const holdStartRef = useRef<number | null>(null)

  const pitch = useMicPitch({ sensitivity, clarityThreshold, filterEnabled, smoothingFrames, confirmFrames })

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

  // Back to the first note + cleared hold timer. Called after a roll so the new
  // scale always starts fresh.
  const resetTarget = useCallback(() => {
    setTargetIndex(0)
    setHoldProgress(0)
    holdStartRef.current = null
  }, [])

  // Roll a random root / mode (avoid repeating the current one so a roll always
  // visibly changes the drawn scale); the store update redraws the canvas.
  const rollRoot = useCallback(() => {
    const keys = getKeyList()
    let next = keys[Math.floor(Math.random() * keys.length)]
    if (keys.length > 1 && next === scaleKey) next = keys[(keys.indexOf(next) + 1) % keys.length]
    setKey(next)
    resetTarget()
  }, [scaleKey, setKey, resetTarget])

  const rollScale = useCallback(() => {
    const modes = getModeList()
    let next = modes[Math.floor(Math.random() * modes.length)]
    if (modes.length > 1 && next === mode) next = modes[(modes.indexOf(next) + 1) % modes.length]
    setMode(next)
    resetTarget()
  }, [mode, setMode, resetTarget])

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

  const rollBtn =
    'flex min-h-[30px] shrink-0 items-center gap-1 rounded-lg border-2 border-[#8B4513] px-2 text-xs font-bold text-[#5a2d0c]'

  return (
    <div className='flex min-h-screen flex-col items-center bg-[#fffbe9] p-2'>
      <div className='flex w-full max-w-[420px] flex-col gap-2'>
        {/* header: rolls + scale name + back, all on one row */}
        <div className='flex items-center gap-1'>
          <button onClick={rollRoot} aria-label='Arvo uusi pohjasävel' className={rollBtn}>
            <span aria-hidden>🎲</span> Sävel
          </button>
          <button onClick={rollScale} aria-label='Arvo uusi asteikko' className={rollBtn}>
            <span aria-hidden>🎲</span> Asteikko
          </button>
          <span className='flex-1 truncate text-center text-xs font-bold text-[#5a2d0c]'>
            {scaleDisplayName(scaleKey, mode)}
          </span>
          <Link
            to='/test'
            aria-label='Takaisin testisivuille'
            className='flex min-h-[30px] shrink-0 items-center rounded-lg border-2 border-[#5a2d0c] px-2 text-xs font-bold text-[#5a2d0c]'
          >
            ←
          </Link>
        </div>

        <MusicCanvas
          scaleKey={scaleKey}
          mode={mode}
          staves={1}
          highlightNotes={[targetKey]}
          highlightColor={HIGHLIGHT_COLOR}
          basicNoteColor={BASIC_NOTE_COLOR}
          className='w-full aspect-[5/2] rounded-lg border-2 border-[#8B4513] bg-white'
        />

        {/* target note collapsed to one line above the dial */}
        <p className='text-center text-xs text-[#5a2d0c]'>
          Soita{' '}
          <span className='text-lg font-bold text-[#a0563f]'>
            {target.letter}
            {target.accidental ?? ''}
          </span>{' '}
          <span className='text-[10px] text-[#8B4513]'>({formatNoteFi(target)})</span>
        </p>

        <div className='flex justify-center'>
          <TunerDial noteName={pitch.noteName} cents={pitch.cents} accuracyCents={accuracyCents} inTune={inTune} />
        </div>

        {/* hold progress */}
        <div className='h-2 w-full overflow-hidden rounded-full bg-[#f0dbb8]'>
          <div
            className='h-full rounded-full bg-[#7c6fd6] transition-[width] duration-100'
            style={{ width: `${Math.round(holdProgress * 100)}%` }}
          />
        </div>

        {/* accuracy presets */}
        <div className='flex gap-1'>
          {ACCURACY_OPTIONS.map((opt) => (
            <button
              key={opt.cents}
              onClick={() => setAccuracyCents(opt.cents)}
              className={`min-h-[32px] flex-1 rounded-lg px-1 text-xs font-bold ${
                accuracyCents === opt.cents ? 'bg-[#5a2d0c] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
              }`}
            >
              {opt.label} ±{opt.cents}¢
            </button>
          ))}
        </div>

        {/* hold time — label + slider on one row */}
        <label className='flex items-center gap-2 text-xs font-bold text-[#5a2d0c]'>
          <span className='shrink-0'>Kesto {holdSeconds.toFixed(1)} s</span>
          <input
            type='range'
            min={0.2}
            max={2}
            step={0.1}
            value={holdSeconds}
            onChange={(e) => setHoldSeconds(Number(e.target.value))}
            className='h-6 flex-1 accent-[#a0563f]'
          />
        </label>

        {/* randomize */}
        <label className='flex items-center gap-2 text-xs font-bold text-[#5a2d0c]'>
          <input
            type='checkbox'
            checked={randomize}
            onChange={(e) => setRandomize(e.target.checked)}
            className='h-4 w-4 accent-[#a0563f]'
          />
          Arvo seuraava sävel satunnaisesti
        </label>

        {pitch.error && <p className='text-center text-xs text-red-700'>{pitch.error}</p>}

        <button
          onClick={() => (pitch.listening ? pitch.stop() : void pitch.start())}
          className={`min-h-[40px] rounded-lg px-4 text-sm font-bold text-white ${
            pitch.listening ? 'bg-[#a0563f]' : 'bg-[#5a2d0c]'
          }`}
        >
          {pitch.listening ? 'Lopeta' : 'Aloita kuuntelu'}
        </button>

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
          readout={[
            `clarity ${pitch.clarity.toFixed(2)}`,
            pitch.hz != null
              ? `${pitch.hz.toFixed(1)} Hz`
              : `RMS ${pitch.rms.toFixed(3)} / portti ${pitch.gate.toFixed(3)}`,
            pitch.rawCents != null && pitch.cents != null
              ? `raaka ${pitch.rawCents > 0 ? '+' : ''}${pitch.rawCents}¢→tasattu ${pitch.cents > 0 ? '+' : ''}${pitch.cents}¢`
              : null,
            pitch.held ? 'pidossa' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
      </div>
    </div>
  )
}
