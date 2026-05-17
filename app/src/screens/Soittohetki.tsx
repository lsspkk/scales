import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { useViewport } from '../lib/useViewport'
import { MusicCanvas } from '../components/ui/MusicCanvas'
import { PelicanTimer, type PelicanTimerVariant } from '../components/animations/PelicanTimer'
import { PelicanCelebration } from '../components/animations/PelicanCelebration'
import { useCountdownTimer } from '../lib/useCountdownTimer'
import { getScale } from '../lib/musicScale'
import { buildArpeggioNotesWithOctave } from '../lib/practiceMethod'
import { Pause, Play } from 'lucide-react'

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

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
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
  const label = useMemo(() => buildLabel(root, mode, octaves), [root, mode, octaves])

  const scaleNotes = useMemo(() => getScale(root, mode), [root, mode])
  const arpeggioNotes = useMemo(() => buildArpeggioNotesWithOctave(scaleNotes, root), [scaleNotes, root])

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

  const { remainingMs, isRunning, start, pause, reset } = useCountdownTimer(durationMs, () => {
    setShowCelebration(true)
  })

  const [runId, setRunId] = useState(0)
  const bumpRun = () => setRunId((n) => n + 1)
  const dismissCelebration = () => setShowCelebration(false)

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
    <div className='flex flex-col h-full bg-[#fffbe9]'>
      {isDesktop ? (
        <div className='w-full bg-[#a0563f] border-b border-[#3a1a00]'>
          <div className='max-w-[1200px] mx-auto px-8 flex items-center justify-between gap-3'>
            <span className='text-sm font-semibold text-white'>{label}</span>
            <button
              onClick={() => navigate('/harjoittelu')}
              className='inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold text-white hover:bg-[#b86a52] focus:outline focus:outline-2 focus:outline-[#fffbe9]'
              aria-label='Takaisin'
            >
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <polyline points='15 18 9 12 15 6' />
              </svg>
              <span>Takaisin</span>
            </button>
          </div>
        </div>
      ) : (
        <ScreenHeader title={label} color='red' onBack={() => navigate('/harjoittelu')} />
      )}

      {/* Outer flex-col: fills remaining screen on mobile, auto height on desktop */}
      <div className='flex-1 min-h-0 flex flex-col w-full pb-4 md:max-w-130 md:mx-auto md:flex-none md:min-h-fit md:px-4 md:py-4'>
        {/* Row 1: Canvas — fixed by content */}
        <div className='w-full shrink-0'>
          {view === 'scale' ? (
            <>
              <MusicCanvas
                scaleKey={root}
                mode={mode}
                staves={1}
                className='w-full aspect-4/1 bg-[#fff3c9] md:rounded-lg'
              />
              <p className='px-4 mt-2 text-sm text-[#8B4513] text-center md:px-0'>{scaleNotes.join(' – ')}</p>
            </>
          ) : (
            <>
              <MusicCanvas
                arpeggioNotes={arpeggioNotes}
                staves={1}
                className='w-full aspect-4/1 bg-[#fff3c9] md:rounded-lg'
              />
              <p className='px-4 mt-2 text-sm text-[#8B4513] text-center md:px-0'>
                {arpeggioNotes.map((n) => `${n.letter}${n.accidental ?? ''}`).join(' – ')}
              </p>
            </>
          )}
        </div>

        {/* Row 2: fills remaining vertical space on mobile */}
        <div className='flex-1 min-h-0 flex flex-col gap-3 pt-4 px-4 w-full pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:px-0 md:pb-0'>
          {/* subrow 1: Title + view toggle — fixed by content */}
          <div className='flex flex-row w-full justify-end items-center gap-2 shrink-0'>
            <div className='flex gap-1'>
              <button
                onClick={() => {
                  dismissCelebration()
                  setView('scale')
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  view === 'scale' ? 'bg-[#8B2500] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c] active:bg-[#e0c590]'
                }`}
                aria-pressed={view === 'scale'}
                aria-label='Asteikko'
              >
                <svg width='22' height='22' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
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
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  view === 'arpeggio' ? 'bg-[#8B2500] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c] active:bg-[#e0c590]'
                }`}
                aria-pressed={view === 'arpeggio'}
                aria-label='Arpeggio'
              >
                <svg width='22' height='22' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                  <rect x='3' y='17' width='4' height='7' rx='0.5' />
                  <rect x='9' y='12' width='4' height='12' rx='0.5' />
                  <rect x='15' y='7' width='4' height='17' rx='0.5' />
                </svg>
              </button>
            </div>
          </div>

          {/* subrow 2: Animation + shared controls */}
          <div className='flex-1 min-h-0 flex flex-col gap-3 min-w-0'>
            <div className='flex-1 min-h-0 flex items-center justify-center overflow-hidden'>
              <div className='w-full max-w-[min(100%,calc(100svw-2rem))] aspect-square max-h-[min(100%,calc(100svw-2rem))] self-center rounded-2xl overflow-hidden bg-[#fffbe9] md:w-full md:max-w-none md:h-[35svh] md:min-h-[180px] md:max-h-[360px] md:aspect-auto'>
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
              </div>
            </div>
            <div className='-mx-4 mt-auto flex items-center gap-1 px-1 md:mx-0 md:gap-1.5 md:px-0'>
              <div className='flex gap-0.5 shrink-0 md:gap-1'>
                {DURATION_PRESETS_MIN.map((m) => {
                  const selected = durationMin === m
                  return (
                    <button
                      key={m}
                      onClick={() => setDurationMin(m)}
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
              <div className='shrink-0'>
                {isRunning ? (
                  <button
                    onClick={pause}
                    className='h-[clamp(2.25rem,10vw,2.75rem)] w-[clamp(2.25rem,10vw,2.75rem)] rounded-full bg-[#a0563f] text-white flex items-center justify-center active:bg-[#7a3f2e] md:h-11 md:w-11'
                    aria-label='Tauko'
                  >
                    <Pause size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={remainingMs === 0}
                    className='h-[clamp(2.25rem,10vw,2.75rem)] w-[clamp(2.25rem,10vw,2.75rem)] rounded-full bg-[#8B2500] text-white flex items-center justify-center active:bg-[#5a1700] disabled:opacity-40 disabled:pointer-events-none md:h-11 md:w-11'
                    aria-label='Aloita'
                  >
                    <Play size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
