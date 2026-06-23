import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useViewport } from '../lib/useViewport'
import { NecklaceCanvas } from '../components/ui/NecklaceCanvas'
import { AdmireView } from '../components/ui/AdmireView'
import { TuningBar } from '../components/ui/TuningBar'
import { Button } from '../components/ui/Button'
import { useMicPitch } from '../hooks/useMicPitch.ts'
import { useTunerStore, calmnessToSettings } from '../stores/tunerStore.ts'
import { formatNoteSPN } from '../lib/noteOctave.ts'
import { noteNameToMidi } from '../lib/audio/tuning.ts'
import { rollPalette, mulberry32, COLOR_PATTERNS, FORM_SETS, type NecklaceModel, type NecklaceOverlay } from '../lib/necklace'
import {
  parseMode,
  scaleLabel,
  noteLetter,
  getScaleNotes,
  decorativeNecklace,
  emptyNecklace,
  buildSteps,
  applyStepReward,
  type Step,
  type NoteScore,
} from '../lib/necklaceModels'

/*
 * Jalokiviasteikko — the gem-necklace scale game (Task 34, MVP: Level 1).
 *
 * The player plays the chosen scale up and then back down; the necklace records how
 * well each note was played. Ascending mines an ore into each socket (the *set* pass
 * → gem colour intensity); descending polishes it into a finished gem (the *polish*
 * pass → finish). Better intonation = a more vivid, better-polished gem. One full
 * up-and-down run = one finished necklace.
 *
 * The tuner wiring mirrors Tähtiasteikko; the genuinely new part is the phase-timer
 * state machine below (count-in → between-note pause → delayed reveal → timed
 * evaluation window → resolve) plus the horizontal TuningBar. The settled gameplay
 * spec is docs/game-necklace-in-tune-step.md.
 */

// ── Tunables (MVP ships Level 1 only — game-necklace-in-tune-step.md §2). Tune freely. ──
const LEVELS = [
  { revealAfterMs: 3000, windowMs: 3000 }, // Level 1
  // Level 2: { revealAfterMs: 8000, windowMs: 2000 }  — later
  // Level 3: identifier never appears — later
] as const
const LEVEL = LEVELS[0]
const BETWEEN_NOTE_MS = 1000 // §2.5 cadence + poor-result pause
const COUNTDOWN_STEP_MS = 1000 // 4 3 2 1
const COUNTDOWN_FROM = 4
const GOOD_ZONE_CENTS = 12 // §3 shaded band half-width (playtest)
const MAX_OFF_CENTS = 50 // beyond this a sampled frame scores 0 centeredness
const POOR_SCORE = 0.3 // window score below this → neutral "didn't hear it" pause
const AUTO_REPLAY_MS = 20000 // end-of-round auto-advance

// score(0..1) → one of 11 visible reward levels (0..10), so the level matches the
// "pisteet y/10" the player sees. We store the level as `level/10` on the socket:
// the *set* pass writes `quality` (→ gem colour) and the *polish* pass writes
// `gem.polish` (→ cracks / sparkles). The renderer maps that 0..1 carrier back to a
// 0..10 level through the editable LEVEL_* tables in necklace.ts — tune the *look*
// of each score there, not here.
const scoreToLevel = (score: number) => Math.max(0, Math.min(10, Math.round(score * 10)))

const HELP_LINES = [
  'Soita asteikon nuotit yksi kerrallaan.',
  'Ensin asteikkoa ylös, sitten alas.',
  'Kuuntelen nuotin virettä tietyn ajan.',
  'Puhtaampi nuotti - upeampi jalokivi.',
]

/** Pitch class (0–11) of a note string like "Bb4", tolerant of bad input. */
function pitchClassOf(spn: string): number | null {
  try {
    return ((noteNameToMidi(spn) % 12) + 12) % 12
  } catch {
    return null
  }
}

type Phase = 'idle' | 'countdown' | 'pause' | 'reveal' | 'window' | 'poor' | 'done'

