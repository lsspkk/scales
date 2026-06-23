import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { NecklaceCanvas } from '../components/ui/NecklaceCanvas'
import { AdmireView } from '../components/ui/AdmireView'
import type { NecklaceModel } from '../lib/necklace'
import {
  parseMode,
  scaleLabel,
  noteLetter,
  getScaleNotes,
  buildSteps,
  applyStepReward,
  freshNecklace,
  testNecklace,
  type NoteScore,
} from '../lib/necklaceModels'

/*
 * Jalokiviasteikko test screen (#/test/jalokiviasteikko) — drives the necklace by hand
 * instead of the mic/timer game, so the gem look-dev and the admire phase can be checked
 * without playing the scale. It walks the *exact same* up-then-down two-pass sequence as
 * the game (buildSteps): ascending notes mine an ore + set the colour, then the octave
 * turn + descending notes polish each gem to its finish. One note at a time, one slider
 * (drag or keyboard ← → / ↑ ↓; Enter applies and advances). "Arvo kivet" fills a whole
 * random necklace at once. All real gameplay lives in Jalokiviasteikko.tsx; this only
 * reuses the shared pieces (buildSteps/applyStepReward, NecklaceCanvas, AdmireView).
 */

const DEFAULT_LEVEL = 5
const emptyScores = (n: number): NoteScore[] => Array.from({ length: n }, () => ({ mine: null, polish: null }))

export function JalokiviasteikkoTest() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const root = searchParams.get('root') ?? 'C'
  const mode = parseMode(searchParams.get('mode'))

  // Admire mode is a real URL (…/jalokiviasteikko/kaulakoru) so back / swipe-back pop it.
  const admire = location.pathname.endsWith('/kaulakoru')
  const openAdmire = () => navigate(`/test/jalokiviasteikko/kaulakoru${location.search}`)
  const closeAdmire = () => navigate(-1)

  const scaleNotes = useMemo(() => getScaleNotes(root, mode), [root, mode])
  const socketCount = scaleNotes.length
  const steps = useMemo(() => buildSteps(socketCount - 1), [socketCount])

  const [model, setModel] = useState<NecklaceModel>(() => freshNecklace(socketCount))
  const [noteScores, setNoteScores] = useState<NoteScore[]>(() => emptyScores(socketCount))
  const [stepIndex, setStepIndex] = useState(0)
  const [level, setLevel] = useState(DEFAULT_LEVEL)
  const [done, setDone] = useState(false)

  // Keep the active socket spun to the front of whatever step we are on.
  useEffect(() => {
    if (!done) setModel((m) => ({ ...m, activeIndex: steps[stepIndex]?.index ?? 0 }))
  }, [stepIndex, done, steps])

  // Auto-focus the slider each step so the keyboard drives it without a click.
  const sliderRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!done && !admire) sliderRef.current?.focus()
  }, [stepIndex, done, admire])

  const step = steps[stepIndex]

  // Apply the current step's level (mine → colour, polish → finish) and advance.
  const apply = () => {
    setModel((m) => applyStepReward(m, step, level))
    setNoteScores((prev) => {
      const next = [...prev]
      const cur = next[step.index] ?? { mine: null, polish: null }
      next[step.index] = step.kind === 'mine' ? { ...cur, mine: level } : { ...cur, polish: level }
      return next
    })
    if (stepIndex + 1 >= steps.length) setDone(true)
    else setStepIndex(stepIndex + 1)
  }

  // Roll a whole random necklace at once: fresh palette + shapes + a random level per gem.
  const randomize = () => {
    const levels = scaleNotes.map(() => Math.floor(Math.random() * 11))
    setModel(testNecklace(levels))
    setNoteScores(levels.map((l) => ({ mine: l, polish: l })))
    setDone(true)
  }

  const restart = () => {
    setModel(freshNecklace(socketCount))
    setNoteScores(emptyScores(socketCount))
    setStepIndex(0)
    setLevel(DEFAULT_LEVEL)
    setDone(false)
  }

  if (admire) {
    return (
      <AdmireView
        model={model}
        scaleNotes={scaleNotes}
        noteScores={noteScores}
        title={scaleLabel(root, mode)}
        onClose={closeAdmire}
      />
    )
  }

  const passLabel = step?.kind === 'mine' ? 'Ylös · malmi (väri)' : 'Alas · hionta (kiilto)'

  return (
    <div className='relative flex min-h-0 flex-1 flex-col bg-[#05060f]'>
      {/* Slim header: back to the test menu + scale name + testitila badge. */}
      <div className='flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#0a0d1c] px-2 py-1.5 text-white'>
        <button
          onClick={() => navigate('/test')}
          aria-label='Takaisin'
          className='flex h-8 w-8 items-center justify-center'
        >
          <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='15 18 9 12 15 6' />
          </svg>
        </button>
        <div className='flex-1 truncate'>
          <span className='font-medieval text-base leading-tight'>{scaleLabel(root, mode)}</span>
          <span className='ml-2 text-xs text-white/55'>{socketCount} nuottia</span>
        </div>
        <span className='rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/55'>Testitila</span>
      </div>

      {/* Necklace hero — fills the viewport, builds up note by note. */}
      <div className='relative min-h-0 flex-1'>
        <NecklaceCanvas model={model} className='absolute inset-0' />
      </div>

      {/* Controls. */}
      <div className='shrink-0 border-t border-white/10 bg-[#0a0d1c] px-3 py-2 text-white'>
        {done ? (
          <div className='flex items-center justify-center gap-2 py-1'>
            <span className='mr-auto text-sm font-semibold text-white/80'>Kaulakoru on valmis!</span>
            <button
              onClick={openAdmire}
              className='min-h-[40px] rounded-lg bg-[#9fd0ff] px-4 text-sm font-bold text-[#05060f]'
            >
              Ihaile
            </button>
            <button
              onClick={restart}
              className='min-h-[40px] rounded-lg bg-white/15 px-4 text-sm font-bold text-white'
            >
              Aloita alusta
            </button>
          </div>
        ) : (
          <>
            <div className='mb-1.5 flex items-baseline gap-2 text-sm'>
              <span className='text-lg font-bold'>{noteLetter(scaleNotes[step.index])}</span>
              <span className='text-white/70'>{passLabel}</span>
              <span className='ml-auto text-xs text-white/45'>
                {stepIndex + 1}/{steps.length}
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <input
                ref={sliderRef}
                type='range'
                min={0}
                max={10}
                step={1}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    apply()
                  }
                }}
                aria-label={`Laatu nuotille ${noteLetter(scaleNotes[step.index])}`}
                className='h-2 flex-1 accent-[#9fd0ff]'
              />
              <span className='w-6 shrink-0 text-right tabular-nums text-white/80'>{level}</span>
            </div>
            <div className='mt-2 flex items-center gap-2'>
              <button
                onClick={apply}
                className='min-h-[40px] rounded-lg bg-[#9fd0ff] px-5 text-sm font-bold text-[#05060f]'
              >
                Seuraava
              </button>
              <button
                onClick={randomize}
                className='min-h-[40px] rounded-lg bg-white/15 px-4 text-sm font-bold text-white'
              >
                Arvo kivet
              </button>
              <span className='ml-auto text-xs text-white/45'>Enter = seuraava</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
