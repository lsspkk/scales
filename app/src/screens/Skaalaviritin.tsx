import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader.tsx'
import { MusicCanvas } from '../components/ui/MusicCanvas.tsx'
import { TunerDial } from '../components/ui/TunerDial.tsx'
import { CompactTunerControls } from '../components/ui/CompactTunerControls.tsx'
import { StarFlight } from '../components/ui/StarFlight.tsx'
import type { StarTone } from '../components/ui/FlyingStar.tsx'
import { useViewport } from '../lib/useViewport'
import { useMicPitch } from '../hooks/useMicPitch.ts'
import { useTunerStore, calmnessToSettings } from '../stores/tunerStore.ts'
import { getScale } from '../lib/musicScale.ts'
import { assignAscendingOctaves, SCALE_START_OCTAVE, formatNoteSPN, formatNoteFi } from '../lib/noteOctave.ts'
import { noteNameToMidi } from '../lib/audio/tuning.ts'

/*
 * Skaalaviritin — leveling scale-practice tuner (Task 32, first cut).
 *
 * The player picks a scale in Harjoittelu and launches this screen with the
 * same URL params. They play the scale's notes in tune up to the top and back
 * down; each completed up-and-down run hardens the precision (tighter cents +
 * longer hold). Reaching the top flies silver stars, reaching the bottom flies
 * a random-colour burst and bumps the level. The bottom of the final level
 * flies gold and stops the run.
 */

// Difficulty ladder. Each completed up-and-down run advances one level; tighter
// cents + longer hold = harder. The current level number also equals the number
// of stars in each celebration. Tune these freely — they are the whole game feel.
const PRACTICE_LEVELS = [
  { cents: 30, holdSeconds: 1.0 }, // Taso 1 (easiest)
  { cents: 22, holdSeconds: 1.3 }, // Taso 2
  { cents: 16, holdSeconds: 1.6 }, // Taso 3
  { cents: 11, holdSeconds: 2.0 }, // Taso 4
  { cents: 8, holdSeconds: 2.5 }, // Taso 5 (hardest)
] as const

// How long the tuner/listening pauses while a star celebration plays.
const ANIMATION_OFF_MS = 3000

// Colours a non-final bottom celebration may roll (never gold/silver — those are
// reserved for the top and the final level-5 celebration).
const RANDOM_TONES: StarTone[] = ['indigo', 'purple', 'pink', 'blue', 'green', 'yellow']

const HIGHLIGHT_COLOR = '#a0069f'
const BASIC_NOTE_COLOR = '#aaaaaa'

type Phase = 'ascending' | 'descending'

interface Celebration {
  id: number
  tone: StarTone
  count: number
  isFinal: boolean
}

/** Pitch class (0–11) of a note string like "Bb4", tolerant of bad input. */
function pitchClassOf(spn: string): number | null {
  try {
    return ((noteNameToMidi(spn) % 12) + 12) % 12
  } catch {
    return null
  }
}

function parseMode(value: string | null): string {
  return value === 'aeolian' ? 'aeolian' : 'ionian'
}

function scaleLabel(root: string, mode: string): string {
  return `${root}-${mode === 'aeolian' ? 'molli' : 'duuri'}`
}