/** Render-relevant snapshot the rAF game loop mirrors into React state. */
interface View {
  phase: Phase
  countdown: number | null
  noteLabel: string | null
  focusRing: boolean
  barActive: boolean
  timer: number | null
  message: string | null
  /** Whole seconds left on the end-of-round auto-replay, or null when not counting. */
  autoReplayLeft: number | null
}

const IDLE_VIEW: View = {
  phase: 'idle',
  countdown: null,
  noteLabel: null,
  focusRing: false,
  barActive: false,
  timer: null,
  message: null,
  autoReplayLeft: null,
}

function viewsEqual(a: View, b: View): boolean {
  return (
    a.phase === b.phase &&
    a.countdown === b.countdown &&
    a.noteLabel === b.noteLabel &&
    a.focusRing === b.focusRing &&
    a.barActive === b.barActive &&
    a.timer === b.timer &&
    a.message === b.message &&
    a.autoReplayLeft === b.autoReplayLeft
  )
}

/** Mutable game clock kept out of React (advanced by the rAF loop). */
interface GameState {
  steps: Step[]
  stepIndex: number
  phase: Phase
  tMs: number
  scoreSum: number
  scoreCount: number
  resultMessage: string | null
}

export function Jalokiviasteikko() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDesktop } = useViewport()
  const [searchParams] = useSearchParams()

  // Admire mode is a real URL (…/jalokiviasteikko/kaulakoru) so the device back button
  // and the edge swipe-back gesture pop the overlay and return to the game instead of
  // leaving the screen. Entering it is a history push; the X / back / swipe all pop it.
  const admire = location.pathname.endsWith('/kaulakoru')
  const openAdmire = () => navigate(`/jalokiviasteikko/kaulakoru${location.search}`)
  const closeAdmire = () => navigate(-1)

  const root = searchParams.get('root') ?? 'C'
  const mode = parseMode(searchParams.get('mode'))

  const calmness = useTunerStore((s) => s.calmness)
  const pitch = useMicPitch(calmnessToSettings(calmness))

  const scaleNotes = useMemo(() => getScaleNotes(root, mode), [root, mode])
  const socketCount = scaleNotes.length
  const top = socketCount - 1
  const targetPcs = useMemo(() => scaleNotes.map((n) => pitchClassOf(formatNoteSPN(n))), [scaleNotes])

  const [model, setModel] = useState<NecklaceModel>(() => decorativeNecklace(0x5eed, socketCount))
  const [view, setView] = useState<View>(IDLE_VIEW)
  const [infoOpen, setInfoOpen] = useState(false)
  const [autoReplayOn, setAutoReplayOn] = useState(true)
  const [noteScores, setNoteScores] = useState<NoteScore[]>(() =>
    Array.from({ length: socketCount }, () => ({ mine: null, polish: null })),
  )
  // Rolled gem colour-set ("teema") name shown during the count-in — fresh every round.
  const [themeName, setThemeName] = useState('')

  // Refs the rAF loop reads live (it is created once, with empty deps).
  const game = useRef<GameState>({
    steps: [],
    stepIndex: 0,
    phase: 'idle',
    tMs: 0,
    scoreSum: 0,
    scoreCount: 0,
    resultMessage: null,
  })
  const pitchRef = useRef(pitch)
  pitchRef.current = pitch
  const pausedRef = useRef(false)
  pausedRef.current = infoOpen
  const autoReplayRef = useRef(autoReplayOn)
  autoReplayRef.current = autoReplayOn
  const admireRef = useRef(admire)
  admireRef.current = admire
  const scaleRef = useRef({ targetPcs, scaleNotes, top })
  scaleRef.current = { targetPcs, scaleNotes, top }

  // Begin a fresh round: empty necklace, build steps, count-in for the first note,
  // and make sure the mic is listening. Used by the Aloita button and auto-replay.
  const startRound = useRef<() => void>(() => {})
  startRound.current = () => {
    const { top: t } = scaleRef.current
    game.current = {
      steps: buildSteps(t),
      stepIndex: 0,
      phase: 'countdown',
      tMs: 0,
      scoreSum: 0,
      scoreCount: 0,
      resultMessage: null,
    }
    // Roll a fresh colour-set + shape-set each round so the kid is motivated to see them all.
    const pattern = COLOR_PATTERNS[Math.floor(Math.random() * COLOR_PATTERNS.length)]
    const formSet = FORM_SETS[Math.floor(Math.random() * FORM_SETS.length)]
    const seed = Math.floor(Math.random() * 1e9)
    const count = scaleRef.current.scaleNotes.length
    setThemeName(pattern.label)
    setModel(emptyNecklace(seed, count, rollPalette(pattern, count, mulberry32(seed)), formSet))
    setNoteScores(Array.from({ length: count }, () => ({ mine: null, polish: null })))
    if (!pitchRef.current.listening) void pitch.start()
  }

  useEffect(() => {
    let raf = 0
    let lastNow = performance.now()

    const letterOf = (i: number) => noteLetter(scaleRef.current.scaleNotes[i])

    const applyReward = (step: Step, score: number) => {
      setModel((m) => applyStepReward(m, step, scoreToLevel(score)))
    }

    const startWindow = (g: GameState) => {
      g.phase = 'window'
      g.tMs = 0
      g.scoreSum = 0
      g.scoreCount = 0
    }

    const gotoNextStep = (g: GameState) => {
      const next = g.stepIndex + 1
      if (next >= g.steps.length) {
        g.phase = 'done'
        g.tMs = 0
        return
      }
      g.stepIndex = next
      g.phase = 'pause'
      g.tMs = 0
      setModel((m) => ({ ...m, activeIndex: g.steps[next].index })) // spin the next socket to the front
    }

    const resolveStep = (g: GameState, step: Step) => {
      const score = g.scoreCount > 0 ? g.scoreSum / g.scoreCount : 0
      applyReward(step, score)
      const level = scoreToLevel(score)
      setNoteScores((prev) => {
        const next = [...prev]
        const cur = next[step.index] ?? { mine: null, polish: null }
        next[step.index] = step.kind === 'mine' ? { ...cur, mine: level } : { ...cur, polish: level }
        return next
      })
      // Always report the result; it stays up through the between-note delay (pause/poor).
      g.resultMessage = `Nuotti ${letterOf(step.index)} - pisteet ${Math.round(score * 10)}/10`
      if (score < POOR_SCORE) {
        g.phase = 'poor'
        g.tMs = 0
      } else {
        gotoNextStep(g)
      }
    }

    const sampleFrame = (g: GameState, step: Step) => {
      const p = pitchRef.current
      let centered = 0
      if (p.listening && p.midi != null && p.cents != null) {
        const pc = ((p.midi % 12) + 12) % 12
        if (pc === scaleRef.current.targetPcs[step.index]) {
          centered = Math.max(0, Math.min(1, 1 - Math.abs(p.cents) / MAX_OFF_CENTS))
        }
      }
      g.scoreSum += centered // silence / wrong pitch contributes 0 → counts against the result
      g.scoreCount += 1
    }

    const advanceGame = (dt: number) => {
      const g = game.current
      if (g.phase === 'idle') return
      if (g.phase === 'done') {
        if (autoReplayRef.current && !admireRef.current) {
          g.tMs += dt
          if (g.tMs >= AUTO_REPLAY_MS) startRound.current()
        }
        return
      }
      // Playing phases only advance while the mic is live.
      if (!pitchRef.current.listening) return
      const step = g.steps[g.stepIndex]
      g.tMs += dt
      switch (g.phase) {
        case 'countdown':
          if (g.tMs >= COUNTDOWN_FROM * COUNTDOWN_STEP_MS) startWindow(g)
          break
        case 'pause':
          if (g.tMs >= BETWEEN_NOTE_MS) {
            if (step.immediateLabel) startWindow(g)
            else {
              g.phase = 'reveal'
              g.tMs = 0
            }
          }
          break
        case 'reveal':
          if (g.tMs >= LEVEL.revealAfterMs) startWindow(g)
          break
        case 'window':
          sampleFrame(g, step)
          if (g.tMs >= LEVEL.windowMs) resolveStep(g, step)
          break
        case 'poor':
          if (g.tMs >= BETWEEN_NOTE_MS) gotoNextStep(g)
          break
      }
    }

    const computeView = (): View => {
      const g = game.current
      const step = g.steps[g.stepIndex]
      switch (g.phase) {
        case 'idle':
          return IDLE_VIEW
        case 'countdown':
          return {
            phase: 'countdown',
            countdown: Math.max(1, Math.min(COUNTDOWN_FROM, COUNTDOWN_FROM - Math.floor(g.tMs / COUNTDOWN_STEP_MS))),
            noteLabel: letterOf(step.index),
            focusRing: true,
            barActive: false,
            timer: null,
            message: null,
            autoReplayLeft: null,
          }
        case 'pause':
          return {
            phase: 'pause',
            countdown: null,
            noteLabel: null,
            focusRing: true,
            barActive: false,
            timer: null,
            message: g.resultMessage,
            autoReplayLeft: null,
          }
        case 'reveal':
          return {
            phase: 'reveal',
            countdown: null,
            noteLabel: null,
            focusRing: true,
            barActive: false,
            timer: null,
            message: null,
            autoReplayLeft: null,
          }
        case 'window':
          return {
            phase: 'window',
            countdown: null,
            noteLabel: letterOf(step.index),
            focusRing: true,
            barActive: true,
            timer: Math.round(g.tMs / 100) / 10,
            message: null,
            autoReplayLeft: null,
          }
        case 'poor':
          return {
            phase: 'poor',
            countdown: null,
            noteLabel: step ? letterOf(step.index) : null,
            focusRing: false,
            barActive: false,
            timer: null,
            message: g.resultMessage,
            autoReplayLeft: null,
          }
        case 'done': {
          const counting = autoReplayRef.current && !admireRef.current
          return {
            phase: 'done',
            countdown: null,
            noteLabel: null,
            focusRing: false,
            barActive: false,
            timer: null,
            message: null,
            autoReplayLeft: counting ? Math.max(0, Math.ceil((AUTO_REPLAY_MS - g.tMs) / 1000)) : null,
          }
        }
      }
    }

    let lastView = IDLE_VIEW
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(100, now - lastNow))
      lastNow = now
      if (!pausedRef.current) advanceGame(dt)
      const next = computeView()
      if (!viewsEqual(next, lastView)) {
        lastView = next
        setView(next)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // Loop is created once and reads everything live via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Overlay handed to the canvas (read live via its own ref).
  const overlay: NecklaceOverlay = { countdown: view.countdown, noteLabel: view.noteLabel, focusRing: view.focusRing }

  // Live cents for the bar: only a valid in-tune reading on the *target* note shows.
  const detectedPc = pitch.midi == null ? null : ((pitch.midi % 12) + 12) % 12
  const curTargetPc = targetPcs[game.current.steps[game.current.stepIndex]?.index ?? 0]
  const barCents =
    view.barActive && pitch.cents != null && detectedPc != null && detectedPc === curTargetPc ? pitch.cents : null

  const playing = view.phase !== 'idle' && view.phase !== 'done'

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

  return (
    <div className='relative flex min-h-0 flex-1 flex-col bg-[#05060f]'>
      {/* Slim fixed header: back (mobile) + scale name + note count + info. */}
      <div className='flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#0a0d1c] px-2 py-1.5 text-white'>
        {!isDesktop && (
          <button
            onClick={() => navigate('/harjoittelu')}
            aria-label='Takaisin'
            className='flex h-8 w-8 items-center justify-center'
          >
            <svg
              width='22'
              height='22'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <polyline points='15 18 9 12 15 6' />
            </svg>
          </button>
        )}
        <div className='flex-1 truncate'>
          <span className='font-medieval text-base leading-tight'>{scaleLabel(root, mode)}</span>
          <span className='ml-2 text-xs text-white/55'>{socketCount} nuottia</span>
        </div>
        <button
          onClick={() => setInfoOpen(true)}
          aria-label='Ohje'
          className='flex h-8 w-8 items-center justify-center rounded-full text-white/85 hover:bg-white/10'
        >
          <svg width='22' height='22' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='1.8' />
            <text
              x='12'
              y='17'
              textAnchor='middle'
              fill='currentColor'
              fontSize='14'
              fontWeight='600'
              fontFamily='serif'
            >
              i
            </text>
          </svg>
        </button>
      </div>

      {/* Necklace hero — fills the viewport; overlays sit on top. */}
      <div className='relative min-h-0 flex-1'>
        <NecklaceCanvas model={model} overlay={overlay} className='absolute inset-0' />

        {/* Rolled colour-set name, shown during the count-in. */}
        {view.phase === 'countdown' && themeName && (
          <div className='pointer-events-none absolute inset-x-0 top-4 flex justify-center'>
            <span className='rounded-full bg-black/45 px-4 py-1 text-sm font-semibold text-white'>
              Teema: {themeName}
            </span>
          </div>
        )}

        {/* First-time idle prompt over the decorative full necklace. */}
        {view.phase === 'idle' && (
          <div className='absolute inset-0 flex flex-col items-center justify-end gap-4 px-6 pb-10 text-center'>
            <p className='max-w-[320px] rounded-2xl bg-black/55 px-5 py-4 text-base font-semibold leading-snug text-white'>
              Soita {scaleLabel(root, mode)} ylös ja sitten alas. Paremmin vireessä soittaen saat upeampia jalokiviä.
            </p>
            <button
              onClick={() => startRound.current()}
              className='min-h-[44px] rounded-xl bg-[#9fd0ff] px-8 text-base font-bold text-[#05060f] shadow-lg'
            >
              Aloita
            </button>
            {pitch.error && <p className='text-xs text-red-300'>{pitch.error}</p>}
          </div>
        )}

        {/* End-of-round: admire the finished necklace + auto-replay control. */}
        {view.phase === 'done' && (
          <div className='absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-6 pb-6 text-center'>
            <p className='rounded-xl bg-black/55 px-4 py-2 text-sm font-semibold text-white'>Kaulakoru on valmis!</p>
            <div className='flex flex-wrap items-center justify-center gap-2'>
              {view.autoReplayLeft != null ? (
                <>
                  <button
                    onClick={openAdmire}
                    className='min-h-[44px] rounded-xl bg-white/15 px-5 text-sm font-bold text-white'
                  >
                    Jää ihailemaan
                  </button>
                  <span className='text-sm text-white/70'>Uusi alkaa {view.autoReplayLeft} s…</span>
                </>
              ) : (
                <button
                  onClick={() => startRound.current()}
                  className='min-h-[44px] rounded-xl bg-[#9fd0ff] px-6 text-sm font-bold text-[#05060f]'
                >
                  Aloita uusi
                </button>
              )}
            </div>
            <label className='flex items-center gap-2 text-xs text-white/70'>
              <input type='checkbox' checked={autoReplayOn} onChange={(e) => setAutoReplayOn(e.target.checked)} />
              Aloita uusi kierros automaattisesti
            </label>
          </div>
        )}
      </div>

      {/* Tuning bar: present throughout play, disabled between notes, active in the window. */}
      {playing && (
        <TuningBar
          active={view.barActive}
          cents={barCents}
          goodZoneCents={GOOD_ZONE_CENTS}
          timerSeconds={view.barActive ? view.timer : null}
          message={view.message}
        />
      )}

      {/* Info dialog — opening it pauses the whole round; closing resumes from the same phase. */}
      {infoOpen && (
        <div
          className='absolute inset-0 z-20 flex items-center justify-center bg-black/60 px-6'
          onClick={() => setInfoOpen(false)}
        >
          <div
            className='max-w-[340px] rounded-2xl bg-[#fffbe9] p-5 text-[#3a1a00]'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='mb-2 font-medieval text-lg text-[#5a2d0c]'>Jalokiviasteikko</h2>
            <ul className='list-disc space-y-1.5 pl-5 text-sm leading-snug'>
              {HELP_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className='mt-4 flex justify-end'>
              <Button variant='outlined' color='secondary' size='sm' onClick={() => setInfoOpen(false)}>
                Sulje
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
