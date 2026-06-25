import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader.tsx'
import { MusicCanvas } from '../components/ui/MusicCanvas.tsx'
import { TunerDial } from '../components/ui/TunerDial.tsx'
import { StarFlight } from '../components/ui/StarFlight.tsx'
import type { StarTone } from '../components/ui/FlyingStar.tsx'
import { useViewport } from '../lib/useViewport'
import { useMicPitch } from '../hooks/useMicPitch.ts'
import { useTunerStore, calmnessToSettings } from '../stores/tunerStore.ts'
import { getScaleNotes, formatNoteSPN, formatNoteFi } from '../lib/noteOctave.ts'
import { noteNameToMidi } from '../lib/audio/tuning.ts'
import { Play, Square } from 'lucide-react'

/*
 * Tähtiasteikko — leveling scale-practice tuner (Task 32, first cut).
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

const HIGHLIGHT_COLOR = '#6d0470'
const BASIC_NOTE_COLOR = '#aaaaaa'

type Phase = 'ascending' | 'descending'

interface Celebration {
  id: number
  tone: StarTone
  count: number
  isFinal: boolean
}

/** Absolute MIDI number of a note string like "Bb4", tolerant of bad input. */
function midiOf(spn: string): number | null {
  try {
    return noteNameToMidi(spn)
  } catch {
    return null
  }
}

function parseMode(value: string | null): string {
  return value === 'aeolian' ? 'aeolian' : 'ionian'
}

function parseOctaves(value: string | null): number {
  const n = Number(value)
  return n === 1 || n === 2 || n === 3 ? n : 2
}

function scaleLabel(root: string, mode: string): string {
  return `${root}-${mode === 'aeolian' ? 'molli' : 'duuri'}`
}

export function Tahtiasteikko() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const [searchParams] = useSearchParams()

  const root = searchParams.get('root') ?? 'C'
  const mode = parseMode(searchParams.get('mode'))
  const octaves = parseOctaves(searchParams.get('octaves'))
  const reachUpTo = searchParams.get('reachUpTo')
  const lowestNote = searchParams.get('low')

  // No sensitivity slider on this screen — it inherits the player's persisted
  // tuner sensitivity from the store (like the necklace game MVP).
  const calmness = useTunerStore((s) => s.calmness)
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

  // Reach-aware ascending sequence (8 for 1 octave; 15 for 2; 13/14 for "1+"),
  // the same source the drawn stave wraps, so targets line up with the canvas.
  const scaleNotes = useMemo(
    () => getScaleNotes(root, mode, octaves, reachUpTo, lowestNote),
    [root, mode, octaves, reachUpTo, lowestNote],
  )
  const top = scaleNotes.length - 1

  const target = scaleNotes[Math.min(targetIndex, top)]
  // Octave-aware key so only the actual target note highlights — the root and
  // its octave repeat share a letter, so a pitch-class key would light up both.
  const targetKey = `${target.letter}${target.accidental ?? ''}${target.octave}`
  // Octave-aware target: the player must play the note in the exact octave drawn
  // on the stave (e.g. A4, not any A), so compare absolute MIDI numbers.
  const targetMidi = useMemo(() => midiOf(formatNoteSPN(target)), [target])

  const matchesTarget = pitch.midi !== null && pitch.midi === targetMidi
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
          title='Tähtiasteikko'
          subtitle={scaleLabel(root, mode)}
          color='red'
          onBack={() => navigate('/harjoittelu')}
        />
      )}

      {/* Cap the stave width on desktop (like Soittohetki) so it isn't full-screen. */}
      <div className='mx-auto w-full md:max-w-130'>
        <MusicCanvas
          scaleKey={root}
          mode={mode}
          staves={1}
          octaves={octaves}
          reachUpTo={reachUpTo}
          lowestNote={lowestNote}
          scaleDirection={phase}
          highlightNotes={[targetKey]}
          highlightColor={HIGHLIGHT_COLOR}
          basicNoteColor={BASIC_NOTE_COLOR}
          className='aspect-[2/1] w-full bg-white md:aspect-[5/2] md:rounded-lg'
        />
      </div>

      {/* The taller wrapped stave leaves no room for a slider/stretch spacer, so the
          controls condense: the listen toggle rides the target-note line as an icon. */}
      <div className='mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center gap-1.5 px-2 py-2'>
        <div className='relative'>
          <TunerDial noteName={pitch.noteName} cents={pitch.cents} accuracyCents={levelCents} inTune={inTune} />
          <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
            <span className='font-medieval text-6xl font-bold tracking-wide text-[#6b1fa8] opacity-70 translate-y-[6px] [text-shadow:_-2px_-2px_0_rgba(255,195,0,0.55),_2px_-2px_0_rgba(255,195,0,0.55),_-2px_2px_0_rgba(255,195,0,0.55),_2px_2px_0_rgba(255,195,0,0.55),_0_0_12px_rgba(255,195,0,0.35)]'>
              Taso {level}
            </span>
          </div>
        </div>

        {/* hold progress — capped to the tuner-gauge width */}
        <div className='mx-auto h-2 w-full max-w-[260px] overflow-hidden rounded-full bg-[#f0dbb8]'>
          <div
            className='h-full rounded-full bg-[#7c6fd6] transition-[width] duration-100'
            style={{ width: `${Math.round(holdProgress * 100)}%` }}
          />
        </div>

        {/* Precision/time description — pulled up tight (≈2px) under the progress bar. */}
        <div className='-mt-1.5 mx-auto flex w-full max-w-[260px] items-baseline justify-end'>
          <span className='text-xs text-[#8B4513]'>
            Tarkkuus ±{levelCents} ¢ · Aika {holdSeconds} s
          </span>
        </div>

        {pitch.error && <p className='text-center text-xs text-red-700'>{pitch.error}</p>}

        {/* Target note + listen toggle, pinned to the bottom. The note is centered
            across the full width; the toggle floats at the right (absolute) so it
            doesn't pull the note off-center. */}
        <div className='relative mt-auto flex w-full items-center justify-center pt-1'>
          <p className='text-center text-xs text-[#5a2d0c]'>
            Soita{' '}
            <span className='text-lg font-bold text-[#a0563f]'>
              {target.letter}
              {target.accidental ?? ''}
              {target.octave}
            </span>{' '}
            <span className='text-[10px] text-[#8B4513]'>({formatNoteFi(target)})</span>
          </p>
          <button
            onClick={toggleListening}
            aria-label={pitch.listening ? 'Lopeta kuuntelu' : 'Aloita kuuntelu'}
            className={`absolute right-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
              pitch.listening ? 'bg-[#a0563f] active:bg-[#7a3f2e]' : 'bg-[#5a2d0c] active:bg-[#3a1a00]'
            }`}
          >
            {pitch.listening ? <Square size={18} /> : <Play size={18} />}
          </button>
        </div>
      </div>

      {/* Flying-star celebration layer — one StarFlight per star (count = level). */}
      {celebration &&
        Array.from({ length: celebration.count }, (_, i) => (
          <StarFlight key={`${celebration.id}-${i}`} tone={celebration.tone} durationMs={ANIMATION_OFF_MS} />
        ))}
    </div>
  )
}
