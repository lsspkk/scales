import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { ScaleDetailPanel } from '../components/ui/ScaleDetailPanel'
import { ScaleDetailModal } from '../components/ui/ScaleDetailModal'
import { VolumeSlider } from '../components/ui/VolumeSlider'
import { MarqueeText } from '../components/ui/MarqueeText'
import { useViewport } from '../lib/useViewport'
import { MusicCanvas } from '../components/ui/MusicCanvas'
import { PelicanTimer, type PelicanTimerVariant } from '../components/animations/PelicanTimer'
import { PelicanCelebration } from '../components/animations/PelicanCelebration'
import { useCountdownTimer } from '../lib/useCountdownTimer'
import { useScaleVariationQueue } from '../hooks/useScaleVariationQueue'
import { getScale } from '../lib/musicScale'
import { buildArpeggioNotesWithOctave, findScaleDetail } from '../lib/practiceMethod'
import { getScaleChords } from '../lib/scaleChords'
import { rollHiddenNotes, type ScaleVariation } from '../lib/scaleVariations'
import { getChordType } from '../lib/audio/chords'
import { SAMPLES } from '../lib/audio/samples'
import { noteNameToMidi } from '../lib/audio/tuning'
import { playChord, stopAll, setMasterVolume } from '../lib/audio/audioService'
import { Dice5, EyeOff, Info, Play, Square, Volume2, X } from 'lucide-react'

type Mode = 'ionian' | 'aeolian'
type View = 'scale' | 'arpeggio'

function parseAnimation(value: string | null): PelicanTimerVariant {
  return value === 'flying' ? 'flying' : 'walking'
}

function pickRandomAnimationVariant(): PelicanTimerVariant {
  return Math.random() < 0.5 ? 'walking' : 'flying'
}

const DURATION_PRESETS_MIN = [1, 3, 5, 10] as const
const DEFAULT_DURATION_MIN = 3

// Default playback octave for drone/chord roots. One octave below middle C
// (C3 = MIDI 48) so the drone sits as a calm background under most kid-violin
// practice ranges instead of competing with what the kid plays.
const ROOT_OCTAVE = 3
const INITIAL_VOLUME = 0.6

interface SoundOption {
  id: string
  label: string
  ariaLabel: string
  intervals: readonly number[]
}

interface SoundControlsRowProps {
  volume: number
  onVolumeChange: (value: number) => void
  sampleId: string
  onSampleChange: (sampleId: string) => void
  soundOptions: SoundOption[]
  selectedSoundId: string | null
  onSoundClick: (soundId: string) => void
}

interface TimerControlsRowProps {
  durationMin: number
  isRunning: boolean
  remainingMs: number
  onSelectDuration: (minutes: number) => void
  onStart: () => void
  onPause: () => void
  /** Mobile only: toggles the sound popover overlaid on the pelican box. */
  onToggleSound?: () => void
  soundOpen?: boolean
}

interface ScaleCanvasActionsProps {
  variation: ScaleVariation | null
  hiddenNotesActive: boolean
  onRollVariation: () => void
  onToggleHiddenNotes: () => void
  /** When provided (mobile only), renders an info button last that opens the scale-detail modal. */
  onShowInfo?: () => void
}

function parseMode(value: string | null): Mode {
  return value === 'aeolian' ? 'aeolian' : 'ionian'
}

function parseOctaves(value: string | null): number {
  const n = Number(value)
  if (n === 1 || n === 2 || n === 3) return n
  return 2
}

function buildLabel(root: string, mode: Mode, octaves: number): string {
  const modeWord = mode === 'ionian' ? 'duuri' : 'molli'
  const octWord = octaves === 1 ? 'oktaavi' : 'oktaavia'
  return `${root}-${modeWord}, ${octaves} ${octWord}`
}

