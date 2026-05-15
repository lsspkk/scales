import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { MusicCanvas } from '../components/ui/MusicCanvas'
import { useCountdownTimer } from '../lib/useCountdownTimer'
import { getScale } from '../lib/musicScale'
import { buildArpeggioNotesWithOctave } from '../lib/practiceMethod'

type Mode = 'ionian' | 'aeolian'
type View = 'scale' | 'arpeggio'

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

function PlayIcon() {
  return (
    <svg width='28' height='28' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <polygon points='7,5 19,12 7,19' />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width='28' height='28' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <rect x='6' y='5' width='4' height='14' rx='1' />
      <rect x='14' y='5' width='4' height='14' rx='1' />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M3 12a9 9 0 1 0 3-6.7L3 8' />
      <polyline points='3,3 3,8 8,8' />
    </svg>
  )
}

export function Soittohetki() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<View>('scale')

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

  const { remainingMs, isRunning, start, pause, reset } = useCountdownTimer(durationMs)

  const setDurationMin = (m: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('min', String(m))
    setSearchParams(next, { replace: true })
  }

  const isInitial = !isRunning && remainingMs === durationMs

  return (
    <div className='flex flex-col h-full bg-[#fffbe9]'>
      <ScreenHeader title={label} color='red' onBack={() => navigate('/harjoittelu')} />

      <div className='flex-1 overflow-y-auto'>
        <div className='flex flex-col items-center gap-4 px-4 py-4 max-w-[520px] mx-auto'>
          {/* Scale / Arpeggio toggle */}
          <div className='w-full flex rounded-xl overflow-hidden border-2 border-[#c9a96e]'>
            <button
              onClick={() => setView('scale')}
              className={`flex-1 min-h-[44px] text-base font-semibold transition-colors ${
                view === 'scale' ? 'bg-[#8B2500] text-white' : 'bg-[#fffbe9] text-[#5a2d0c] active:bg-[#f0dbb8]'
              }`}
              aria-pressed={view === 'scale'}
            >
              Asteikko
            </button>
            <button
              onClick={() => setView('arpeggio')}
              className={`flex-1 min-h-[44px] text-base font-semibold transition-colors border-l-2 border-[#c9a96e] ${
                view === 'arpeggio' ? 'bg-[#8B2500] text-white' : 'bg-[#fffbe9] text-[#5a2d0c] active:bg-[#f0dbb8]'
              }`}
              aria-pressed={view === 'arpeggio'}
            >
              Arpeggio
            </button>
          </div>

          {/* Music canvas */}
          <div className='w-full'>
            {view === 'scale' ? (
              <>
                <MusicCanvas scaleKey={root} mode={mode} staves={1} className='w-full aspect-[4/1] bg-[#fff3c9] rounded-lg' />
                <p className='text-sm text-[#8B4513] mt-2 text-center'>{scaleNotes.join(' – ')}</p>
              </>
            ) : (
              <>
                <MusicCanvas arpeggioNotes={arpeggioNotes} staves={1} className='w-full aspect-[4/1] bg-[#fff3c9] rounded-lg' />
                <p className='text-sm text-[#8B4513] mt-2 text-center'>
                  {arpeggioNotes.map((n) => `${n.letter}${n.accidental ?? ''}`).join(' – ')}
                </p>
              </>
            )}
          </div>

          {/* Timer label + display */}
          <h2 className='text-sm font-bold text-[#5a2d0c] mt-2'>Ajastettu soittohetki</h2>
          <div className='text-[#5a2d0c] text-4xl font-bold tabular-nums' aria-live='polite'>
            {formatTime(remainingMs)}
          </div>

          {/* Animation placeholder — Task 21 fills this with the countdown animation */}
          <div className='w-full aspect-square max-w-[260px] rounded-2xl border-2 border-dashed border-[#c9a96e] bg-[#faf3d8] flex items-center justify-center'>
            <span className='text-[#8B4513] text-xs italic'>Animaatio (tehtävä 21)</span>
          </div>

          {/* Duration picker + play/reset controls — single row */}
          <div className='flex gap-2 items-center flex-wrap justify-center'>
            {DURATION_PRESETS_MIN.map((m) => {
              const selected = durationMin === m
              return (
                <button
                  key={m}
                  onClick={() => setDurationMin(m)}
                  disabled={isRunning}
                  className={`w-12 h-12 rounded-full border-2 text-base font-bold transition-colors ${
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
            {isRunning ? (
              <button
                onClick={pause}
                className='w-14 h-14 rounded-full bg-[#a0563f] text-white flex items-center justify-center active:bg-[#7a3f2e]'
                aria-label='Tauko'
              >
                <PauseIcon />
              </button>
            ) : (
              <button
                onClick={start}
                disabled={remainingMs === 0}
                className='w-14 h-14 rounded-full bg-[#8B2500] text-white flex items-center justify-center active:bg-[#5a1700] disabled:opacity-40 disabled:pointer-events-none'
                aria-label='Aloita'
              >
                <PlayIcon />
              </button>
            )}
            {!isInitial && (
              <button
                onClick={reset}
                className='w-12 h-12 rounded-full border-2 border-[#5a2d0c] text-[#5a2d0c] flex items-center justify-center active:bg-[#f0dbb8]'
                aria-label='Alusta'
              >
                <ResetIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