export function Skaalaviritin() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const [searchParams] = useSearchParams()

  const root = searchParams.get('root') ?? 'C'
  const mode = parseMode(searchParams.get('mode'))

  const calmness = useTunerStore((s) => s.calmness)
  const setCalmness = useTunerStore((s) => s.setCalmness)
  const pitch = useMicPitch(calmnessToSettings(calmness))
  const stopMic = pitch.stop

  const [level, setLevel] = useState(1)
  const [phase, setPhase] = useState<Phase>('ascending')
  const [targetIndex, setTargetIndex] = useState(0)
  const [holdProgress, setHoldProgress] = useState(0)
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const [finished, setFinished] = useState(false)
  const holdStartRef = useRef<number | null>(null)
  const celebrationTimer = useRef<number | null>(null)

  const { cents: levelCents, holdSeconds } = PRACTICE_LEVELS[level - 1]

  // Single ascending octave (8 entries; last is the octave repeat of the root),
  // mirroring the drawn one-stave scale so targets line up with the canvas.
  const scaleNotes = useMemo(() => {
    const scale = getScale(root, mode)
    const rootLetter = root.replace(/[#b].*$/, '')
    const startOctave = SCALE_START_OCTAVE[root] ?? SCALE_START_OCTAVE[rootLetter] ?? 4
    return assignAscendingOctaves(scale, startOctave)
  }, [root, mode])
  const top = scaleNotes.length - 1

  const target = scaleNotes[Math.min(targetIndex, top)]
  const targetKey = `${target.letter}${target.accidental ?? ''}`
  const targetPc = useMemo(() => pitchClassOf(formatNoteSPN(target)), [target])

  const detectedPc = pitch.midi == null ? null : ((pitch.midi % 12) + 12) % 12
  const matchesTarget = detectedPc !== null && detectedPc === targetPc
  const inTune = matchesTarget && pitch.cents != null && Math.abs(pitch.cents) <= levelCents

  // Start a celebration: pause listening progress, fly the stars for
  // ANIMATION_OFF_MS, then resume — or, on the final level, stop for good.
  const triggerCelebration = useCallback(
    (tone: StarTone, count: number, isFinal: boolean) => {
      setHoldProgress(0)
      holdStartRef.current = null
      setCelebration({ id: Date.now(), tone, count, isFinal })
      if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current)
      celebrationTimer.current = window.setTimeout(() => {
        setCelebration(null)
        if (isFinal) {
          stopMic()
          setFinished(true)
        }
      }, ANIMATION_OFF_MS)
    },
    [stopMic],
  )

  // Step to the next target: up to the top (silver burst, canvas flips to
  // descending, top note played again), then back down. Reaching the bottom
  // completes a run → random burst + level up, or, at the final level, a gold
  // burst that ends the game.
  const advance = useCallback(() => {
    if (top <= 0) return
    if (phase === 'ascending') {
      if (targetIndex < top) {
        setTargetIndex(targetIndex + 1)
      } else {
        triggerCelebration('silver', level, false)
        setPhase('descending')
      }
    } else if (targetIndex > 0) {
      setTargetIndex(targetIndex - 1)
    } else {
      const isFinal = level >= PRACTICE_LEVELS.length
      if (isFinal) {
        triggerCelebration('gold', PRACTICE_LEVELS.length, true)
      } else {
        triggerCelebration(RANDOM_TONES[Math.floor(Math.random() * RANDOM_TONES.length)], level, false)
        setLevel(level + 1)
      }
      setPhase('ascending')
      setTargetIndex(0)
    }
  }, [phase, targetIndex, top, level, triggerCelebration])

  // Hold timer: while the right note stays in tune, fill the progress bar; when
  // it tops out, advance. Frozen during celebrations, when finished, or silent.
  useEffect(() => {
    if (!pitch.listening || !inTune || celebration || finished) {
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
  }, [inTune, pitch.cents, pitch.midi, pitch.listening, holdSeconds, advance, celebration, finished])

  useEffect(
    () => () => {
      if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current)
    },
    [],
  )

  // Every fresh start begins a new game from level 1.
  const startFresh = () => {
    if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current)
    setLevel(1)
    setPhase('ascending')
    setTargetIndex(0)
    setHoldProgress(0)
    holdStartRef.current = null
    setCelebration(null)
    setFinished(false)
    void pitch.start()
  }

  const toggleListening = () => (pitch.listening ? pitch.stop() : startFresh())

  return (
    <div className='flex h-full flex-col bg-[#fffbe9]'>
      {!isDesktop && (
        <ScreenHeader
          title='Skaalaviritin'
          subtitle={scaleLabel(root, mode)}
          color='red'
          onBack={() => navigate('/harjoittelu')}
        />
      )}

      <MusicCanvas
        scaleKey={root}
        mode={mode}
        staves={1}
        scaleDirection={phase}
        highlightNotes={[targetKey]}
        highlightColor={HIGHLIGHT_COLOR}
        basicNoteColor={BASIC_NOTE_COLOR}
        className='aspect-[5/2] w-full bg-white'
      />

      {/* justify-between + a stretch spacer let the gaps grow on tall phones
          while everything still fits a short, old screen. */}
      <div className='mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center gap-2 px-2 py-2'>

        <p className='text-center text-xs text-[#5a2d0c]'>
          Soita <span aria-hidden>{phase === 'ascending' ? '↑' : '↓'}</span>{' '}
          <span className='text-lg font-bold text-[#a0563f]'>
            {target.letter}
            {target.accidental ?? ''}
          </span>{' '}
          <span className='text-[10px] text-[#8B4513]'>({formatNoteFi(target)})</span>
        </p>

        <TunerDial noteName={pitch.noteName} cents={pitch.cents} accuracyCents={levelCents} inTune={inTune} />

        {/* hold progress */}
        <div className='h-2 w-full overflow-hidden rounded-full bg-[#f0dbb8]'>
          <div
            className='h-full rounded-full bg-[#7c6fd6] transition-[width] duration-100'
            style={{ width: `${Math.round(holdProgress * 100)}%` }}
          />
        </div>

        {pitch.error && <p className='text-center text-xs text-red-700'>{pitch.error}</p>}

        {/* Stretch spacer — soaks up extra vertical space on taller screens. */}
        <div className='min-h-0 flex-1' />

        {/* Slider on the left, listen toggle on the right — one compact row. */}
        <div className='flex w-full max-w-[320px] items-end gap-3'>
          <CompactTunerControls calmness={calmness} onChange={setCalmness} />
          <button
            onClick={toggleListening}
            className={`min-h-[40px] rounded-xl px-4 text-base font-bold text-white ${
              isDesktop ? 'shrink-0' : 'flex-1'
            } ${pitch.listening ? 'bg-[#a0563f]' : 'bg-[#5a2d0c]'}`}
          >
            {pitch.listening ? 'Lopeta' : 'Aloita'}
          </button>
        </div>

        <p className='text-center text-xs font-bold text-[#5a2d0c]'>
          Taso {level}. Tarkkuus ±{levelCents} Aika {holdSeconds}s
        </p>
      </div>

      {/* Flying-star celebration layer — one StarFlight per star (count = level). */}
      {celebration &&
        Array.from({ length: celebration.count }, (_, i) => (
          <StarFlight key={`${celebration.id}-${i}`} tone={celebration.tone} durationMs={ANIMATION_OFF_MS} />
        ))}
    </div>
  )
}