type HiddenNoteState = { notes: [string, string]; active: boolean } | null

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function SoundControlsRow({
  volume,
  onVolumeChange,
  sampleId,
  onSampleChange,
  soundOptions,
  selectedSoundId,
  onSoundClick,
}: SoundControlsRowProps) {
  return (
    <div className='-mx-1 bg-[#5a6b3d] px-2 py-0 md:mx-0 md:mt-2 md:rounded-lg md:px-3 md:py-2'>
      <div className='flex items-center gap-1 md:gap-2 w-full'>
        <label className='sr-only' htmlFor='soittohetki-sample'>
          Näyte
        </label>
        <select
          id='soittohetki-sample'
          value={sampleId}
          onChange={(e) => onSampleChange(e.target.value)}
          className='justify-self-start shrink-0 rounded bg-[#fffbe9] px-2 py-1 text-sm font-semibold text-[#5a2d0c] min-w-[88px] max-w-[120px] focus:outline focus:outline-2 focus:outline-[#fffbe9] md:h-9'
        >
          {SAMPLES.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.label}
            </option>
          ))}
        </select>
        <div className='flex w-full grow gap-1 justify-end'>
          {soundOptions.map((option) => {
            const selected = selectedSoundId === option.id
            return (
              <button
                key={option.id}
                onClick={() => onSoundClick(option.id)}
                aria-pressed={selected}
                aria-label={option.ariaLabel}
                className={`shrink-0 rounded-md border-2 px-1.5 md:px-3 md:py-1 text-sm font-bold transition-colors ${
                  selected
                    ? 'bg-[#8B2500] border-[#8B2500] text-white'
                    : 'bg-[#fffbe9] border-[#c9a96e] text-[#5a2d0c] active:bg-[#f0dbb8]'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className='flex items-center overflow-x-auto mt-2 gap-1.5 justify-end w-full'>
        <VolumeSlider value={volume} onChange={onVolumeChange} className='flex-1 min-w-[80px] max-w-[160px]' />
      </div>
    </div>
  )
}

function TimerControlsRow({
  durationMin,
  isRunning,
  remainingMs,
  onSelectDuration,
  onStart,
  onPause,
  onToggleSound,
  soundOpen = false,
}: TimerControlsRowProps) {
  return (
    <div className='-mx-1 mt-1 md:mt-4 flex items-center gap-1 px-1 md:mx-0 md:gap-1.5 md:px-0'>
      <div className='flex gap-0.5 shrink-0 md:gap-1'>
        {DURATION_PRESETS_MIN.map((m) => {
          const selected = durationMin === m
          return (
            <button
              key={m}
              onClick={() => onSelectDuration(m)}
              disabled={isRunning}
              className={`h-[clamp(2rem,9vw,2.75rem)] w-[clamp(2rem,9vw,2.75rem)] rounded-full border-2 text-[clamp(0.65rem,2.8vw,0.75rem)] font-bold transition-colors md:h-11 md:w-11 md:text-xs ${
                selected
                  ? 'bg-[#8B2500] border-[#8B2500] text-white'
                  : 'bg-[#fffbe9] border-[#c9a96e] text-[#5a2d0c] active:bg-[#f0dbb8]'
              } disabled:opacity-40 disabled:pointer-events-none`}
              aria-pressed={selected}
              aria-label={`${m} minuuttia`}
            >
              {m}
            </button>
          )
        })}
      </div>
      <div
        className='min-w-[3.4ch] flex-1 text-center text-[#5a2d0c] text-[clamp(1.2rem,6.5vw,1.75rem)] font-bold tabular-nums leading-none md:min-w-[4ch] md:text-3xl'
        aria-live='polite'
      >
        {formatTime(remainingMs)}
      </div>
      {onToggleSound && (
        <button
          onClick={onToggleSound}
          aria-pressed={soundOpen}
          aria-label='Äänet'
          className={`h-[clamp(2.25rem,10vw,2.75rem)] w-[clamp(2.25rem,10vw,2.75rem)] shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
            soundOpen
              ? 'bg-[#8B2500] border-[#8B2500] text-white'
              : 'bg-[#fffbe9] border-[#c9a96e] text-[#5a2d0c] active:bg-[#f0dbb8]'
          }`}
        >
          <Volume2 size={20} />
        </button>
      )}
      <div className='shrink-0'>
        {isRunning ? (
          <button
            onClick={onPause}
            className='h-[clamp(2.25rem,10vw,2.75rem)] w-[clamp(2.25rem,10vw,2.75rem)] rounded-full bg-[#a0563f] text-white flex items-center justify-center active:bg-[#7a3f2e] md:h-11 md:w-11'
            aria-label='Tauko'
          >
            <Square size={20} />
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={remainingMs === 0}
            className='h-[clamp(2.25rem,10vw,2.75rem)] w-[clamp(2.25rem,10vw,2.75rem)] rounded-full bg-[#8B2500] text-white flex items-center justify-center active:bg-[#5a1700] disabled:opacity-40 disabled:pointer-events-none md:h-11 md:w-11'
            aria-label='Aloita'
          >
            <Play size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

/** Round neutral button that opens the scale-detail modal. Mobile only (desktop shows the panel inline). */
function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className='inline-flex items-center justify-center rounded-md border transition-colors h-7 w-7 mb-1 bg-[#fffbe9] border-[#c9a96e] text-[#8B4513] active:bg-[#f0dbb8] text-sm'
      aria-label='Näytä asteikon tiedot'
      title='Näytä asteikon tiedot'
    >
      <Info size={18} aria-hidden='true' className='-m-1' />
    </button>
  )
}

function VariationActions({
  variation,
  hiddenNotesActive,
  onRollVariation,
  onToggleHiddenNotes,
  onShowInfo,
}: ScaleCanvasActionsProps) {
  const baseButtonClass = 'inline-flex  items-center justify-center rounded-md border transition-colors h-7 w-7 mb-1'

  const variationButtonClass = variation
    ? 'bg-[#8B2500] border-[#8B2500] text-white text-sm'
    : 'bg-[#fffbe9] border-[#c9a96e] text-[#8B4513] active:bg-[#f0dbb8] text-sm'

  const hiddenNotesButtonClass = hiddenNotesActive
    ? 'bg-[#8B2500] border-[#8B2500] text-white text-sm'
    : 'bg-[#fffbe9] border-[#c9a96e] text-[#8B4513] active:bg-[#f0dbb8] text-sm'

  return (
    <div className='flex shrink-0 items-center gap-1'>
      <button
        onClick={onRollVariation}
        className={`${baseButtonClass} ${variationButtonClass}`}
        aria-label={variation ? 'Arvo uusi harjoitusmuunnos' : 'Arvo harjoitusmuunnos'}
        title='Arvo harjoitusmuunnos'
      >
        <Dice5 size={18} aria-hidden='true' className='-m-1' />
      </button>
      <button
        onClick={onToggleHiddenNotes}
        className={`${baseButtonClass} ${hiddenNotesButtonClass}`}
        aria-label={hiddenNotesActive ? 'Näytä piilotetut nuotit' : 'Piilota kaksi nuottia'}
        aria-pressed={hiddenNotesActive}
        title='Piilota kaksi nuottia'
      >
        <EyeOff size={18} aria-hidden='true' className='-m-1' />
      </button>
      {onShowInfo && <InfoButton onClick={onShowInfo} />}
    </div>
  )
}

export function Soittohetki() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<View>('scale')
  const animationParam = searchParams.get('anim')

  const root = searchParams.get('root') ?? 'C'
  const mode = parseMode(searchParams.get('mode'))
  const octaves = parseOctaves(searchParams.get('octaves'))
  const levelParam = Number(searchParams.get('level'))
  const level = levelParam === 1 || levelParam === 2 || levelParam === 3 ? levelParam : undefined
  const label = useMemo(() => buildLabel(root, mode, octaves), [root, mode, octaves])

  // The active scale is always known from the URL, so its detail is resolved
  // directly (no selection state). Shown as an always-open panel on desktop and
  // behind an info button → modal on mobile.
  const scaleDetail = useMemo(() => findScaleDetail(root, mode, octaves, level), [root, mode, octaves, level])
  const [showInfo, setShowInfo] = useState(false)

  const scaleNotes = useMemo(() => getScale(root, mode), [root, mode])
  const arpeggioNotes = useMemo(() => buildArpeggioNotesWithOctave(scaleNotes, root), [scaleNotes, root])
  const { variation, rollNextVariation, clearVariation } = useScaleVariationQueue()
  const [hiddenNoteState, setHiddenNoteState] = useState<HiddenNoteState>(null)

  const durationMinStr = searchParams.get('min')
  const durationMin = (() => {
    const n = Number(durationMinStr)
    return (DURATION_PRESETS_MIN as readonly number[]).includes(n) ? n : DEFAULT_DURATION_MIN
  })()
  const durationMs = durationMin * 60_000
  const animationVariant = parseAnimation(animationParam)

  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (animationParam) return
    const next = new URLSearchParams(searchParams)
    next.set('anim', pickRandomAnimationVariant())
    setSearchParams(next, { replace: true })
  }, [animationParam, searchParams, setSearchParams])

  useEffect(() => {
    clearVariation()
    setHiddenNoteState(null)
  }, [root, mode, clearVariation])

  const { remainingMs, isRunning, start, pause, reset } = useCountdownTimer(durationMs, () => {
    setShowCelebration(true)
  })

  const [runId, setRunId] = useState(0)
  const bumpRun = () => setRunId((n) => n + 1)
  const dismissCelebration = () => setShowCelebration(false)

  // Sound-row state
  const [sampleId, setSampleId] = useState<string>(SAMPLES[0].id)
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null)
  const [volume, setVolume] = useState<number>(INITIAL_VOLUME)
  // Mobile: the sound controls live in a popover over the pelican box (desktop shows
  // them inline). Toggled by the speaker button on the timer row.
  const [showSound, setShowSound] = useState(false)

  // Push the initial slider value into the engine once on mount so the engine
  // and the on-screen control agree before any playback starts.
  useEffect(() => {
    setMasterVolume(INITIAL_VOLUME)
  }, [])

  const handleVolumeChange = (v: number) => {
    setVolume(v)
    setMasterVolume(v)
  }

  const handleRollVariation = () => rollNextVariation()

  const handleToggleHiddenNotes = () => {
    setHiddenNoteState((current) => {
      if (!current) {
        const rolled = rollHiddenNotes(scaleNotes)
        return rolled ? { notes: rolled, active: true } : current
      }
      if (current.active) {
        return { ...current, active: false }
      }
      const rolled = rollHiddenNotes(scaleNotes, current.notes)
      return rolled ? { notes: rolled, active: true } : null
    })
  }

  const activeHiddenNotes = hiddenNoteState?.active ? hiddenNoteState.notes : undefined
  // Drop the same notes the canvas hides (matched by name) so the note-name line stays in sync.
  const hiddenSet = new Set(activeHiddenNotes)
  const visibleNotes = scaleNotes.filter((note) => !hiddenSet.has(note))
  const scaleLineText = variation ? `Soita: ${variation.text}` : visibleNotes.join(' – ')

  // Build the sound list: tonic drone first, then diatonic chord suggestions.
  const soundOptions = useMemo<SoundOption[]>(() => {
    const droneOption: SoundOption = {
      id: 'drone',
      label: root,
      ariaLabel: `${root} pohjasävel`,
      intervals: [0],
    }
    const chordOptions: SoundOption[] = getScaleChords(root, mode)
      .map((suggestion) => {
        const ct = getChordType(suggestion.chordTypeId)
        if (!ct) return null
        return {
          id: suggestion.id,
          label: suggestion.label,
          ariaLabel: `${suggestion.rootNote} ${ct.label}`,
          intervals: ct.intervals,
        }
      })
      .filter((o): o is SoundOption => o !== null)
    return [droneOption, ...chordOptions]
  }, [root, mode])

  const activeSound = useMemo(
    () => soundOptions.find((s) => s.id === selectedSoundId) ?? null,
    [soundOptions, selectedSoundId],
  )

  // Drive playback off (isRunning ∧ activeSound). Cleanup runs on pause, on
  // time-up (isRunning flips false), on selection / sample change, and on
  // unmount — each path stops everything via stopAll.
  useEffect(() => {
    if (!isRunning || !activeSound) {
      stopAll()
      return
    }
    let cancelled = false
    const rootMidi = noteNameToMidi(`${root}${ROOT_OCTAVE}`)
    void playChord({
      sampleId,
      rootMidi,
      intervals: activeSound.intervals,
      loop: true,
    }).then(() => {
      // If pause/unmount/selection-change happened during decode, kill the
      // voices that just started.
      if (cancelled) stopAll()
    })
    return () => {
      cancelled = true
      stopAll()
    }
  }, [isRunning, activeSound, sampleId, root])

  const handleSoundClick = (id: string) => {
    setSelectedSoundId((current) => (current === id ? null : id))
  }

  const setDurationMin = (m: number) => {
    if (isRunning) return

    bumpRun()
    dismissCelebration()

    if (m === durationMin) {
      reset()
      return
    }

    const next = new URLSearchParams(searchParams)
    next.set('min', String(m))
    setSearchParams(next, { replace: true })
  }

  const handleStart = () => {
    dismissCelebration()
    start()
  }

  return (
    <div className='flex flex-col h-[100svh] bg-[#fffbe9] md:h-full'>
      {isDesktop ? (
        <div className='w-full bg-[#a0563f] border-b border-[#3a1a00]'>
          <div className='max-w-[1200px] mx-auto px-8 flex items-center justify-between gap-3'>
            <span className='text-sm font-semibold text-white'>{label}</span>
            <button
              onClick={() => navigate('/harjoittelu')}
              className='inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold text-white hover:bg-[#b86a52] focus:outline focus:outline-2 focus:outline-[#fffbe9]'
              aria-label='Takaisin'
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <polyline points='15 18 9 12 15 6' />
              </svg>
              <span>Takaisin</span>
            </button>
          </div>
        </div>
      ) : (
        <ScreenHeader title={label} color='red' onBack={() => navigate('/harjoittelu')} />
      )}

      {/* On desktop, lay the play column beside an always-open scale-detail panel */}
      <div className='flex-1 min-h-0 flex flex-col md:flex-row md:items-start md:justify-center md:gap-6 md:overflow-y-auto'>
        {/* Outer flex-col: fills remaining screen on mobile, auto height on desktop */}
        <div className='flex-1 min-h-0 flex flex-col w-full md:max-w-130 md:flex-none md:min-h-fit md:px-4 md:py-4'>
          {/* Row 1: Canvas — fixed by content */}
          <div className='w-full shrink-0'>
            {view === 'scale' ? (
              <>
                <MusicCanvas
                  scaleKey={root}
                  mode={mode}
                  staves={1}
                  octaves={octaves}
                  reachUpTo={scaleDetail.reachUpTo}
                  lowestNote={scaleDetail.lowestNote}
                  hiddenNotes={activeHiddenNotes}
                  className='w-full aspect-[2/1] bg-[#fff3c9] md:aspect-4/1 md:rounded-lg'
                />
                <div className='mt-1 flex items-center gap-1 pl-4 pr-2 md:mt-2 md:gap-1.5 md:px-0'>
                  <MarqueeText
                    text={scaleLineText}
                    className={`min-w-0 flex-1 text-xs md:text-sm ${variation ? 'text-[#8B2500] font-medium' : 'text-[#8B4513]'}`}
                  />
                  <VariationActions
                    variation={variation}
                    hiddenNotesActive={hiddenNoteState?.active ?? false}
                    onRollVariation={handleRollVariation}
                    onToggleHiddenNotes={handleToggleHiddenNotes}
                    onShowInfo={isDesktop ? undefined : () => setShowInfo(true)}
                  />
                </div>
              </>
            ) : (
              <>
                <MusicCanvas
                  arpeggioNotes={arpeggioNotes}
                  staves={1}
                  className='w-full aspect-[2/1] bg-[#fff3c9] md:aspect-4/1 md:rounded-lg'
                />
                <div className='mt-1 flex items-center gap-1 pl-4 pr-2 md:mt-2 md:gap-1.5 md:px-0'>
                  <p className='min-w-0 flex-1 text-xs md:text-sm text-[#8B4513] text-center md:text-left'>
                    {arpeggioNotes.map((n) => `${n.letter}${n.accidental ?? ''}`).join(' – ')}
                  </p>
                  {!isDesktop && <InfoButton onClick={() => setShowInfo(true)} />}
                </div>
              </>
            )}
          </div>

          {/* Row 2: fills remaining vertical space on mobile */}
          <div className='flex-1 min-h-0 flex flex-col gap-3 md:pt-4 px-1 w-full md:px-0'>
            {/* Animation + shared controls */}
            <div className='@container flex-1 min-h-0 flex items-center justify-center overflow-hidden'>
              <div className='relative w-full h-[min(100cqh,100cqw)] max-h-full rounded-2xl overflow-hidden bg-[#fffbe9] md:w-full md:h-[35svh] md:min-h-[180px] md:max-h-[360px]'>
                {showCelebration ? (
                  <PelicanCelebration variant={animationVariant} />
                ) : (
                  <PelicanTimer
                    key={`${animationVariant}-${durationMs}-${runId}`}
                    variant={animationVariant}
                    durationMs={durationMs}
                    isRunning={isRunning}
                  />
                )}
                <div className='absolute top-1 right-1 z-10 flex gap-0.5 md:top-1.5 md:right-1.5 md:gap-1'>
                  <button
                    onClick={() => {
                      dismissCelebration()
                      setView('scale')
                    }}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors shadow-sm md:w-9 md:h-9 md:rounded-lg ${
                      view === 'scale'
                        ? 'bg-[#8B2500] text-white'
                        : 'bg-[#f0dbb8]/90 text-[#5a2d0c] active:bg-[#e0c590]'
                    }`}
                    aria-pressed={view === 'scale'}
                    aria-label='Asteikko'
                  >
                    <svg className='w-4 h-4 md:w-5 md:h-5' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                      <circle cx='4' cy='18' r='2.2' />
                      <circle cx='10' cy='13' r='2.2' />
                      <circle cx='16' cy='8' r='2.2' />
                      <circle cx='22' cy='3' r='2.2' />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      dismissCelebration()
                      setView('arpeggio')
                    }}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors shadow-sm md:w-9 md:h-9 md:rounded-lg ${
                      view === 'arpeggio'
                        ? 'bg-[#8B2500] text-white'
                        : 'bg-[#f0dbb8]/90 text-[#5a2d0c] active:bg-[#e0c590]'
                    }`}
                    aria-pressed={view === 'arpeggio'}
                    aria-label='Arpeggio'
                  >
                    <svg className='w-4 h-4 md:w-5 md:h-5' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                      <rect x='3' y='17' width='4' height='7' rx='0.5' />
                      <rect x='9' y='12' width='4' height='12' rx='0.5' />
                      <rect x='15' y='7' width='4' height='17' rx='0.5' />
                    </svg>
                  </button>
                </div>

                {/* Mobile sound popover — overlaid on the pelican box, usable while it
                    plays. The reference tone still starts/stops with the timer's Start. */}
                {!isDesktop && showSound && (
                  <div className='absolute inset-x-0 bottom-1 z-20 translate-y-[6px]'>
                    <div className='relative rounded-xs bg-[#5a6b3d] pt-[46px] pb-2 shadow-lg'>
                      <button
                        onClick={() => setShowSound(false)}
                        aria-label='Sulje äänet'
                        className='absolute right-1 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#3a1a00] text-white active:bg-[#1f0e00]'
                      >
                        <X size={20} />
                      </button>
                      <SoundControlsRow
                        volume={volume}
                        onVolumeChange={handleVolumeChange}
                        sampleId={sampleId}
                        onSampleChange={setSampleId}
                        soundOptions={soundOptions}
                        selectedSoundId={selectedSoundId}
                        onSoundClick={handleSoundClick}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className='justify-self-end'>
              {isDesktop && (
                <SoundControlsRow
                  volume={volume}
                  onVolumeChange={handleVolumeChange}
                  sampleId={sampleId}
                  onSampleChange={setSampleId}
                  soundOptions={soundOptions}
                  selectedSoundId={selectedSoundId}
                  onSoundClick={handleSoundClick}
                />
              )}
              <TimerControlsRow
                durationMin={durationMin}
                isRunning={isRunning}
                remainingMs={remainingMs}
                onSelectDuration={setDurationMin}
                onStart={handleStart}
                onPause={pause}
                onToggleSound={isDesktop ? undefined : () => setShowSound((v) => !v)}
                soundOpen={showSound}
              />
            </div>
          </div>
        </div>

        {isDesktop && (
          <aside className='w-[360px] shrink-0 md:py-4 md:pr-4'>
            <div className='bg-[#faf3d8] border border-[#c9a96e] rounded-xl p-4'>
              <h3 className='text-lg font-bold text-[#5a2d0c] mb-4 pb-2 border-b border-[#c9a96e]'>
                {scaleDetail.label}
              </h3>
              <ScaleDetailPanel detail={scaleDetail} />
            </div>
          </aside>
        )}
      </div>

      {!isDesktop && showInfo && (
        <ScaleDetailModal title={label} onClose={() => setShowInfo(false)}>
          <ScaleDetailPanel detail={scaleDetail} />
        </ScaleDetailModal>
      )}
    </div>
  )
}
